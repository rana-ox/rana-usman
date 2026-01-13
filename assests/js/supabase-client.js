import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Your env.js should define either window.__ENV or window.supabaseConfig.
// We'll try common names safely.
const cfg =
  window.__ENV ||
  window.supabaseConfig ||
  window.ENV ||
  window.env ||
  {};

// Change these keys ONLY if your env.js uses different names
const SUPABASE_URL = cfg.SUPABASE_URL || cfg.supabaseUrl;
const SUPABASE_ANON_KEY = cfg.SUPABASE_ANON_KEY || cfg.supabaseAnonKey || cfg.supabaseKey;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Supabase config missing in env.js. Found:", cfg);
} else {
  // Create only once
  if (!window.supabase?.auth) {
    window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
}
