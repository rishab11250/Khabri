const MONTHS = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function toIsoDate(year, month, day) {
  const y = year < 100 ? 2000 + year : year;
  if (y < 2000 || y > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  const dt = new Date(Date.UTC(y, month - 1, day));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) {
    return null;
  }
  return `${String(y).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function inferDateLabel(context) {
  const lower = context.toLowerCase();
  if (/admit\s*card|hall\s*ticket/.test(lower)) return 'Admit card date';
  if (
    /last\s*date|deadline|closing|apply\s*(?:by|until|till)|extended\s*(?:to|until|till)/.test(
      lower,
    )
  ) {
    return 'Application deadline';
  }
  if (/exam(?:ination)?\s*date|scheduled\s*(?:on|for)|test\s*date/.test(lower)) return 'Exam date';
  if (/result|merit\s*list|score\s*card/.test(lower)) return 'Result date';
  if (/verif|counsell|interview|document/.test(lower)) return 'Verification / Counselling';
  return 'Important date';
}

export function extractDates(text) {
  const source = String(text || '');
  const found = [];
  const seen = new Set();

  const patterns = [
    // YYYY-MM-DD
    {
      regex: /\b(20\d{2})[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/g,
      parse: (m) => toIsoDate(Number(m[1]), Number(m[2]), Number(m[3])),
    },
    // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    {
      regex: /\b(0?[1-9]|[12]\d|3[01])[-/.](0?[1-9]|1[0-2])[-/.](20\d{2}|\d{2})\b/g,
      parse: (m) => toIsoDate(Number(m[3]), Number(m[2]), Number(m[1])),
    },
    // DD Month YYYY (e.g. 15 Dec 2026 / 30 December 2026)
    {
      regex:
        /\b(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?),?\s+(20\d{2})\b/gi,
      parse: (m) => toIsoDate(Number(m[3]), MONTHS[m[2].toLowerCase()], Number(m[1])),
    },
    // Month DD, YYYY (e.g. December 30, 2026)
    {
      regex:
        /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?,?\s+(20\d{2})\b/gi,
      parse: (m) => toIsoDate(Number(m[3]), MONTHS[m[1].toLowerCase()], Number(m[2])),
    },
  ];

  for (const { regex, parse } of patterns) {
    for (const match of source.matchAll(regex)) {
      const iso = parse(match);
      if (!iso || seen.has(iso)) continue;
      seen.add(iso);
      const matchIndex = match.index ?? 0;
      const windowStart = Math.max(0, matchIndex - 80);
      const windowEnd = Math.min(source.length, matchIndex + match[0].length + 60);
      const beforeChunk = source.slice(windowStart, matchIndex);
      const afterChunk = source.slice(matchIndex + match[0].length, windowEnd);
      const sentenceBefore = beforeChunk.split(/[.!?\n]/).pop() ?? beforeChunk;
      const sentenceAfter = afterChunk.split(/[.!?\n]/)[0] ?? afterChunk;
      const context = `${sentenceBefore} ${match[0]} ${sentenceAfter}`;
      const label = inferDateLabel(context);
      const confidence = label === 'Important date' ? 0.65 : 0.85;
      found.push({ raw: match[0], iso, label, confidence });
    }
  }

  return found;
}

export function extractNumbers(text) {
  const source = String(text || '');
  const numbers = new Set();

  const regexes = [
    /(?:rs\.?|inr|₹)\s*[\d,]+(?:\.\d+)?/gi,
    /\b\d[\d,]*\s*(?:vacancies|posts?|seats?|marks|percent|%)/gi,
    /\b\d+(?:\.\d+)?%/g,
    /\b(?:age\s*(?:limit|between|max|min)?\s*:?\s*)?\d{2}\s*(?:years?|yrs?)\b/gi,
  ];

  for (const re of regexes) {
    for (const m of source.matchAll(re)) {
      numbers.add(m[0].trim().replace(/\s+/g, ' '));
    }
  }

  return [...numbers];
}

const ELIGIBILITY_KEYWORDS =
  /\b(eligib(?:le|ility)|qualif(?:ication|ied)|degree|graduate|post-?graduate|diploma|percentage|marks|age\s*limit|relaxation|income\s*(?:limit|ceiling)|domicile|category|sc\/st|obc|ews|pwd|citizen\s+of\s+india)\b/i;

export function extractEligibility(text) {
  const sentences = String(text || '')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 12);

  return sentences.filter((s) => ELIGIBILITY_KEYWORDS.test(s));
}

export function extractSignals(text) {
  return {
    dates: extractDates(text),
    numbers: extractNumbers(text),
    eligibility: extractEligibility(text),
  };
}
