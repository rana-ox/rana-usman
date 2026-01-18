import { supabase } from "./auth.js";
window.supabase = supabase; // Export to window for debugging

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

/* --- MENU UI CONTROL --- */
const sideMenu = document.getElementById("sideMenu");
const overlay = document.getElementById("overlay");

document.getElementById("openMenuBtn").onclick = () => {
    sideMenu.style.width = "320px";
    overlay.style.display = "block";
};

const closeMenu = () => {
    sideMenu.style.width = "0";
    overlay.style.display = "none";
};

document.getElementById("closeMenuBtn").onclick = closeMenu;
overlay.onclick = closeMenu;

/* --- UTILITIES --- */
function escapeHtml(str) {
  return String(str ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

/* --- AUTH SYNC --- */
async function updateNav() {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
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

  // Safe Admin Check
  if (adminLink) {
    try {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      adminLink.style.display = (profile && profile.role === "admin") ? "flex" : "none";
    } catch (e) {
      console.warn("Profile check failed. This is normal if you don't have a 'profiles' table yet.");
      adminLink.style.display = "none";
    }
  }
  return session;
}

/* --- ARTICLES & PDF --- */
async function loadArticles() {
  if (!articlesMsg || !articlesList) return;
  articlesMsg.textContent = "Loading articles...";

  const { data, error } = await supabase
    .from("pdf_submissions")
    .select("id,title,description,created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    articlesMsg.textContent = "Error loading content.";
    return;
  }
  if (!data || data.length === 0) {
    articlesMsg.textContent = "No approved notes available yet.";
    return;
  }

  articlesMsg.textContent = "";
  articlesList.innerHTML = data.map(a => `
    <div class="article-card">
      <h3>${escapeHtml(a.title)}</h3>
      <div class="article-meta">${new Date(a.created_at).toLocaleDateString()}</div>
      <p>${escapeHtml(a.description)}</p>
      <button type="button" class="readBtn" data-id="${a.id}">Read / View PDF</button>
    </div>
  `).join("");

  document.querySelectorAll(".readBtn").forEach(btn => {
    btn.onclick = () => openPdf(btn.dataset.id);
  });
}

async function openPdf(submissionId) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = `/login.html?next=${encodeURIComponent(location.pathname)}`;
    return;
  }
  
  // NOTE: This fetch requires a backend function to be set up later
  try {
    const res = await fetch(`/api/signed-url?id=${encodeURIComponent(submissionId)}`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    });
    if (!res.ok) throw new Error("Backend not configured");
    const { url } = await res.json();
    window.open(url, "_blank");
  } catch (err) {
    alert("Backend configuration pending: The PDF system requires a Cloudflare Worker or Supabase Edge function.");
  }
}

/* --- Q&A HUB --- */
document.querySelectorAll('.qa-item').forEach(item => {
    item.onclick = async () => {
        const viewer = document.getElementById('qa-viewer');
        viewer.innerHTML = '<p style="text-align:center;">Fetching answer...</p>';
        try {
            const res = await fetch(`/questions/${item.dataset.slug}`);
            if (!res.ok) throw new Error();
            viewer.innerHTML = await res.text();
        } catch {
            viewer.innerHTML = '<p style="text-align:center; color: #ff4b2b;">Question file not found in /questions/ folder.</p>';
        }
    };
});

/* --- INITIALIZE --- */
logoutBtn.onclick = async () => {
  await supabase.auth.signOut();
  window.location.reload();
};

async function init() {
    await updateNav();
    await loadArticles();
    supabase.auth.onAuthStateChange(() => updateNav());
}

init();
