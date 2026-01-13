import { supabase } from "./auth.js";
window.supabase = supabase;

const navLoggedOut = document.getElementById("navLoggedOut");
const navLoggedIn = document.getElementById("navLoggedIn");
const loginLink = document.getElementById("loginLink");
const logoutBtn = document.getElementById("logoutBtn");
const adminLink = document.getElementById("adminLink");

const articlesMsg = document.getElementById("articlesMsg");
const articlesList = document.getElementById("articlesList");

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function updateNav() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    if (navLoggedOut) navLoggedOut.style.display = "";
    if (navLoggedIn) navLoggedIn.style.display = "none";
    if (adminLink) adminLink.style.display = "none";

    // preserve return path after login
    if (loginLink) loginLink.href = `/login.html?next=${encodeURIComponent(location.pathname)}`;
    return null;
  }

  if (navLoggedOut) navLoggedOut.style.display = "none";
  if (navLoggedIn) navLoggedIn.style.display = "";
  if (loginLink) loginLink.href = "/login.html";

  // Optional admin link toggle (only if you have profiles table with role)
  if (adminLink) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      adminLink.style.display = profile?.role === "admin" ? "" : "none";
    } catch {
      adminLink.style.display = "none";
    }
  }

  return session;
}

logoutBtn?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.reload();
});

async function loadArticles() {
  if (!articlesMsg || !articlesList) return;

  articlesMsg.textContent = "Loading…";

  const { data, error } = await supabase
    .from("pdf_submissions")
    .select("id,title,description,created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    articlesMsg.textContent = "Failed to load articles.";
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    articlesMsg.textContent = "No articles yet.";
    return;
  }

  articlesMsg.textContent = "";
  articlesList.innerHTML = data.map(a => `
    <div class="article-card">
      <h3>${escapeHtml(a.title)}</h3>
      <div class="article-meta">${new Date(a.created_at).toLocaleDateString()}</div>
      <p>${escapeHtml(a.description)}</p>
      <div class="article-actions">
        <button type="button" class="readBtn" data-id="${a.id}">Read / View</button>
      </div>
    </div>
  `).join("");

  document.querySelectorAll(".readBtn").forEach(btn => {
    btn.addEventListener("click", () => openPdf(btn.dataset.id));
  });
}

async function openPdf(submissionId) {
  const { data: { session } } = await supabase.auth.getSession();

  // require login to read
  if (!session) {
    window.location.href = `/login.html?next=${encodeURIComponent(location.pathname)}#articles`;
    return;
  }

  // NOTE: This endpoint will be added later (Pages Function).
  // For now it will fail until we create functions/api/signed-url.js
  const res = await fetch(`/api/signed-url?id=${encodeURIComponent(submissionId)}`, {
    headers: { Authorization: `Bearer ${session.access_token}` }
  });

  if (res.status === 401) {
    window.location.href = `/login.html?next=${encodeURIComponent(location.pathname)}#articles`;
    return;
  }

  if (!res.ok) {
    alert("Could not open PDF yet (server not configured).");
    return;
  }

  const { url } = await res.json();
  window.open(url, "_blank", "noopener,noreferrer");
}

await updateNav();
await loadArticles();

supabase.auth.onAuthStateChange(async () => {
  await updateNav();
});
