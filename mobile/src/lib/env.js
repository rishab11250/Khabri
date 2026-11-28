/**
 * Reads public build-time Expo environment variables and exposes feature configuration flags.
 * Deliberately strips trailing slashes on URLs so API path concatenation never double-slashes.
 */
export const mobileEnv = {
  apiUrl: (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, ''),
  supabaseUrl: (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, ''),
  supabaseAnonKey:
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '',
};

export const isSupabaseConfigured =
  Boolean(mobileEnv.supabaseUrl) && Boolean(mobileEnv.supabaseAnonKey);

export const isApiConfigured = Boolean(mobileEnv.apiUrl);
