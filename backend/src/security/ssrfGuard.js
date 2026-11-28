/**
 * Validates outbound URLs against SSRF vectors and fetches bounded HTTP responses.
 * Deliberately disables automatic axios redirects so every hop is re-validated via DNS
 * before opening a socket; does not enforce robots.txt or HTML parsing.
 */
import dns from 'node:dns/promises';
import net from 'node:net';

import axios from 'axios';

const ALLOWED_CONTENT_TYPES = [
  'text/html',
  'application/xhtml+xml',
  'application/xml',
  'text/xml',
  'application/rss+xml',
  'application/atom+xml',
  'application/pdf',
];

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_MAX_BYTES = 3 * 1024 * 1024;
const MAX_REDIRECTS = 3;
export const BOT_USER_AGENT =
  'KhabriBot/1.0 (+https://github.com/rishab11250/Khabri; rishab11250@gmail.com; notice-watcher)';

/**
 * Typed security error raised when an outbound URL or response violates SSRF policy.
 */
export class SsrfError extends Error {
  /**
   * Creates an SSRF policy violation error with a machine-readable code.
   *
   * @param {string} code - Machine-readable SSRF error code.
   * @param {string} message - Human-readable failure summary.
   */
  constructor(code, message) {
    super(message);
    this.name = 'SsrfError';
    this.code = code;
  }
}

// --- IP range blocking ---

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

// Non-routable, loopback, private LAN, CGNAT, metadata, benchmark, and multicast ranges.
const BLOCKED_IPV4_CIDRS = [
  ['0.0.0.0', 8], // "This network" can bind loopback on Linux hosts.
  ['10.0.0.0', 8], // RFC 1918 internal corporate/VPC networks.
  ['100.64.0.0', 10], // RFC 6598 carrier-grade NAT and cloud internal meshes.
  ['127.0.0.0', 8], // Loopback interfaces (local services, DBs, admin ports).
  ['169.254.0.0', 16], // Link-local & cloud instance metadata (169.254.169.254).
  ['172.16.0.0', 12], // RFC 1918 private subnet block.
  ['192.0.0.0', 24], // IETF protocol assignments.
  ['192.0.2.0', 24], // TEST-NET-1 documentation range.
  ['192.168.0.0', 16], // RFC 1918 local LAN/router gateways.
  ['198.18.0.0', 15], // Network benchmark testing subnet.
  ['198.51.100.0', 24], // TEST-NET-2 documentation range.
  ['203.0.113.0', 24], // TEST-NET-3 documentation range.
  ['224.0.0.0', 4], // IPv4 multicast addresses.
  ['240.0.0.0', 4], // Reserved future-use block.
];

function isBlockedIpv4(ip) {
  const ipInt = ipv4ToInt(ip);
  if (ipInt === null) return true;
  return BLOCKED_IPV4_CIDRS.some(([base, bits]) => inCidr4(ipInt, base, bits));
}

function extractMappedIpv4(mapped) {
  if (net.isIPv4(mapped)) return mapped;
  // Normalize 2-hextet mapped forms like ::ffff:7f00:0001 into dotted IPv4 so IPv4 rules apply.
  const hexParts = mapped.split(':');
  if (hexParts.length !== 2) return null;
  const hi = parseInt(hexParts[0], 16);
  const lo = parseInt(hexParts[1], 16);
  if (Number.isNaN(hi) || Number.isNaN(lo)) return null;
  return `${(hi >> 8) & 255}.${hi & 255}.${(lo >> 8) & 255}.${lo & 255}`;
}

function isBlockedIpv6(ip) {
  const lower = ip.toLowerCase();
  if (lower === '::' || lower === '::1') return true;
  if (lower.startsWith('::ffff:')) {
    const mappedIpv4 = extractMappedIpv4(lower.slice('::ffff:'.length));
    return mappedIpv4 ? isBlockedIpv4(mappedIpv4) : true;
  }

  // Unique local fc00::/7 (fc.. or fd..), link-local fe80::/10 (fe80..febf), multicast ff00::/8.
  const firstHextet = parseInt(lower.split(':')[0] || '0', 16);
  if (Number.isNaN(firstHextet)) return true;
  const isUniqueLocal = (firstHextet & 0xfe00) === 0xfc00;
  const isLinkLocal = (firstHextet & 0xffc0) === 0xfe80;
  const isMulticast = (firstHextet & 0xff00) === 0xff00;
  return isUniqueLocal || isLinkLocal || isMulticast;
}

