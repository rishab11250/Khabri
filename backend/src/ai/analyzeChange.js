/**
 * Summarizes detected portal changes via the AI router with a deterministic rules fallback.
 * Deliberately rejects AI replies containing ungrounded URLs or schema mismatches rather
 * than trusting model output blindly.
 */
import { buildAiCacheKey, getCachedAi, setCachedAi } from './cache.js';
import { buildChangeAnalysisPrompt, CHANGE_ANALYSIS_SYSTEM_PROMPT } from './prompts.js';
import { createAiRouter } from './router.js';
import { CHANGE_ANALYSIS_JSON_SCHEMA, changeAnalysisSchema } from './schemas.js';
import { hasDisallowedUrls } from './trust.js';

function summarizeListingDiff(diffResult) {
  const topItem = diffResult.added[0] || diffResult.updated[0]?.after;
  const firstBefore = diffResult.updated[0]?.before?.title;
  const firstRemoved = diffResult.removed[0]?.title;
  const before = firstBefore || firstRemoved || 'Previous notice list';

  if (!topItem) {
    return { before, after: 'Notice list updated' };
  }
  const dateSuffix = topItem.dateText ? ` (${topItem.dateText})` : '';
  return { before, after: `${topItem.title}${dateSuffix}` };
}

function summarizeBeforeAfter(diffResult) {
  if (diffResult.type === 'listing') {
    return summarizeListingDiff(diffResult);
  }

  return {
    before: diffResult.beforeExcerpt || 'Previous page wording',
    after: diffResult.afterExcerpt || 'Updated page wording',
  };
}

/**
 * Produces a deterministic change summary without calling an external LLM.
 * Used as fallback when AI providers are unavailable, exhausted, or fail output checks.
 *
 * @param {object} params - Extracted change context.
 * @param {object} params.diffResult - Listing or page diff output.
 * @param {object} params.material - Materiality classification (`impact`, `kind`).
 * @param {object} [params.afterSignals] - Rule-extracted dates/signals from new content.
 * @param {object} params.source - Source metadata (`name`).
 * @returns {object} Change analysis object matching the UI/storage contract.
 */
function buildRulesOnlyAnalysis({ diffResult, material, afterSignals, source }) {
  const { before, after } = summarizeBeforeAfter(diffResult);

  return {
    impact: material.impact,
    kind: material.kind,
    before: before.slice(0, 600),
    after: after.slice(0, 600),
    whyItMatters: `Detected ${material.kind.replace(/_/g, ' ')} on ${source.name}.`,
    checklist: [
      'Open the linked official notice page to verify exact details.',
      'Check dates and eligibility requirements before applying.',
    ],
    dates: (afterSignals?.dates || []).map((d) => ({
      label: d.label,
      iso: d.iso,
      confidence: d.confidence,
    })),
    confidence: 0.55,
    aiGenerated: false,
  };
}

async function attemptRouterAnalysis({ router, prompt, allowedTexts }) {
  const { result } = await router.generateJson({
    role: 'background',
    prompt,
    systemInstruction: CHANGE_ANALYSIS_SYSTEM_PROMPT,
    jsonSchema: CHANGE_ANALYSIS_JSON_SCHEMA,
  });

  const parsed = changeAnalysisSchema.safeParse(result);
  if (!parsed.success) return null;

  const textToCheck = [
    parsed.data.before,
    parsed.data.after,
    parsed.data.whyItMatters,
    ...parsed.data.checklist,
  ].join(' ');
  // Guard against hallucinated/phishing links injected via prompt-injection in page HTML.
  if (hasDisallowedUrls(textToCheck, allowedTexts)) return null;

  return { ...parsed.data, aiGenerated: true };
}

async function tryRouterWithRetries({ router, prompt, allowedTexts, cacheKey, skipCache }) {
  // Retry once for transient schema or URL glitches; abort immediately on provider exceptions.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const output = await attemptRouterAnalysis({ router, prompt, allowedTexts });
      if (!output) continue;
      if (!skipCache) {
        await setCachedAi(cacheKey, output);
      }
      return output;
    } catch {
      break;
    }
  }
  return null;
}

/**
 * Analyzes a material source change using cache, AI router with validation, or rules fallback.
 *
 * @param {object} context - Source, diff, signals, and before/after text excerpts.
 * @param {object} context.source - Source document being monitored.
 * @param {object} context.diffResult - Listing or page diff payload.
 * @param {object} context.material - Materiality classification result.
 * @param {object} [context.afterSignals] - Rule-extracted dates/signals from new content.
 * @param {string} [context.beforeText] - Previous normalized text excerpt.
 * @param {string} [context.afterText] - Updated normalized text excerpt.
 * @param {object} [options] - Optional router injection and cache bypass flag (`skipCache`).
 * @returns {Promise<object>} Validated AI analysis or deterministic rules-only analysis.
 */
export async function analyzeChangeWithRouter(
  { source, diffResult, material, afterSignals, beforeText, afterText },
  options = {},
) {
  const cacheKey = buildAiCacheKey({
    task: 'change_analysis',
    language: source.language || 'en',
    input: {
      sourceUrl: source.url,
      beforeText: String(beforeText || '').slice(0, 2000),
      afterText: String(afterText || '').slice(0, 2000),
    },
  });

  if (!options.skipCache) {
    const cached = await getCachedAi(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }
  }

  const aiResult = await tryRouterWithRetries({
    router: options.router ?? createAiRouter(),
    prompt: buildChangeAnalysisPrompt({
      source,
      beforeText,
      afterText,
      extractedDates: afterSignals?.dates || [],
    }),
    allowedTexts: [source.url, beforeText, afterText],
    cacheKey,
    skipCache: options.skipCache,
  });

  return aiResult ?? buildRulesOnlyAnalysis({ diffResult, material, afterSignals, source });
}
