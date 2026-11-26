export const mobileEnv = {
  apiUrl: (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, ''),
  supabaseUrl: (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, ''),
  supabaseAnonKey:
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '',
};

export const isSupabaseConfigured =
  Boolean(mobileEnv.supabaseUrl) && Boolean(mobileEnv.supabaseAnonKey);

export const isApiConfigured = Boolean(mobileEnv.apiUrl);
