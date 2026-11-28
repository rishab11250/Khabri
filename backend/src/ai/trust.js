/**
 * Determines deterministic source trust tags and detects ungrounded URLs in AI responses.
 * Deliberately computes trust in application code rather than letting LLMs self-certify authority.
 */
const OFFICIAL_DOMAIN_SUFFIXES = ['.gov.in', '.nic.in', '.ac.in', '.edu.in', '.res.in'];

/**
 * Checks whether a URL belongs to an official Indian government or academic domain suffix.
 *
 * @param {string} rawUrl - URL to inspect.
 * @returns {boolean} True when the hostname matches or ends with an official suffix.
 */
function isOfficialDomain(rawUrl) {
  if (!rawUrl) return false;
  try {
    const hostname = new URL(rawUrl).hostname.toLowerCase();
    return OFFICIAL_DOMAIN_SUFFIXES.some(
      (suffix) => hostname === suffix.slice(1) || hostname.endsWith(suffix),
    );
  } catch {
    return false;
  }
}

function hasOfficialTrustFlag(source) {
  return Boolean(source?.isDemo) || source?.trust === 'official';
}

/**
 * Computes the server-authoritative trust tier (`official`, `reported`, or `unverified`).
 * Trust must never be chosen by AI models because official provenance is a security guarantee.
 *
 * @param {object} [params] - Source document and/or target URL.
 * @param {object} [params.source] - Source record metadata.
 * @param {string} [params.url] - Explicit override URL when checking a standalone link.
 * @returns {'official'|'reported'|'unverified'} Verified trust classification.
 */
export function resolveTrustTag({ source, url } = {}) {
  if (hasOfficialTrustFlag(source) || isOfficialDomain(url ?? source?.url)) {
    return 'official';
  }
  if (source?.type === 'search' || source?.trust === 'reported') {
    return 'reported';
  }
  return 'unverified';
}

const URL_REGEX = /https?:\/\/[^\s<>)"']+/gi;

/**
 * Extracts HTTP(S) URLs from text while trimming trailing sentence punctuation.
 *
 * @param {string} text - Free-form text potentially containing URLs.
 * @returns {string[]} Extracted URL strings.
 */
function extractUrls(text) {
  const matches = String(text || '').match(URL_REGEX) || [];
  return matches.map((u) => u.replace(/[.,;:!?]+$/, ''));
}

/**
 * Detects whether AI output introduces any URL that did not already appear in trusted source inputs.
 * Prevents prompt-injected notices from smearing phishing links into summaries or answers.
 *
 * @param {string} outputText - Combined AI response text to audit.
 * @param {string[]} [allowedSourceTextsOrUrls] - Source URLs and original snapshot excerpts.
 * @returns {boolean} True if an ungrounded URL was emitted.
 */
export function hasDisallowedUrls(outputText, allowedSourceTextsOrUrls = []) {
  const allowedUrls = new Set();
  for (const item of allowedSourceTextsOrUrls) {
    for (const url of extractUrls(item)) {
      allowedUrls.add(url.toLowerCase());
    }
  }

  const emitted = extractUrls(outputText);
  return emitted.some((u) => !allowedUrls.has(u.toLowerCase()));
}
