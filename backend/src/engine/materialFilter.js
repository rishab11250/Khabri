const HIGH_IMPACT_KEYWORDS =
  /\b(admit\s*card|hall\s*ticket|result|merit\s*list|date|deadline|last\s*date|extend(?:ed|sion)|cancel(?:led|lation)?|postpon(?:ed|ement)|vacanc(?:y|ies)|recruitment|schedule|exam(?:ination)?|eligib(?:le|ility)|cut-?off|notification|revised|corrigendum)\b/i;

const MEDIUM_IMPACT_KEYWORDS =
  /\b(clarification|guideline|syllabus|document|circular|instruction|faq|addendum|notice)\b/i;

function setsDiffer(a, b) {
  if (a.length !== b.length) return true;
  const setA = new Set(a);
  return b.some((x) => !setA.has(x));
}

export function evaluateMateriality({ diffResult, beforeSignals, afterSignals }) {
  if (!diffResult?.changed) {
    return {
      material: false,
      impact: 'LOW',
      kind: 'no_change',
      reasons: ['no_diff'],
    };
  }

  const prevDates = (beforeSignals?.dates || []).map((d) => d.iso);
  const nextDates = (afterSignals?.dates || []).map((d) => d.iso);
  const datesChanged = setsDiffer(prevDates, nextDates);

  const numbersChanged = setsDiffer(beforeSignals?.numbers || [], afterSignals?.numbers || []);
  const eligibilityChanged = setsDiffer(
    beforeSignals?.eligibility || [],
    afterSignals?.eligibility || [],
  );

  if (diffResult.type === 'listing') {
    const addedTitles = diffResult.added.map((i) => `${i.title} ${i.dateText}`).join(' ');
    const updatedTitles = diffResult.updated
      .map((u) => `${u.after.title} ${u.after.dateText}`)
      .join(' ');
    const combinedText = `${addedTitles} ${updatedTitles}`;

    let kind = 'notice_updated';
    if (diffResult.added.length > 0) kind = 'new_notice';
    else if (diffResult.removed.length > 0 && diffResult.updated.length === 0) {
      kind = 'notice_removed';
    }

    let impact = 'MEDIUM';
    const reasons = [];
    if (diffResult.added.length > 0) reasons.push(`added:${diffResult.added.length}`);
    if (diffResult.updated.length > 0) reasons.push(`updated:${diffResult.updated.length}`);
    if (diffResult.removed.length > 0) reasons.push(`removed:${diffResult.removed.length}`);

    if (
      datesChanged ||
      numbersChanged ||
      eligibilityChanged ||
      HIGH_IMPACT_KEYWORDS.test(combinedText)
    ) {
      impact = 'HIGH';
      if (datesChanged) reasons.push('dates_changed');
      if (numbersChanged) reasons.push('numbers_changed');
      if (eligibilityChanged) reasons.push('eligibility_changed');
    }

    return { material: true, impact, kind, reasons };
  }

  // Page diff
  const reasons = [];
  if (datesChanged) reasons.push('dates_changed');
  if (numbersChanged) reasons.push('numbers_changed');
  if (eligibilityChanged) reasons.push('eligibility_changed');

  if (datesChanged || numbersChanged || eligibilityChanged) {
    return {
      material: true,
      impact: 'HIGH',
      kind: datesChanged ? 'date_change' : 'rule_change',
      reasons,
    };
  }

  const changedText = `${diffResult.beforeExcerpt} ${diffResult.afterExcerpt}`;
  if (diffResult.changedChars < 25) {
    return {
      material: false,
      impact: 'LOW',
      kind: 'minor_noise',
      reasons: ['below_char_threshold'],
    };
  }

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

  return {
    material: true,
    impact,
    kind: 'page_update',
    reasons,
  };
}
