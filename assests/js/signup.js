import { createClient } from "@supabase/supabase-js";
import jwt from "@tsndr/cloudflare-worker-jwt";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Optional CORS if you ever call from a different origin:
      // "access-control-allow-origin": "*",
    },
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return json({ error: "Missing id" }, 400);

  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return json({ error: "Missing Bearer token" }, 401);

  // 1) Verify Supabase JWT
  const ok = await jwt.verify(token, env.SUPABASE_JWT_SECRET);
  if (!ok) return json({ error: "Invalid token" }, 401);

  const decoded = jwt.decode(token);
  const userId = decoded?.payload?.sub;
  if (!userId) return json({ error: "Invalid token payload" }, 401);

  // 2) Service role client (bypasses RLS so we enforce rules here)
  const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // 3) Load submission + check access
  const { data: sub, error: subErr } = await admin
    .from("submissions")
    .select("id,status,user_id")
    .eq("id", id)
    .single();

  if (subErr || !sub) return json({ error: "Submission not found" }, 404);

  // Determine admin
  const { data: adminRow } = await admin
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  const isAdmin = !!adminRow;

  const canRead =
    sub.status === "approved" || isAdmin || sub.user_id === userId;

  if (!canRead) return json({ error: "Forbidden" }, 403);

  // 4) Signed URL for the PDF
  const objectPath = `articles/${id}.pdf`;

  const { data: signed, error: signErr } = await admin.storage
    .from("pdfs")
    .createSignedUrl(objectPath, 60 * 5); // 5 minutes

  if (signErr || !signed?.signedUrl) {
    return json({ error: "Could not create signed URL" }, 500);
  }

  return json({ url: signed.signedUrl });
}