/**
 * Checks whether an IP string belongs to a private, loopback, metadata, or invalid range.
 *
 * @param {string} rawIp - Candidate IPv4/IPv6 string (zone IDs stripped before parsing).
 * @returns {boolean} True when the address must be blocked.
 */
export function isBlockedIp(rawIp) {
  const ip = String(rawIp || '')
    .trim()
    .split('%')[0]; // Strip IPv6 scope/zone suffixes (%eth0) before net.isIP.
  const version = net.isIP(ip);
  if (version === 4) return isBlockedIpv4(ip);
  if (version === 6) return isBlockedIpv6(ip);
  return true;
}

// --- URL and DNS validation ---

function parseAndValidateHttpUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new SsrfError('INVALID_URL', 'Malformed URL');
  }

  // Block file://, ftp://, gopher://, etc. to prevent local file reads and protocol smuggling.
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new SsrfError('SSRF_PROTOCOL_BLOCKED', `Disallowed protocol: ${parsed.protocol}`);
  }
  // Reject embedded userinfo to avoid host-confusion attacks (http://public.com@127.0.0.1).
  if (parsed.username || parsed.password) {
    throw new SsrfError('SSRF_CREDENTIALS_BLOCKED', 'URL credentials are not allowed');
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '');
  if (!hostname) {
    throw new SsrfError('INVALID_URL', 'URL missing hostname');
  }

  return { parsed, hostname };
}

function isInternalHostname(hostname) {
  return hostname === 'localhost' || hostname.endsWith('.local') || hostname.endsWith('.internal');
}

async function resolveAndValidateDns(hostname, lookupFn) {
  let records;
  try {
    records = await lookupFn(hostname);
  } catch {
    throw new SsrfError('DNS_RESOLUTION_FAILED', `Could not resolve host: ${hostname}`);
  }

  if (!Array.isArray(records) || records.length === 0) {
    throw new SsrfError('DNS_RESOLUTION_FAILED', `No DNS records for host: ${hostname}`);
  }

  // Validate every A/AAAA answer so round-robin DNS cannot hide a private IP behind a public one.
  for (const rec of records) {
    if (isBlockedIp(rec.address)) {
      throw new SsrfError('SSRF_IP_BLOCKED', `Resolved to blocked IP: ${rec.address}`);
    }
  }

  return records;
}

/**
 * Validates URL syntax, scheme, host rules, and resolved DNS addresses against SSRF policy.
 *
 * @param {string} rawUrl - Candidate URL supplied by user input, catalog, or HTTP redirect.
 * @param {object} [options] - Validation overrides (`lookupFn`, `allowPrivateHosts`).
 * @returns {Promise<{ parsed: URL, addresses: Array<object> }>} Parsed URL and validated DNS records.
 * @throws {SsrfError} On invalid URL, blocked protocol/credentials/host, private IP, or DNS failure.
 */
export async function validateSafeUrl(rawUrl, options = {}) {
  const { parsed, hostname } = parseAndValidateHttpUrl(rawUrl);

  if (options.allowPrivateHosts) {
    return { parsed, addresses: [] };
  }

  if (isInternalHostname(hostname)) {
    throw new SsrfError('SSRF_HOST_BLOCKED', `Blocked internal hostname: ${hostname}`);
  }

  const ipVersion = net.isIP(hostname);
  if (ipVersion !== 0) {
    if (isBlockedIp(hostname)) {
      throw new SsrfError('SSRF_IP_BLOCKED', `Blocked private/reserved IP: ${hostname}`);
    }
    return { parsed, addresses: [{ address: hostname, family: ipVersion }] };
  }

  const lookupFn = options.lookupFn ?? ((host) => dns.lookup(host, { all: true }));
  const addresses = await resolveAndValidateDns(hostname, lookupFn);
  return { parsed, addresses };
}

// --- Bounded HTTP fetch ---

/**
 * Checks whether an HTTP `Content-Type` header matches the allowed MIME prefix list.
 *
 * @param {string} headerValue - Raw `content-type` response header.
 * @param {string[]} [allowedTypes] - Permitted lowercase MIME media types.
 * @returns {boolean} True when the response media type is allowed for ingestion.
 */
function isAllowedContentType(headerValue, allowedTypes = ALLOWED_CONTENT_TYPES) {
  if (!headerValue) return false;
  const mime = String(headerValue).split(';')[0].trim().toLowerCase();
  return allowedTypes.includes(mime);
}

