/**
 * Handles grounded Ask Khabri Q&A over a user's stored changes and snapshots.
 * Deliberately rejects responses containing URLs absent from stored evidence and enforces
 * daily per-user quota before invoking the AI router.
 */
import { wrapUntrustedData } from '../ai/prompts.js';
import { consumeUserDailyQuota } from '../ai/quota.js';
import { createAiRouter } from '../ai/router.js';
import { hasDisallowedUrls } from '../ai/trust.js';
import { AppError } from '../middleware/envelope.js';
import { Change, Snapshot, Source, Watch } from '../models/index.js';
import { ASK_JSON_SCHEMA, askOutputSchema } from '../validators/ask.validator.js';

const ASK_SYSTEM_INSTRUCTION = [
  'You are Khabri assistant. Answer ONLY using the provided JSON records from the user’s watched sources.',
  'Cite exact changeId values in citedChangeIds. Never invent dates, URLs, or facts.',
  'If the stored data does not contain the answer, set found=false and clearly state that the stored notices do not have that information.',
  'Return JSON only.',
].join(' ');

function buildRecordsContext(sourceMap, changes, snapshots) {
  return [
    ...changes.map((c) => ({
      changeId: String(c._id),
      source: sourceMap.get(String(c.sourceId))?.name || 'Source',
      detectedAt: new Date(c.detectedAt).toISOString().slice(0, 10),
      impact: c.impact,
      before: c.before,
      after: c.after,
      why: c.analysis?.why || '',
    })),
    ...snapshots.slice(0, 5).map((s) => ({
      snapshotSource: sourceMap.get(String(s.sourceId))?.name || 'Source',
      takenAt: new Date(s.takenAt).toISOString().slice(0, 10),
      excerpt: String(s.textExcerpt || '').slice(0, 400),
    })),
  ];
}

function buildAskCitations(citedChangeIds, changeMap, sourceMap) {
  return citedChangeIds
    .filter((cid) => changeMap.has(cid))
    .map((cid) => {
      const c = changeMap.get(cid);
      return {
        changeId: cid,
        sourceName: sourceMap.get(String(c.sourceId))?.name || 'Source',
        detectedAt: c.detectedAt,
        after: c.after,
      };
    });
}

/**
 * Answers a user question strictly from recent stored changes and snapshots within `scope`.
 *
 * @param {object} params - Query inputs and optional router override.
 * @param {string|object} params.userId - Authenticated user ID.
 * @param {string} params.scope - `'all'` or a specific watched `Source` ObjectId string.
 * @param {string} params.question - User's natural-language question.
 * @param {object} [params.aiRouter] - Optional AI router mock/override.
 * @returns {Promise<{ found: boolean, answer: string, citations: Array<object>, remainingToday: number }>} Grounded answer.
 * @throws {AppError} On quota exhaustion (429), ungrounded URLs (502), or AI unavailability (502).
 */
export async function answerUserQuestion({ userId, scope, question, aiRouter }) {
  const quota = await consumeUserDailyQuota({ userId, kind: 'ask' });
  if (!quota.allowed) {
    throw new AppError(429, 'ASK_QUOTA_EXCEEDED', 'Daily limit of 10 questions reached');
  }

  const remainingToday = Math.max(0, quota.limit - quota.used);
  const watches = await Watch.find({ userId }).select('sourceId').lean();
  const sourceIds =
    scope === 'all'
      ? watches.map((w) => w.sourceId)
      : watches.map((w) => w.sourceId).filter((id) => String(id) === scope);

  if (sourceIds.length === 0) {
    return {
      found: false,
      answer: 'No watched sources matched this scope. Add a watch first.',
      citations: [],
      remainingToday,
    };
  }

  const [sources, changes, snapshots] = await Promise.all([
    Source.find({ _id: { $in: sourceIds } })
      .select('name url')
      .lean(),
    Change.find({ sourceId: { $in: sourceIds } })
      .sort({ detectedAt: -1 })
      .limit(15)
      .lean(),
    Snapshot.find({ sourceId: { $in: sourceIds } })
      .sort({ takenAt: -1 })
      .limit(10)
      .lean(),
  ]);

  if (changes.length === 0 && snapshots.length === 0) {
    return {
      found: false,
      answer: 'I could not find any stored updates or snapshots for your watched sources yet.',
      citations: [],
      remainingToday,
    };
  }

  const sourceMap = new Map(sources.map((s) => [String(s._id), s]));
  const changeMap = new Map(changes.map((c) => [String(c._id), c]));
  const recordsContext = buildRecordsContext(sourceMap, changes, snapshots);
  const routerAi = aiRouter ?? createAiRouter();

  try {
    const { result: aiReply } = await routerAi.generateJson({
      role: 'user',
      systemInstruction: ASK_SYSTEM_INSTRUCTION,
      prompt: [
        `Question: ${question}`,
        wrapUntrustedData('STORED_RECORDS', JSON.stringify(recordsContext)),
      ].join('\n\n'),
      jsonSchema: ASK_JSON_SCHEMA,
    });

    const parsed = askOutputSchema.parse(aiReply);
    const allowedTexts = [
      ...sources.map((s) => s.url),
      ...changes.map((c) => `${c.before} ${c.after}`),
    ];
    if (hasDisallowedUrls(parsed.answer, allowedTexts)) {
      throw new AppError(502, 'ASK_REJECTED', 'Response contained disallowed URL');
    }

    return {
      found: parsed.found,
      answer: parsed.answer,
      citations: buildAskCitations(parsed.citedChangeIds, changeMap, sourceMap),
      remainingToday,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(502, 'ASK_FAILED', err?.message || 'Ask Khabri unavailable');
  }
}
