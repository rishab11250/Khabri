/**
 * Verifies Supabase user JWTs (JWKS RS256/ES256 or HS256 secret) and calls Supabase Admin deletion.
 * Deliberately supports both JWKS and HS256 paths so modern Supabase asymmetric keys and test secrets work seamlessly.
 */
import { createClient } from '@supabase/supabase-js';
import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify } from 'jose';

import { getEnv } from './env.js';

let cachedJwksUrl = null;
let cachedJwks = null;
let cachedAdminClient = null;

function getJwks(env) {
  const jwksUrl =
    env.SUPABASE_JWKS_URL ?? `${env.SUPABASE_URL.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json`;
  if (!cachedJwks || cachedJwksUrl !== jwksUrl) {
    cachedJwksUrl = jwksUrl;
    cachedJwks = createRemoteJWKSet(new URL(jwksUrl));
  }
  return cachedJwks;
}

/**
 * Cryptographically verifies a Supabase access JWT via HS256 shared secret or remote JWKS.
 *
 * @param {string} token - Raw JWT bearer token.
 * @param {object} [envOverride] - Optional environment config override for tests.
 * @returns {Promise<object>} Decoded JWT claims payload (`sub`, `email`, etc.).
 * @throws {Error} On signature mismatch, expiry, or missing `SUPABASE_JWT_SECRET` for HS256 tokens.
 */
export async function verifySupabaseJwt(token, envOverride) {
  const env = envOverride ?? getEnv();
  const header = decodeProtectedHeader(token);

  if (header.alg === 'HS256') {
    if (!env.SUPABASE_JWT_SECRET) {
      throw new Error('SUPABASE_JWT_SECRET is required to verify HS256 tokens');
    }
    const secret = new TextEncoder().encode(env.SUPABASE_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    return payload;
  }

  const jwks = getJwks(env);
  const { payload } = await jwtVerify(token, jwks);
  return payload;
}

/**
 * Lazily constructs a stateless Supabase Admin client when `SUPABASE_SERVICE_ROLE_KEY` is present.
 *
 * @param {object} [envOverride] - Optional environment config override.
 * @returns {object|null} Supabase Admin client or `null` if unconfigured.
 */
function getSupabaseAdmin(envOverride) {
  if (!envOverride && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  const env = envOverride ?? getEnv();
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  if (!cachedAdminClient) {
    cachedAdminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return cachedAdminClient;
}

/**
 * Deletes a Supabase Auth user via the Admin API during `/v1/me` account deletion.
 *
 * @param {string} supabaseId - Target Supabase user UUID.
 * @param {object} [envOverride] - Optional environment config override.
 * @returns {Promise<{ deleted: boolean, reason?: string }>} Deletion outcome.
 */
export async function deleteSupabaseUser(supabaseId, envOverride) {
  const admin = getSupabaseAdmin(envOverride);
  if (!admin) {
    return { deleted: false, reason: 'service_role_not_configured' };
  }
  const { error } = await admin.auth.admin.deleteUser(supabaseId);
  if (error) {
    throw error;
  }
  return { deleted: true };
}
