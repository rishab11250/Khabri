/**
 * Initializes the Supabase Auth client backed by encrypted `expo-secure-store` on native platforms.
 * Deliberately disables `detectSessionInUrl` on React Native where auth redirects use deep links.
 */
import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { isSupabaseConfigured, mobileEnv } from './env';

const ExpoSecureStoreAdapter = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

// Keep Supabase optional (`null` when env vars are missing) so setup warnings render cleanly.
export const supabase = isSupabaseConfigured
  ? createClient(mobileEnv.supabaseUrl, mobileEnv.supabaseAnonKey, {
      auth: {
        storage: Platform.OS !== 'web' ? ExpoSecureStoreAdapter : undefined,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
