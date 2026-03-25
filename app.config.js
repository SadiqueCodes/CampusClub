/* Dynamically inject env vars into Expo config extras at dev time.
   Usage: create a `.env` file at project root (not committed) with SUPABASE_URL and SUPABASE_ANON_KEY.
   expo will read these values via Constants.expoConfig.extra at runtime.
*/

const fs = require('fs');
const path = require('path');

// Load .env if present
try {
  require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
} catch (e) {
  // dotenv optional
}

const appJson = require('./app.json');

const extra = Object.assign({}, appJson.expo?.extra || {}, {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  BACKEND_URL: process.env.BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || '',
});

module.exports = () => ({
  ...appJson,
  expo: {
    ...appJson.expo,
    extra,
  },
});
