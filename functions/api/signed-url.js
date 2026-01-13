import { createClient } from "@supabase/supabase-js";

export async function onRequest(context) {
  const { request, env } = context;

  // Environment variables
  const supabaseUrl = env.SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return new Response("Server misconfigured", { status: 500 });
  }

  // Extract the user's Supabase token from the Authorization header
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return new Response("Unauthorized", { status: 401 });

  // Parse the PDF ID from the query string
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return new Response("Missing id", { status: 400 });

  // Initialize Supabase Admin Client
  const supabaseAdmin = createClient(supabaseUrl, serviceKey);

  // Verify that the token belongs to a logged-in user
  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
  if (userErr || !userData?.user) return new Response("Unauthorized", { status: 401 });

  // Fetch the PDF entry to ensure it exists and is approved
  const { data: submission, error: subErr } = await supabaseAdmin
    .from("pdf_submissions")
    .select("storage_path,status")
    .eq("id", id)
    .single();

  if (subErr || !submission) return new Response("Not found", { status: 404 });
  if (submission.status !== "approved") return new Response("Forbidden", { status: 403 });

  // Generate a signed URL for the approved PDF
  const { data: signed, error: signErr } = await supabaseAdmin.storage
    .from("pdfs")
    .createSignedUrl(submission.storage_path, 60); // 60 seconds

  if (signErr || !signed) return new Response("Failed to generate signed URL", { status: 500 });

  return Response.json({ url: signed.signedUrl });
}