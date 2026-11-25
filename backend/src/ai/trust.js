const OFFICIAL_DOMAIN_SUFFIXES = ['.gov.in', '.nic.in', '.ac.in', '.edu.in', '.res.in'];

export function isOfficialDomain(rawUrl) {
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

export function resolveTrustTag({ source, url } = {}) {
  if (source?.isDemo || source?.trust === 'official' || isOfficialDomain(url || source?.url)) {
    return 'official';
  }
  if (source?.type === 'search' || source?.trust === 'reported') {
    return 'reported';
  }
  return 'unverified';
}

const URL_REGEX = /https?:\/\/[^\s<>)"']+/gi;

export function extractUrls(text) {
  const matches = String(text || '').match(URL_REGEX) || [];
  return matches.map((u) => u.replace(/[.,;:!?]+$/, ''));
}

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
