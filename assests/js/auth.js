import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const supabase = createClient(
  window.__ENV.SUPABASE_URL,
  window.__ENV.SUPABASE_ANON_KEY
);

// expose for debugging + other scripts
window.supabase = supabase;
