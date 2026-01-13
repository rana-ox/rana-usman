import { supabase } from "./auth.js";

const elLoggedOut = document.getElementById("nav-logged-out");
const elLoggedIn = document.getElementById("nav-logged-in");
const adminLink = document.getElementById("adminLink");
const logoutBtn = document.getElementById("logoutBtn");

const statusMsg = document.getElementById("statusMsg");
const pdfList = document.getElementById("pdfList");

async function updateNav() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    elLoggedOut.style.display = "";
    elLoggedIn.style.display = "none";
    adminLink.style.display = "none";
    return null;
  }

  elLoggedOut.style.display = "none";
  elLoggedIn.style.display = "";

  // Show admin link only for admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  adminLink.style.display = profile?.role === "admin" ? "" : "none";
  return session;
}

logoutBtn?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.reload();
});

async function loadApproved() {
  statusMsg.textContent = "Loading approved PDFs…";

  const { data, error } = await supabase
    .from("pdf_submissions")
    .select("id,title,description,created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    statusMsg.textContent = "Failed to load.";
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    statusMsg.textContent = "No approved PDFs yet.";
    return;
  }

  statusMsg.textContent = "";
  pdfList.innerHTML = data.map(item => `
    <article class="pdf-card">
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.description ?? "")}</p>
      <small>${new Date(item.created_at).toLocaleDateString()}</small>
      <div class="actions">
        <button data-id="${item.id}" class="viewBtn" type="button">View PDF</button>
      </div>
    </article>
  `).join("");

  document.querySelectorAll(".viewBtn").forEach(btn => {
    btn.addEventListener("click", () => viewPdf(btn.dataset.id));
  });
}

async function viewPdf(submissionId) {
  // Calls your Cloudflare Pages Function /api/signed-url
  const res = await fetch(`/api/signed-url?id=${encodeURIComponent(submissionId)}`);
  if (!res.ok) {
    alert("Unable to open PDF (not approved or link error).");
    return;
  }
  const { url } = await res.json();
  window.open(url, "_blank", "noopener,noreferrer");
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

await updateNav();
await loadApproved();

// Keep nav synced if session changes
supabase.auth.onAuthStateChange(async () => {
  await updateNav();
});
