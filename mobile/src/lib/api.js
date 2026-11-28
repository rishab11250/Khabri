/**
 * HTTP client wrapping `fetch` with Supabase bearer injection, timeouts, and transient retries.
 * Deliberately retries once on network errors/timeouts (ideal for Render cold starts) while
 * leaving server-returned `ApiError` responses non-retried by default.
 */
import { isApiConfigured, mobileEnv } from './env';
import { supabase } from './supabase';

/**
 * Typed client error populated from backend `{ success: false, error: { code, message, details } }` responses.
 */
class ApiError extends Error {
  /**
   * Creates an API error preserving status code, machine error code, and validation details.
   *
   * @param {string} code - Backend error code (`UNAUTHORIZED`, `TIMEOUT`, etc.).
   * @param {string} message - Human-readable error summary.
   * @param {number} [status] - HTTP status code (`0` when unconfigured, `408` on client timeout).
   * @param {*} [details] - Optional field validation array.
   */
  constructor(code, message, status = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function getAccessToken() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token ?? null;
}

function parseApiError(payload, status) {
  const err = payload?.error;
  return new ApiError(
    err?.code ?? 'HTTP_ERROR',
    err?.message ?? `Request failed (${status})`,
    status,
    err?.details ?? null,
  );
}

function normalizeRequestError(err) {
  const msg = String(err?.message || '').toLowerCase();
  const isCancelled =
    err?.name === 'AbortError' || msg.includes('cancelled') || msg.includes('aborted');
  return isCancelled
    ? {
        error: new ApiError('TIMEOUT', 'Server took too long to respond. Please try again.', 408),
        isTransient: true,
      }
    : { error: err, isTransient: !(err instanceof ApiError) };
}

async function runSingleFetch(path, options, headers, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${mobileEnv.apiUrl}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new ApiError('INVALID_RESPONSE', 'Unexpected non-JSON response', response.status);
    }

    if (!response.ok || !payload?.success) {
      throw parseApiError(payload, response.status);
    }

    return payload.data;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Executes an authenticated or public JSON API call against `mobileEnv.apiUrl`.
 *
 * @param {string} path - API route path starting with `/` (for example `/v1/feed`).
 * @param {object} [options] - HTTP method, JSON body, timeout, auth/retry flags, and headers.
 * @returns {Promise<*>} Unwrapped `payload.data` from backend response envelope.
 * @throws {ApiError} On missing URL config, timeout, invalid JSON, or API error responses.
 */
async function apiRequest(path, options = {}) {
  if (!isApiConfigured) {
    throw new ApiError('API_NOT_CONFIGURED', 'EXPO_PUBLIC_API_URL is not configured', 0);
  }

  const token = options.auth === false ? null : await getAccessToken();
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const timeoutMs = options.timeoutMs ?? 60000;
  const maxAttempts = options.retry === false ? 1 : 2;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await runSingleFetch(path, options, headers, timeoutMs);
    } catch (err) {
      const normalized = normalizeRequestError(err);
      lastError = normalized.error;
      if (attempt < maxAttempts && normalized.isTransient) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      throw lastError;
    }
  }

  throw lastError;
}

