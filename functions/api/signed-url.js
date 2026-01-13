export async function onRequest({ request, env }) {
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseUrl = env.SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return new Response("Missing SUPABASE env vars", { status: 500 });
  }

  // Expect: Authorization: Bearer <access_token>
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return new Response("Unauthorized", { status: 401 });

  const id = url.searchParams.get("id");
  if (!id) return new Response("Missing id", { status: 400 });

  // 1) Validate user token
  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: serviceKey
    }
  });
  if (!userRes.ok) return new Response("Unauthorized", { status: 401 });

  // 2) Load submission and ensure approved
  const subRes = await fetch(
    `${supabaseUrl}/rest/v1/pdf_submissions?id=eq.${encodeURIComponent(id)}&select=storage_path,status`,
    {
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        Accept: "application/json"
      }
    }
  );

  if (!subRes.ok) return new Response("Not found", { status: 404 });

  const rows = await subRes.json();
  const submission = rows?.[0];
  if (!submission) return new Response("Not found", { status: 404 });
  if (submission.status !== "approved") return new Response("Forbidden", { status: 403 });

  // 3) Create signed URL (bucket: pdfs)
  const signRes = await fetch(
    `${supabaseUrl}/storage/v1/object/sign/pdfs/${submission.storage_path}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ expiresIn: 60 })
    }
  );

  if (!signRes.ok) return new Response("Failed to sign URL", { status: 500 });

  const signed = await signRes.json();
  const signedPath = signed?.signedURL || signed?.signedUrl;
  if (!signedPath) return new Response("Failed to sign URL", { status: 500 });

  return new Response(JSON.stringify({ url: `${supabaseUrl}${signedPath}` }), {
    headers: { "Content-Type": "application/json" }
  });
}
