import { supabase } from "./auth.js";

const msg = document.getElementById("msg");
const list = document.getElementById("list");
const loginLink = document.getElementById("loginLink");
const logoutBtn = document.getElementById("logoutBtn");

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function updateAuthUI() {
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    loginLink.style.display = "none";
    logoutBtn.style.display = "";
  } else {
    loginLink.style.display = "";
    logoutBtn.style.display = "none";
    loginLink.href = `/login.html?next=${encodeURIComponent("/articles/")}`;
  }
}

logoutBtn?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.reload();
});

async function loadApprovedArticles() {
  msg.textContent = "Loading…";

  const { data, error } = await supabase
    .from("pdf_submissions")
    .select("id,title,description,created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    msg.textContent = "Failed to load articles.";
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    msg.textContent = "No articles yet.";
    return;
  }

  msg.textContent = "";
  list.innerHTML = data.map(a => `
    <div class="card">
      <h3>${escapeHtml(a.title)}</h3>
      <div class="meta">${new Date(a.created_at).toLocaleDateString()}</div>
      <p>${escapeHtml(a.description)}</p>
      <div class="actions">
        <button type="button" class="readBtn" data-id="${a.id}">Read / View</button>
      </div>
    </div>
  `).join("");

  document.querySelectorAll(".readBtn").forEach(btn => {
    btn.addEventListener("click", () => openPdf(btn.dataset.id));
  });
}

async function openPdf(id) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = `/login.html?next=${encodeURIComponent("/articles/")}`;
    return;
  }

  // This requires the Pages Function we'll add next: /functions/api/signed-url.js
  const res = await fetch(`/api/signed-url?id=${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${session.access_token}` }
  });

  if (res.status === 401) {
    window.location.href = `/login.html?next=${encodeURIComponent("/articles/")}`;
    return;
  }

  if (!res.ok) {
    alert("Could not open PDF yet (API not configured).");
    return;
  }

  const { url } = await res.json();
  window.open(url, "_blank", "noopener,noreferrer");
}

await updateAuthUI();
await loadApprovedArticles();
supabase.auth.onAuthStateChange(async () => updateAuthUI());