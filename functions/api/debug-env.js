export async function onRequest({ env }) {
  return new Response(
    JSON.stringify({
      has_SUPABASE_URL: Boolean(env.SUPABASE_URL),
      has_SUPABASE_SERVICE_ROLE_KEY: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
      keys_present: Object.keys(env || {}).sort()
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
