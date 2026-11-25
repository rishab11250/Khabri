import dns from 'node:dns/promises';
import net from 'node:net';
import axios from 'axios';

export const ALLOWED_CONTENT_TYPES = [
  'text/html',
  'application/xhtml+xml',
  'application/xml',
  'text/xml',
  'application/rss+xml',
  'application/atom+xml',
  'application/pdf',
];

export const DEFAULT_TIMEOUT_MS = 8000;
export const DEFAULT_MAX_BYTES = 3 * 1024 * 1024;
export const MAX_REDIRECTS = 3;
export const BOT_USER_AGENT = 'KhabriBot/1.0 (+https://khabri.app/bot; notice-watcher)';

export class SsrfError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'SsrfError';
    this.code = code;
  }
}

function ipv4ToInt(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) {
    return null;
  }
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function inCidr4(ipInt, baseStr, maskBits) {
  const baseInt = ipv4ToInt(baseStr);
  if (baseInt === null) return false;
  const mask = maskBits === 0 ? 0 : (~0 << (32 - maskBits)) >>> 0;
  return (ipInt & mask) === (baseInt & mask);
}

const BLOCKED_IPV4_CIDRS = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
];

export function isBlockedIp(rawIp) {
  const ip = String(rawIp || '')
    .trim()
    .split('%')[0];
  const version = net.isIP(ip);
  if (version === 0) return true;

  if (version === 4) {
    const ipInt = ipv4ToInt(ip);
    if (ipInt === null) return true;
    return BLOCKED_IPV4_CIDRS.some(([base, bits]) => inCidr4(ipInt, base, bits));
  }

  const lower = ip.toLowerCase();
  if (lower === '::' || lower === '::1') return true;
  if (lower.startsWith('::ffff:')) {
    const mapped = lower.slice('::ffff:'.length);
    if (net.isIPv4(mapped)) {
      return isBlockedIp(mapped);
    }
    const hexParts = mapped.split(':');
    if (hexParts.length === 2) {
      const hi = parseInt(hexParts[0], 16);
      const lo = parseInt(hexParts[1], 16);
      if (!Number.isNaN(hi) && !Number.isNaN(lo)) {
        const ipv4 = `${(hi >> 8) & 255}.${hi & 255}.${(lo >> 8) & 255}.${lo & 255}`;
        return isBlockedIp(ipv4);
      }
    }
    return true;
  }

  // Unique local fc00::/7 (fc.. or fd..), link-local fe80::/10 (fe80..febf), multicast ff00::/8
  const firstHextet = parseInt(lower.split(':')[0] || '0', 16);
  if (Number.isNaN(firstHextet)) return true;
  if ((firstHextet & 0xfe00) === 0xfc00) return true;
  if ((firstHextet & 0xffc0) === 0xfe80) return true;
  if ((firstHextet & 0xff00) === 0xff00) return true;

  return false;
}

export async function validateSafeUrl(rawUrl, options = {}) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new SsrfError('INVALID_URL', 'Malformed URL');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new SsrfError('SSRF_PROTOCOL_BLOCKED', `Disallowed protocol: ${parsed.protocol}`);
  }

  if (parsed.username || parsed.password) {
    throw new SsrfError('SSRF_CREDENTIALS_BLOCKED', 'URL credentials are not allowed');
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '');
  if (!hostname) {
    throw new SsrfError('INVALID_URL', 'URL missing hostname');
  }

  if (options.allowPrivateHosts) {
    return { parsed, addresses: [] };
  }

  if (hostname === 'localhost' || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    throw new SsrfError('SSRF_HOST_BLOCKED', `Blocked internal hostname: ${hostname}`);
  }

  if (net.isIP(hostname) !== 0) {
    if (isBlockedIp(hostname)) {
      throw new SsrfError('SSRF_IP_BLOCKED', `Blocked private/reserved IP: ${hostname}`);
    }
    return { parsed, addresses: [{ address: hostname, family: net.isIP(hostname) }] };
  }

  const lookupFn = options.lookupFn ?? ((host) => dns.lookup(host, { all: true }));
  let records;
  try {
    records = await lookupFn(hostname);
  } catch {
    throw new SsrfError('DNS_RESOLUTION_FAILED', `Could not resolve host: ${hostname}`);
  }

  if (!Array.isArray(records) || records.length === 0) {
    throw new SsrfError('DNS_RESOLUTION_FAILED', `No DNS records for host: ${hostname}`);
  }

  for (const rec of records) {
    if (isBlockedIp(rec.address)) {
      throw new SsrfError('SSRF_IP_BLOCKED', `Resolved to blocked IP: ${rec.address}`);
    }
  }

  return { parsed, addresses: records };
}