/** Endpoint wrappers grouped onto the REST client consumed by feature hooks. */
export const api = {
  /** @returns {Promise<object>} Authenticated user profile. */
  getMe: () => apiRequest('/v1/me'),
  /**
   * @param {object} body - Profile fields to update.
   * @returns {Promise<object>} Updated user profile.
   */
  patchMe: (body) => apiRequest('/v1/me', { method: 'PATCH', body }),
  /**
   * @param {object} body - Expo push token and platform metadata.
   * @returns {Promise<object>} Registered device record.
   */
  registerDevice: (body) => apiRequest('/v1/devices', { method: 'POST', body }),
  /**
   * @param {object} [params] - Optional catalog filter query parameters.
   * @param {string} [params.category] - Source category filter.
   * @param {string} [params.state] - Indian state filter.
   * @param {string} [params.q] - Free-text search query.
   * @returns {Promise<object>} Matching catalog sources.
   */
  getCatalog: ({ category, state, q } = {}) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (state) params.set('state', state);
    if (q) params.set('q', q);
    const qs = params.toString();
    return apiRequest(`/v1/catalog${qs ? `?${qs}` : ''}`, { auth: false });
  },
  /** @returns {Promise<object>} Top trending verified sources. */
  getTrending: () => apiRequest('/v1/catalog/trending', { auth: false }),
  /** @returns {Promise<object>} Authenticated user's active watches. */
  getWatches: () => apiRequest('/v1/watches'),
  /**
   * @param {object} body - New watch payload (`sourceId`, optional `url`, `alertThreshold`).
   * @returns {Promise<object>} Created watch record.
   */
  createWatch: (body) => apiRequest('/v1/watches', { method: 'POST', body }),
  /**
   * @param {string} id - Watch identifier.
   * @param {object} body - Mutable watch fields.
   * @returns {Promise<object>} Updated watch record.
   */
  patchWatch: (id, body) => apiRequest(`/v1/watches/${id}`, { method: 'PATCH', body }),
  /**
   * @param {string} id - Watch identifier.
   * @returns {Promise<object>} Deletion confirmation payload.
   */
  deleteWatch: (id) => apiRequest(`/v1/watches/${id}`, { method: 'DELETE' }),
  /**
   * @param {string} id - Watch identifier.
   * @returns {Promise<object>} Immediate refresh result.
   */
  refreshWatch: (id) => apiRequest(`/v1/watches/${id}/refresh`, { method: 'POST' }),
  /**
   * @param {string} [cursor] - Pagination cursor for older feed items.
   * @returns {Promise<object>} Paginated change feed page.
   */
  getFeed: (cursor) =>
    apiRequest(`/v1/feed${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`),
  /**
   * @param {string} id - Change identifier.
   * @returns {Promise<object>} Full change detail payload.
   */
  getChange: (id) => apiRequest(`/v1/changes/${id}`),
  /**
   * @param {string} id - Change identifier.
   * @param {string} lang - Target translation language (`en` | `hi` | `gu`).
   * @returns {Promise<object>} Translated summary fields.
   */
  translateChange: (id, lang) =>
    apiRequest(`/v1/changes/${id}/translate`, { method: 'POST', body: { lang } }),
  /**
   * @param {string} id - Checklist item identifier.
   * @param {boolean} done - Target completion state.
   * @returns {Promise<object>} Updated checklist item.
   */
  patchChecklist: (id, done) =>
    apiRequest(`/v1/checklist/${id}`, { method: 'PATCH', body: { done } }),
  /**
   * @param {string} [status] - Optional deadline status filter.
   * @returns {Promise<object>} Deadline list payload.
   */
  getDeadlines: (status) =>
    apiRequest(`/v1/deadlines${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  /**
   * @param {object} body - Custom deadline payload.
   * @returns {Promise<object>} Created deadline record.
   */
  createDeadline: (body) => apiRequest('/v1/deadlines', { method: 'POST', body }),
  /**
   * @param {string} id - Deadline identifier.
   * @param {object} body - Deadline fields to update.
   * @returns {Promise<object>} Updated deadline record.
   */
  patchDeadline: (id, body) => apiRequest(`/v1/deadlines/${id}`, { method: 'PATCH', body }),
  /**
   * @param {string} id - Deadline identifier.
   * @returns {Promise<object>} Deletion confirmation payload.
   */
  deleteDeadline: (id) => apiRequest(`/v1/deadlines/${id}`, { method: 'DELETE' }),
  /** @returns {Promise<object>} User's Circles list. */
  getCircles: () => apiRequest('/v1/circles'),
  /**
   * @param {object} body - Circle creation payload (`name`).
   * @returns {Promise<object>} Created Circle record.
   */
  createCircle: (body) => apiRequest('/v1/circles', { method: 'POST', body }),
  /**
   * @param {string} inviteCode - 6-character Circle invite code.
   * @returns {Promise<object>} Joined Circle payload.
   */
  joinCircle: (inviteCode) =>
    apiRequest('/v1/circles/join', { method: 'POST', body: { inviteCode } }),
  /**
   * @param {string} id - Circle identifier.
   * @returns {Promise<object>} Circle details including watches and members.
   */
  getCircle: (id) => apiRequest(`/v1/circles/${id}`),
  /**
   * @param {string} circleId - Circle identifier.
   * @param {string} sourceId - Source identifier to share in the Circle.
   * @returns {Promise<object>} Updated Circle watch list.
   */
  addCircleWatch: (circleId, sourceId) =>
    apiRequest(`/v1/circles/${circleId}/watches`, { method: 'POST', body: { sourceId } }),
  /**
   * @param {string} circleId - Circle identifier.
   * @param {string} userId - Member user ID to remove.
   * @returns {Promise<object>} Removal confirmation payload.
   */
  removeCircleMember: (circleId, userId) =>
    apiRequest(`/v1/circles/${circleId}/members/${userId}`, { method: 'DELETE' }),
  /**
   * @param {object} body - Question and optional scope payload.
   * @returns {Promise<object>} Grounded Ask Khabri answer payload.
   */
  askKhabri: (body) => apiRequest('/v1/ask', { method: 'POST', body }),
  /**
   * @param {object} body - User-submitted portal URL intake payload.
   * @returns {Promise<object>} Validated portal check result.
   */
  intakeLink: (body) => apiRequest('/v1/intake/link', { method: 'POST', body }),
  /**
   * Uploads a circular photo as multipart form data to propose official sources.
   *
   * @param {object} asset - Picked image asset metadata.
   * @returns {Promise<object>} Proposed sources extracted by Gemini Vision.
   */
  intakePhoto: async (asset) => {
    if (!isApiConfigured) {
      throw new ApiError('API_NOT_CONFIGURED', 'EXPO_PUBLIC_API_URL is not configured', 0);
    }
    const token = await getAccessToken();
    const form = new FormData();
    form.append('photo', {
      uri: asset.uri,
      name: asset.fileName || 'notice.jpg',
      type: asset.mimeType || 'image/jpeg',
    });
    const res = await fetch(`${mobileEnv.apiUrl}/v1/intake/photo`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: form,
    });
    const payload = await res.json();
    if (!res.ok || !payload?.success) {
      throw parseApiError(payload, res.status);
    }
    return payload.data;
  },
};
