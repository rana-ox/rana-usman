import { supabase } from "./auth.js";

const form = document.getElementById("loginForm");
const googleLoginBtn = document.getElementById("googleLoginBtn");
const msg = document.getElementById("msg");
const goSignup = document.getElementById("goSignup");

/**
 * Update UI feedback message
 */
function setMsg(text, type = "") {
  msg.textContent = text || "";
  msg.className = type; // options: "", "ok", "danger"
}

/**
 * Determine the "next" URL for post-login redirection
 */
function getNextUrl() {
  const params = new URLSearchParams(location.search);
  const next = params.get("next");
  // Security: only allow relative paths
  if (next && next.startsWith("/")) return next;
  return "/index.html";
}

/**
 * Pass the "next" parameter to the signup link automatically
 */
(function syncNextToSignupLink() {
  const next = getNextUrl();
  if (goSignup) {
    goSignup.href = `/signup.html?next=${encodeURIComponent(next)}`;
  }
})();

/* --- GOOGLE LOGIN --- */
googleLoginBtn?.addEventListener("click", async () => {
  setMsg("Opening Google login...", "ok");

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // Directs user back to their original target page after Google Auth
      redirectTo: window.location.origin + getNextUrl()
    }
  });

  if (error) {
    setMsg(error.message, "danger");
  }
});

/* --- EMAIL LOGIN --- */
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg("Verifying...");

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({ 
    email, 
    password 
  });

  if (error || !data?.session) {
    setMsg(error?.message || "Invalid login credentials.", "danger");
    return;
  }

  setMsg("Success! Redirecting...", "ok");
  
  // Small delay for user to see the success message
  setTimeout(() => {
    window.location.href = getNextUrl();
  }, 800);
});