export function isAllowedContentType(headerValue, allowedTypes = ALLOWED_CONTENT_TYPES) {
  if (!headerValue) return false;
  const mime = String(headerValue).split(';')[0].trim().toLowerCase();
  return allowedTypes.includes(mime);
}

export async function safeFetch(rawUrl, options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const maxRedirects = options.maxRedirects ?? MAX_REDIRECTS;
  const allowedContentTypes = options.allowedContentTypes ?? ALLOWED_CONTENT_TYPES;
  const httpClient = options.httpClient ?? axios;

  let currentUrl = rawUrl;

  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    await validateSafeUrl(currentUrl, {
      lookupFn: options.lookupFn,
      allowPrivateHosts: options.allowPrivateHosts,
    });

    const headers = {
      'User-Agent': BOT_USER_AGENT,
      Accept:
        'text/html,application/xhtml+xml,application/xml,text/xml,application/pdf;q=0.9,*/*;q=0.8',
      ...options.headers,
    };

    const response = await httpClient.request({
      url: currentUrl,
      method: 'GET',
      headers,
      timeout: timeoutMs,
      maxRedirects: 0,
      maxContentLength: maxBytes,
      maxBodyLength: maxBytes,
      responseType: 'arraybuffer',
      validateStatus: () => true,
    });

    const status = response.status;
    if (status >= 300 && status < 400 && response.headers?.location) {
      if (hop >= maxRedirects) {
        throw new SsrfError('TOO_MANY_REDIRECTS', `Exceeded ${maxRedirects} redirects`);
      }
      currentUrl = new URL(response.headers.location, currentUrl).toString();
      continue;
    }

    if (status === 304) {
      return {
        status: 304,
        notModified: true,
        finalUrl: currentUrl,
        contentType: response.headers?.['content-type'] ?? '',
        etag: response.headers?.etag ?? null,
        lastModified: response.headers?.['last-modified'] ?? null,
        buffer: Buffer.alloc(0),
      };
    }

    const contentLengthHeader = Number(response.headers?.['content-length'] ?? 0);
    if (contentLengthHeader > maxBytes) {
      throw new SsrfError('RESPONSE_TOO_LARGE', `Content-Length exceeds ${maxBytes} bytes`);
    }

    const buffer = Buffer.isBuffer(response.data)
      ? response.data
      : Buffer.from(response.data ?? '');
    if (buffer.byteLength > maxBytes) {
      throw new SsrfError('RESPONSE_TOO_LARGE', `Response body exceeds ${maxBytes} bytes`);
    }

    const contentType = response.headers?.['content-type'] ?? '';
    if (status >= 200 && status < 300 && !options.skipContentTypeCheck) {
      if (!isAllowedContentType(contentType, allowedContentTypes)) {
        throw new SsrfError(
          'UNSUPPORTED_CONTENT_TYPE',
          `Blocked content type: ${contentType || 'unknown'}`,
        );
      }
    }

    return {
      status,
      notModified: false,
      finalUrl: currentUrl,
      contentType,
      etag: response.headers?.etag ?? null,
      lastModified: response.headers?.['last-modified'] ?? null,
      buffer,
    };
  }

  throw new SsrfError('TOO_MANY_REDIRECTS', `Exceeded ${maxRedirects} redirects`);
}
