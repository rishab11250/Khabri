import { describe, expect, it } from 'vitest';

import { isBlockedIp, safeFetch, SsrfError, validateSafeUrl } from '../src/security/ssrfGuard.js';

describe('ssrfGuard', () => {
  it('blocks private, loopback, link-local, metadata, and IPv6 local addresses', () => {
    expect(isBlockedIp('127.0.0.1')).toBe(true);
    expect(isBlockedIp('10.0.0.5')).toBe(true);
    expect(isBlockedIp('172.16.0.1')).toBe(true);
    expect(isBlockedIp('172.31.255.255')).toBe(true);
    expect(isBlockedIp('192.168.1.10')).toBe(true);
    expect(isBlockedIp('169.254.169.254')).toBe(true);
    expect(isBlockedIp('100.64.0.1')).toBe(true);
    expect(isBlockedIp('::1')).toBe(true);
    expect(isBlockedIp('fe80::1')).toBe(true);
    expect(isBlockedIp('fc00::1')).toBe(true);
    expect(isBlockedIp('::ffff:127.0.0.1')).toBe(true);
    expect(isBlockedIp('::ffff:169.254.169.254')).toBe(true);

    expect(isBlockedIp('8.8.8.8')).toBe(false);
    expect(isBlockedIp('172.32.0.1')).toBe(false);
    expect(isBlockedIp('2404:6800:4009:800::200e')).toBe(false);
  });

  it('rejects non-http protocols, localhost, and DNS resolving to private IPs', async () => {
    await expect(validateSafeUrl('file:///etc/passwd')).rejects.toThrow(SsrfError);
    await expect(validateSafeUrl('http://localhost:4000')).rejects.toThrow(SsrfError);
    await expect(validateSafeUrl('http://169.254.169.254/latest/meta-data')).rejects.toThrow(
      SsrfError,
    );
    await expect(
      validateSafeUrl('https://evil.example.com/notice', {
        lookupFn: async () => [{ address: '10.1.2.3', family: 4 }],
      }),
    ).rejects.toThrow(/Blocked/i);
  });

  it('blocks redirects to private targets and stops after 3 redirects', async () => {
    const lookupFn = async (host) => {
      if (host === 'internal.example.com') return [{ address: '192.168.0.10', family: 4 }];
      return [{ address: '93.184.216.34', family: 4 }];
    };

    const redirectToPrivateClient = {
      request: async () => ({
        status: 302,
        headers: { location: 'https://internal.example.com/secret' },
        data: Buffer.alloc(0),
      }),
    };

    await expect(
      safeFetch('https://public.example.com/start', {
        lookupFn,
        httpClient: redirectToPrivateClient,
      }),
    ).rejects.toThrow(/Blocked/i);

    let hop = 0;
    const tooManyRedirectsClient = {
      request: async () => {
        hop += 1;
        return {
          status: 302,
          headers: { location: `https://public.example.com/hop-${hop}` },
          data: Buffer.alloc(0),
        };
      },
    };

    await expect(
      safeFetch('https://public.example.com/start', {
        lookupFn,
        httpClient: tooManyRedirectsClient,
      }),
    ).rejects.toThrow(/Exceeded 3 redirects/);
  });

  it('enforces size cap, content-type allowlist, and handles 304 Not Modified', async () => {
    const lookupFn = async () => [{ address: '93.184.216.34', family: 4 }];

    await expect(
      safeFetch('https://public.example.com/bin', {
        lookupFn,
        maxBytes: 100,
        httpClient: {
          request: async () => ({
            status: 200,
            headers: { 'content-type': 'text/html', 'content-length': '500' },
            data: Buffer.alloc(10),
          }),
        },
      }),
    ).rejects.toThrow(/exceeds/i);

    await expect(
      safeFetch('https://public.example.com/exe', {
        lookupFn,
        httpClient: {
          request: async () => ({
            status: 200,
            headers: { 'content-type': 'application/octet-stream' },
            data: Buffer.from('abc'),
          }),
        },
      }),
    ).rejects.toThrow(/Blocked content type/i);

    const notMod = await safeFetch('https://public.example.com/notices', {
      lookupFn,
      httpClient: {
        request: async () => ({
          status: 304,
          headers: { etag: '"v2"' },
          data: Buffer.alloc(0),
        }),
      },
    });
    expect(notMod.notModified).toBe(true);
    expect(notMod.etag).toBe('"v2"');
  });

  it('blocks reserved IPv4/IPv6 CIDR ranges, malformed IPs, and zone-ID addresses', () => {
    expect(isBlockedIp('0.0.0.0')).toBe(true);
    expect(isBlockedIp('192.0.0.1')).toBe(true);
    expect(isBlockedIp('192.0.2.1')).toBe(true);
    expect(isBlockedIp('198.18.0.1')).toBe(true);
    expect(isBlockedIp('198.51.100.1')).toBe(true);
    expect(isBlockedIp('203.0.113.1')).toBe(true);
    expect(isBlockedIp('224.0.0.1')).toBe(true);
    expect(isBlockedIp('240.0.0.1')).toBe(true);
    expect(isBlockedIp('not-an-ip')).toBe(true);
    expect(isBlockedIp('::')).toBe(true);
    expect(isBlockedIp('fd12:3456::1')).toBe(true);
    expect(isBlockedIp('ff02::1')).toBe(true);
    expect(isBlockedIp('fe80::1%eth0')).toBe(true);
    expect(isBlockedIp('::ffff:7f00:0001')).toBe(true);

    expect(isBlockedIp('::ffff:0808:0808')).toBe(false);
    expect(isBlockedIp('1.1.1.1')).toBe(false);
  });

  it('validates URL structure, credentials, internal domains, DNS failures, and mixed records', async () => {
    await expect(validateSafeUrl('not a url')).rejects.toMatchObject({ code: 'INVALID_URL' });
    await expect(validateSafeUrl('https://user:pass@public.example.com/')).rejects.toMatchObject({
      code: 'SSRF_CREDENTIALS_BLOCKED',
    });
    await expect(validateSafeUrl('http://service.local/api')).rejects.toMatchObject({
      code: 'SSRF_HOST_BLOCKED',
    });
    await expect(validateSafeUrl('http://metadata.google.internal/')).rejects.toMatchObject({
      code: 'SSRF_HOST_BLOCKED',
    });

    await expect(
      validateSafeUrl('https://missing.example.com/', {
        lookupFn: async () => {
          throw new Error('ENOTFOUND');
        },
      }),
    ).rejects.toMatchObject({ code: 'DNS_RESOLUTION_FAILED' });

    await expect(
      validateSafeUrl('https://empty.example.com/', {
        lookupFn: async () => [],
      }),
    ).rejects.toMatchObject({ code: 'DNS_RESOLUTION_FAILED' });

    await expect(
      validateSafeUrl('https://dual.example.com/', {
        lookupFn: async () => [
          { address: '93.184.216.34', family: 4 },
          { address: '127.0.0.1', family: 4 },
        ],
      }),
    ).rejects.toMatchObject({ code: 'SSRF_IP_BLOCKED' });

    const ipLiteral = await validateSafeUrl('https://93.184.216.34/notice');
    expect(ipLiteral.addresses).toEqual([{ address: '93.184.216.34', family: 4 }]);

    const privateAllowed = await validateSafeUrl('http://127.0.0.1:4000/test', {
      allowPrivateHosts: true,
    });
    expect(privateAllowed.addresses).toEqual([]);
  });

  it('handles public relative redirects, protocol switches, body byte caps, content types, and timeouts', async () => {
    const lookupFn = async () => [{ address: '93.184.216.34', family: 4 }];

    let reqCount = 0;
    const relativeRedirectOk = await safeFetch('https://public.example.com/start', {
      lookupFn,
      maxRedirects: 2,
      httpClient: {
        request: async () => {
          reqCount += 1;
          if (reqCount <= 2) {
            return {
              status: 301,
              headers: { location: `/hop-${reqCount}` },
              data: Buffer.alloc(0),
            };
          }
          return {
            status: 200,
            headers: { 'content-type': 'application/pdf; charset=utf-8' },
            data: Buffer.from('%PDF-1.4'),
          };
        },
      },
    });
    expect(relativeRedirectOk.finalUrl).toBe('https://public.example.com/hop-2');
    expect(relativeRedirectOk.buffer.toString()).toBe('%PDF-1.4');

    await expect(
      safeFetch('https://public.example.com/start', {
        lookupFn,
        httpClient: {
          request: async () => ({
            status: 302,
            headers: { location: 'file:///etc/passwd' },
            data: Buffer.alloc(0),
          }),
        },
      }),
    ).rejects.toMatchObject({ code: 'SSRF_PROTOCOL_BLOCKED' });

    await expect(
      safeFetch('https://public.example.com/big', {
        lookupFn,
        maxBytes: 4,
        httpClient: {
          request: async () => ({
            status: 200,
            headers: { 'content-type': 'text/html' },
            data: Buffer.from('12345'),
          }),
        },
      }),
    ).rejects.toMatchObject({ code: 'RESPONSE_TOO_LARGE' });

    const errorPage = await safeFetch('https://public.example.com/missing', {
      lookupFn,
      httpClient: {
        request: async () => ({
          status: 404,
          headers: { 'content-type': 'text/plain' },
          data: Buffer.from('Not found'),
        }),
      },
    });
    expect(errorPage.status).toBe(404);

    let capturedConfig;
    await expect(
      safeFetch('https://public.example.com/slow', {
        lookupFn,
        timeoutMs: 1234,
        maxBytes: 4096,
        httpClient: {
          request: async (cfg) => {
            capturedConfig = cfg;
            const err = new Error('timeout of 1234ms exceeded');
            err.code = 'ECONNABORTED';
            throw err;
          },
        },
      }),
    ).rejects.toMatchObject({ code: 'ECONNABORTED' });
    expect(capturedConfig.timeout).toBe(1234);
    expect(capturedConfig.maxContentLength).toBe(4096);
    expect(capturedConfig.maxRedirects).toBe(0);
  });
});
