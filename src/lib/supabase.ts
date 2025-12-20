import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Helper to read env from multiple sources: process.env (build-time) or expo config extras (runtime)
const extras: Record<string, any> = (Constants.expoConfig && (Constants.expoConfig.extra as Record<string, any>)) || (Constants.manifest && (Constants.manifest.extra as Record<string, any>)) || {};

const SUPABASE_URL = process.env.SUPABASE_URL || extras.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || extras.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Friendly runtime guidance — avoid throwing so the app can start, but make the error actionable
  console.warn(
    'Supabase config missing: set SUPABASE_URL and SUPABASE_ANON_KEY. For Expo dev, either run the packager with environment variables or add them to app.json/app.config.js under expo.extra.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // In Expo/React Native, cookie storage isn't available. We recommend storing the
    // session in secure storage on the client side and restoring it on app launch.
  },
});

export default supabase;

// Dev-time debug: show resolved sources (but don't print full anon key)
if (__DEV__) {
  try {
    // eslint-disable-next-line no-console
    console.debug('[supabase] SUPABASE_URL=', SUPABASE_URL ? SUPABASE_URL : '(missing)');
    // eslint-disable-next-line no-console
    console.debug('[supabase] SUPABASE_ANON_KEY=', SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.slice(0, 8)}...` : '(missing)');
  // eslint-disable-next-line no-console
  console.debug('expo extras', (Constants && (Constants.expoConfig || Constants.manifest)) ? (Constants.expoConfig?.extra || Constants.manifest?.extra) : undefined);
  } catch (e) {
    // ignore
  }
}