function requestSingleHop(currentUrl, { httpClient, timeoutMs, maxBytes, customHeaders }) {
  const headers = {
    'User-Agent': BOT_USER_AGENT,
    Accept:
      'text/html,application/xhtml+xml,application/xml,text/xml,application/pdf;q=0.9,*/*;q=0.8',
    ...customHeaders,
  };

  return httpClient.request({
    url: currentUrl,
    method: 'GET',
    headers,
    timeout: timeoutMs,
    // Disable axios redirect following so every Location hop passes validateSafeUrl first.
    maxRedirects: 0,
    maxContentLength: maxBytes,
    maxBodyLength: maxBytes,
    responseType: 'arraybuffer',
    validateStatus: () => true,
  });
}

function readBoundedBuffer(data, headers, maxBytes) {
  if (Number(headers['content-length'] ?? 0) > maxBytes) {
    throw new SsrfError('RESPONSE_TOO_LARGE', `Content-Length exceeds ${maxBytes} bytes`);
  }
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data ?? '');
  if (buffer.byteLength > maxBytes) {
    throw new SsrfError('RESPONSE_TOO_LARGE', `Response body exceeds ${maxBytes} bytes`);
  }
  return buffer;
}

function buildFetchResult({
  response,
  currentUrl,
  maxBytes,
  allowedContentTypes,
  skipContentTypeCheck,
}) {
  const { status, data } = response;
  const headers = response.headers || {};
  const contentType = headers['content-type'] ?? '';
  const meta = {
    finalUrl: currentUrl,
    contentType,
    etag: headers.etag ?? null,
    lastModified: headers['last-modified'] ?? null,
  };

  if (status === 304) {
    return { status: 304, notModified: true, ...meta, buffer: Buffer.alloc(0) };
  }

  const buffer = readBoundedBuffer(data, headers, maxBytes);
  const isSuccess = status >= 200 && status < 300;
  if (
    isSuccess &&
    !skipContentTypeCheck &&
    !isAllowedContentType(contentType, allowedContentTypes)
  ) {
    throw new SsrfError(
      'UNSUPPORTED_CONTENT_TYPE',
      `Blocked content type: ${contentType || 'unknown'}`,
    );
  }

  return { status, notModified: false, ...meta, buffer };
}

function getRedirectTarget(response, currentUrl) {
  const location = response.headers?.location;
  if (!location || response.status < 300 || response.status >= 400) return null;
  return new URL(location, currentUrl).toString();
}

/**
 * Fetches an external URL with SSRF hop-by-hop redirect validation, size caps, and timeouts.
 *
 * @param {string} rawUrl - Initial URL to fetch.
 * @param {object} [options] - Timeout, byte cap, redirect limit, content-type, and test client overrides.
 * @returns {Promise<{ status: number, notModified: boolean, finalUrl: string, contentType: string, etag: string|null, lastModified: string|null, buffer: Buffer }>} Fetched response payload.
 * @throws {SsrfError} When any hop fails SSRF validation, exceeds redirects/bytes, or returns an unsupported MIME type.
 */
export async function safeFetch(rawUrl, options = {}) {
  const maxRedirects = options.maxRedirects ?? MAX_REDIRECTS;
  const httpClient = options.httpClient ?? axios;
  let currentUrl = rawUrl;

  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    await validateSafeUrl(currentUrl, {
      lookupFn: options.lookupFn,
      allowPrivateHosts: options.allowPrivateHosts,
    });

    const response = await requestSingleHop(currentUrl, {
      httpClient,
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      maxBytes: options.maxBytes ?? DEFAULT_MAX_BYTES,
      customHeaders: options.headers,
    });

    const redirectTarget = getRedirectTarget(response, currentUrl);
    if (!redirectTarget) {
      return buildFetchResult({
        response,
        currentUrl,
        maxBytes: options.maxBytes ?? DEFAULT_MAX_BYTES,
        allowedContentTypes: options.allowedContentTypes ?? ALLOWED_CONTENT_TYPES,
        skipContentTypeCheck: options.skipContentTypeCheck,
      });
    }

    if (hop >= maxRedirects) {
      throw new SsrfError('TOO_MANY_REDIRECTS', `Exceeded ${maxRedirects} redirects`);
    }
    currentUrl = redirectTarget;
  }

  throw new SsrfError('TOO_MANY_REDIRECTS', `Exceeded ${maxRedirects} redirects`);
}
