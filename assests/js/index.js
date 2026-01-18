import { supabase } from "./auth.js";
window.supabase = supabase;

/* --- UI ELEMENTS --- */
const accountLabel = document.getElementById("accountLabel");
const accountSub = document.getElementById("accountSub");
const menuLogin = document.getElementById("menuLogin");
const menuSignup = document.getElementById("menuSignup");
const menuSubmit = document.getElementById("menuSubmit");
const menuMySub = document.getElementById("menuMySub");
const logoutBtn = document.getElementById("logoutBtn");
const adminLink = document.getElementById("adminLink");

const articlesMsg = document.getElementById("articlesMsg");
const articlesList = document.getElementById("articlesList");

/* --- MENU LOGIC --- */
const sideMenu = document.getElementById("sideMenu");
const overlay = document.getElementById("overlay");

document.getElementById("openMenuBtn").onclick = () => {
    sideMenu.style.width = "320px";
    overlay.style.display = "block";
};

document.getElementById("closeMenuBtn").onclick = closeMenu;
overlay.onclick = closeMenu;

function closeMenu() {
    sideMenu.style.width = "0";
    overlay.style.display = "none";
}

/* --- ORIGINAL UTILITY FUNCTIONS --- */
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* --- AUTH & UI SYNC --- */
async function updateNav() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    if (accountLabel) accountLabel.textContent = "Guest";
    if (accountSub) accountSub.textContent = "Not logged in";
    if (menuLogin) menuLogin.style.display = "flex";
    if (menuSignup) menuSignup.style.display = "flex";
    [menuSubmit, menuMySub, logoutBtn, adminLink].forEach(el => { if(el) el.style.display = "none"; });
    return null;
  }

  const user = session.user;
  if (accountLabel) accountLabel.textContent = user.user_metadata?.full_name || user.email.split('@')[0];
  if (accountSub) accountSub.textContent = user.email;
  if (menuLogin) menuLogin.style.display = "none";
  if (menuSignup) menuSignup.style.display = "none";
  [menuSubmit, menuMySub, logoutBtn].forEach(el => { if(el) el.style.display = "flex"; });

  if (adminLink) {
    try {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      adminLink.style.display = profile?.role === "admin" ? "flex" : "none";
    } catch { adminLink.style.display = "none"; }
  }
  return session;
}

/* --- ORIGINAL ARTICLE LOADING LOGIC --- */
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
      <button type="button" class="readBtn" data-id="${a.id}">Read / View</button>
    </div>
  `).join("");

  document.querySelectorAll(".readBtn").forEach(btn => {
    btn.addEventListener("click", () => openPdf(btn.dataset.id));
  });
}

async function openPdf(submissionId) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = `/login.html?next=${encodeURIComponent(location.pathname)}`;
    return;
  }
  const res = await fetch(`/api/signed-url?id=${encodeURIComponent(submissionId)}`, {
    headers: { Authorization: `Bearer ${session.access_token}` }
  });
  if (!res.ok) { alert("Could not open PDF yet (server not configured)."); return; }
  const { url } = await res.json();
  window.open(url, "_blank", "noopener,noreferrer");
}

/* --- Q&A LOGIC --- */
document.querySelectorAll('.qa-item').forEach(item => {
    item.addEventListener('click', async () => {
        const viewer = document.getElementById('qa-viewer');
        viewer.innerHTML = '<p style="text-align:center;">Loading...</p>';
        const res = await fetch(`/questions/${item.dataset.slug}`);
        viewer.innerHTML = await res.text();
    });
});

/* --- LOGOUT --- */
logoutBtn?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.reload();
});

// Initialization
await updateNav();
await loadArticles();
supabase.auth.onAuthStateChange(() => updateNav());
