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
});
