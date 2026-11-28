/**
 * Classifies whether a structural diff is actionable news or ignorable boilerplate noise.
 * Deliberately rejects page edits below 25 characters unless dates, numbers, or eligibility changed,
 * preventing ticker/typos from consuming AI calls or spamming users.
 */
const HIGH_IMPACT_KEYWORDS =
  /\b(admit\s*card|hall\s*ticket|result|merit\s*list|date|deadline|last\s*date|extend(?:ed|sion)|cancel(?:led|lation)?|postpon(?:ed|ement)|vacanc(?:y|ies)|recruitment|schedule|exam(?:ination)?|eligib(?:le|ility)|cut-?off|notification|revised|corrigendum)\b/i;

const MEDIUM_IMPACT_KEYWORDS =
  /\b(clarification|guideline|syllabus|document|circular|instruction|faq|addendum|notice)\b/i;

function setsDiffer(a, b) {
  if (a.length !== b.length) return true;
  const setA = new Set(a);
  return b.some((x) => !setA.has(x));
}

function extractDateIsos(signals) {
  return (signals?.dates || []).map((d) => d.iso);
}

function collectSignalChanges(beforeSignals = {}, afterSignals = {}) {
  const datesChanged = setsDiffer(extractDateIsos(beforeSignals), extractDateIsos(afterSignals));
  const numbersChanged = setsDiffer(beforeSignals.numbers || [], afterSignals.numbers || []);
  const eligibilityChanged = setsDiffer(
    beforeSignals.eligibility || [],
    afterSignals.eligibility || [],
  );

  const signalReasons = [
    datesChanged ? 'dates_changed' : null,
    numbersChanged ? 'numbers_changed' : null,
    eligibilityChanged ? 'eligibility_changed' : null,
  ].filter(Boolean);

  return {
    datesChanged,
    signalChanged: signalReasons.length > 0,
    signalReasons,
  };
}

function resolveListingKind(diffResult) {
  if (diffResult.added.length > 0) return 'new_notice';
  if (diffResult.removed.length > 0 && diffResult.updated.length === 0) return 'notice_removed';
  return 'notice_updated';
}

function evaluateListingMateriality(diffResult, { signalChanged, signalReasons }) {
  const addedTitles = diffResult.added.map((i) => `${i.title} ${i.dateText}`).join(' ');
  const updatedTitles = diffResult.updated
    .map((u) => `${u.after.title} ${u.after.dateText}`)
    .join(' ');
  const combinedText = `${addedTitles} ${updatedTitles}`;

  const reasons = [];
  if (diffResult.added.length > 0) reasons.push(`added:${diffResult.added.length}`);
  if (diffResult.updated.length > 0) reasons.push(`updated:${diffResult.updated.length}`);
  if (diffResult.removed.length > 0) reasons.push(`removed:${diffResult.removed.length}`);

  const isHigh = signalChanged || HIGH_IMPACT_KEYWORDS.test(combinedText);
  if (isHigh) reasons.push(...signalReasons);

  return {
    material: true,
    impact: isHigh ? 'HIGH' : 'MEDIUM',
    kind: resolveListingKind(diffResult),
    reasons,
  };
}

function evaluatePageMateriality(diffResult, { datesChanged, signalChanged, signalReasons }) {
  // Date, numeric, or eligibility diffs always surface as HIGH regardless of short character count.
  if (signalChanged) {
    return {
      material: true,
      impact: 'HIGH',
      kind: datesChanged ? 'date_change' : 'rule_change',
      reasons: [...signalReasons],
    };
  }

  // Filter trivial punctuation/whitespace tweaks under 25 characters without signal changes.
  if (diffResult.changedChars < 25) {
    return {
      material: false,
      impact: 'LOW',
      kind: 'minor_noise',
      reasons: ['below_char_threshold'],
    };
  }

  const changedText = `${diffResult.beforeExcerpt} ${diffResult.afterExcerpt}`;
  const reasons = [];
  let impact = 'LOW';

  if (HIGH_IMPACT_KEYWORDS.test(changedText)) {
    impact = 'HIGH';
    reasons.push('high_keyword_match');
  } else if (MEDIUM_IMPACT_KEYWORDS.test(changedText) || diffResult.changedChars >= 100) {
    impact = 'MEDIUM';
    reasons.push('substantive_text_change');
  } else {
    reasons.push('minor_wording_change');
  }

  return { material: true, impact, kind: 'page_update', reasons };
}

/**
 * Evaluates a diff and extracted signals to decide whether a change warrants AI analysis and alerts.
 *
 * @param {object} params - Diff output and extracted before/after signals.
 * @param {object} params.diffResult - Output from `diffListings` or `diffPages`.
 * @param {object} [params.beforeSignals] - Signals from the previous snapshot.
 * @param {object} [params.afterSignals] - Signals from the new snapshot.
 * @returns {{ material: boolean, impact: 'HIGH'|'MEDIUM'|'LOW', kind: string, reasons: string[] }} Materiality decision.
 */
export function evaluateMateriality({ diffResult, beforeSignals, afterSignals }) {
  if (!diffResult?.changed) {
    return {
      material: false,
      impact: 'LOW',
      kind: 'no_change',
      reasons: ['no_diff'],
    };
  }

  const signalInfo = collectSignalChanges(beforeSignals, afterSignals);
  if (diffResult.type === 'listing') {
    return evaluateListingMateriality(diffResult, signalInfo);
  }
  return evaluatePageMateriality(diffResult, signalInfo);
}
