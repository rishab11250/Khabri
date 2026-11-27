import { isApiConfigured, mobileEnv } from './env';
import { supabase } from './supabase';

export class ApiError extends Error {
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

export async function apiRequest(path, options = {}) {
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
        const err = payload?.error;
        throw new ApiError(
          err?.code ?? 'HTTP_ERROR',
          err?.message ?? `Request failed (${response.status})`,
          response.status,
          err?.details ?? null,
        );
      }

      return payload.data;
    } catch (err) {
      const msg = String(err?.message || '');
      const isCancelled =
        err?.name === 'AbortError' ||
        msg.toLowerCase().includes('cancelled') ||
        msg.toLowerCase().includes('aborted');
      lastError = isCancelled
        ? new ApiError('TIMEOUT', 'Server took too long to respond. Please try again.', 408)
        : err;

      const isTransient = isCancelled || !(err instanceof ApiError);
      if (attempt < maxAttempts && isTransient) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      throw lastError;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError;
}

export const api = {
  getHealth: () => apiRequest('/health', { auth: false }),
  getMe: () => apiRequest('/v1/me'),
  patchMe: (body) => apiRequest('/v1/me', { method: 'PATCH', body }),
  deleteMe: () => apiRequest('/v1/me', { method: 'DELETE' }),
  registerDevice: (body) => apiRequest('/v1/devices', { method: 'POST', body }),
  getCatalog: ({ category, state, q } = {}) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (state) params.set('state', state);
    if (q) params.set('q', q);
    const qs = params.toString();
    return apiRequest(`/v1/catalog${qs ? `?${qs}` : ''}`, { auth: false });
  },
  getTrending: () => apiRequest('/v1/catalog/trending', { auth: false }),
  getWatches: () => apiRequest('/v1/watches'),
  createWatch: (body) => apiRequest('/v1/watches', { method: 'POST', body }),
  patchWatch: (id, body) => apiRequest(`/v1/watches/${id}`, { method: 'PATCH', body }),
  deleteWatch: (id) => apiRequest(`/v1/watches/${id}`, { method: 'DELETE' }),
  refreshWatch: (id) => apiRequest(`/v1/watches/${id}/refresh`, { method: 'POST' }),
  getFeed: (cursor) =>
    apiRequest(`/v1/feed${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`),
  getChange: (id) => apiRequest(`/v1/changes/${id}`),
  translateChange: (id, lang) =>
    apiRequest(`/v1/changes/${id}/translate`, { method: 'POST', body: { lang } }),
  patchChecklist: (id, done) =>
    apiRequest(`/v1/checklist/${id}`, { method: 'PATCH', body: { done } }),
  getDeadlines: (status) =>
    apiRequest(`/v1/deadlines${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  createDeadline: (body) => apiRequest('/v1/deadlines', { method: 'POST', body }),
  patchDeadline: (id, body) => apiRequest(`/v1/deadlines/${id}`, { method: 'PATCH', body }),
  deleteDeadline: (id) => apiRequest(`/v1/deadlines/${id}`, { method: 'DELETE' }),
  getCircles: () => apiRequest('/v1/circles'),
  createCircle: (body) => apiRequest('/v1/circles', { method: 'POST', body }),
  joinCircle: (inviteCode) =>
    apiRequest('/v1/circles/join', { method: 'POST', body: { inviteCode } }),
  getCircle: (id) => apiRequest(`/v1/circles/${id}`),
  addCircleWatch: (circleId, sourceId) =>
    apiRequest(`/v1/circles/${circleId}/watches`, { method: 'POST', body: { sourceId } }),
  removeCircleMember: (circleId, userId) =>
    apiRequest(`/v1/circles/${circleId}/members/${userId}`, { method: 'DELETE' }),
  askKhabri: (body) => apiRequest('/v1/ask', { method: 'POST', body }),
  intakeLink: (body) => apiRequest('/v1/intake/link', { method: 'POST', body }),
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
      const err = payload?.error;
      throw new ApiError(
        err?.code ?? 'HTTP_ERROR',
        err?.message ?? `Request failed (${res.status})`,
        res.status,
      );
    }
    return payload.data;
  },
};
