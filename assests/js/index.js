import { supabase } from "./auth.js";
window.supabase = supabase;

// --- Elements ---
const accountLabel = document.getElementById("accountLabel");
const accountSub = document.getElementById("accountSub");
const menuLogin = document.getElementById("menuLogin");
const menuSignup = document.getElementById("menuSignup");
const menuSubmit = document.getElementById("menuSubmit");
const menuMySub = document.getElementById("menuMySub");
const logoutBtn = document.getElementById("logoutBtn");
const adminLink = document.getElementById("adminLink");

// --- Menu UI Logic ---
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

// --- Auth Sync Logic ---
async function updateUI() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    if (accountLabel) accountLabel.textContent = "Guest";
    if (accountSub) accountSub.textContent = "Not logged in";
    if (menuLogin) menuLogin.style.display = "flex";
    if (menuSignup) menuSignup.style.display = "flex";
    
    [menuSubmit, menuMySub, logoutBtn, adminLink].forEach(el => {
        if(el) el.style.display = "none";
    });
    return;
  }

  // User Logged In
  const user = session.user;
  if (accountLabel) accountLabel.textContent = user.user_metadata?.full_name || user.email.split('@')[0];
  if (accountSub) accountSub.textContent = user.email;
  
  if (menuLogin) menuLogin.style.display = "none";
  if (menuSignup) menuSignup.style.display = "none";
  
  if (menuSubmit) menuSubmit.style.display = "flex";
  if (menuMySub) menuMySub.style.display = "flex";
  if (logoutBtn) logoutBtn.style.display = "flex";

  // Admin Role Check
  if (adminLink) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    adminLink.style.display = profile?.role === "admin" ? "flex" : "none";
  }
}

// --- Logout ---
logoutBtn?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.reload();
});

// --- Q&A Logic ---
document.querySelectorAll('.qa-item').forEach(item => {
    item.addEventListener('click', async () => {
        const viewer = document.getElementById('qa-viewer');
        viewer.innerHTML = '<p style="text-align:center;">Loading...</p>';
        try {
            const res = await fetch(`/questions/${item.dataset.slug}`);
            viewer.innerHTML = await res.text();
        } catch (e) {
            viewer.innerHTML = '<p>Answer not found.</p>';
        }
    });
});

// Init
updateUI();
supabase.auth.onAuthStateChange(() => updateUI());
