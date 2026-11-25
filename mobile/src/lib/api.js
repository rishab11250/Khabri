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
  if (!supabase) {
    return null;
  }
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

  const response = await fetch(`${mobileEnv.apiUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
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
}

export const api = {
  getHealth: () => apiRequest('/health', { auth: false }),
  getMe: () => apiRequest('/v1/me'),
  patchMe: (body) => apiRequest('/v1/me', { method: 'PATCH', body }),
  deleteMe: () => apiRequest('/v1/me', { method: 'DELETE' }),
};
