import { createClient } from "@supabase/supabase-js";
import jwt from "@tsndr/cloudflare-worker-jwt";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return json({ error: "Missing id" }, 400);

  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return json({ error: "Missing Bearer token" }, 401);

  const ok = await jwt.verify(token, env.SUPABASE_JWT_SECRET);
  if (!ok) return json({ error: "Invalid token" }, 401);

  const decoded = jwt.decode(token);
  const userId = decoded?.payload?.sub;
  if (!userId) return json({ error: "Invalid token payload" }, 401);

  const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: sub, error: subErr } = await admin
    .from("submissions")
    .select("id,status,user_id,file_path")
    .eq("id", id)
    .single();

  if (subErr || !sub) return json({ error: "Submission not found" }, 404);
  if (!sub.file_path) return json({ error: "No file_path for this submission" }, 404);

  // Optional admin table; if it doesn't exist, treat as not admin
  let isAdmin = false;
  const { data: adminRow, error: adminErr } = await admin
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!adminErr && adminRow) isAdmin = true;

  const canRead = sub.status === "approved" || isAdmin || sub.user_id === userId;
  if (!canRead) return json({ error: "Forbidden" }, 403);

  const { data: signed, error: signErr } = await admin.storage
    .from("pdfs")
    .createSignedUrl(sub.file_path, 60 * 5);

  if (signErr || !signed?.signedUrl) {
    return json({ error: "Could not create signed URL" }, 500);
  }

  return json({ url: signed.signedUrl });
}
