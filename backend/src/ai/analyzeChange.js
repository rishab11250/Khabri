import { buildAiCacheKey, getCachedAi, setCachedAi } from './cache.js';
import { buildChangeAnalysisPrompt, CHANGE_ANALYSIS_SYSTEM_PROMPT } from './prompts.js';
import { createAiRouter } from './router.js';
import { CHANGE_ANALYSIS_JSON_SCHEMA, changeAnalysisSchema } from './schemas.js';
import { hasDisallowedUrls } from './trust.js';

export function buildRulesOnlyAnalysis({ diffResult, material, afterSignals, source }) {
  let before;
  let after;

  if (diffResult.type === 'listing') {
    const topItem = diffResult.added[0] || diffResult.updated[0]?.after;
    before =
      diffResult.updated[0]?.before?.title ||
      diffResult.removed[0]?.title ||
      'Previous notice list';
    after = topItem
      ? `${topItem.title}${topItem.dateText ? ` (${topItem.dateText})` : ''}`
      : 'Notice list updated';
  } else {
    before = diffResult.beforeExcerpt || 'Previous page wording';
    after = diffResult.afterExcerpt || 'Updated page wording';
  }

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

  const router = options.router ?? createAiRouter();
  const prompt = buildChangeAnalysisPrompt({
    source,
    beforeText,
    afterText,
    extractedDates: afterSignals?.dates || [],
  });

  const allowedTexts = [source.url, beforeText, afterText];

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const { result } = await router.generateJson({
        role: 'background',
        prompt,
        systemInstruction: CHANGE_ANALYSIS_SYSTEM_PROMPT,
        jsonSchema: CHANGE_ANALYSIS_JSON_SCHEMA,
      });

      const parsed = changeAnalysisSchema.safeParse(result);
      if (!parsed.success) {
        continue;
      }

      const textToCheck = [
        parsed.data.before,
        parsed.data.after,
        parsed.data.whyItMatters,
        ...parsed.data.checklist,
      ].join(' ');
      if (hasDisallowedUrls(textToCheck, allowedTexts)) {
        continue;
      }

      const output = { ...parsed.data, aiGenerated: true };
      if (!options.skipCache) {
        await setCachedAi(cacheKey, output);
      }
      return output;
    } catch {
      break;
    }
  }

  return buildRulesOnlyAnalysis({ diffResult, material, afterSignals, source });
}
