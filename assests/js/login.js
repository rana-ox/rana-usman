import { supabase } from "./auth.js";

const form = document.getElementById("loginForm");
const msg = document.getElementById("msg");
const goSignup = document.getElementById("goSignup");

function setMsg(text, type = "") {
  msg.textContent = text || "";
  msg.className = type; // "", "ok", "danger"
}

function getNextUrl() {
  const params = new URLSearchParams(location.search);
  const next = params.get("next");
  // safety: only allow same-site relative paths
  if (next && next.startsWith("/")) return next;
  return "/index.html";
}

// keep "Create account" returning to same next
(function syncNextToSignupLink() {
  const next = getNextUrl();
  if (goSignup) goSignup.href = `/signup.html?next=${encodeURIComponent(next)}`;
})();

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg("Logging in…");

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data?.session) {
    setMsg(error?.message || "Login failed.", "danger");
    return;
  }

  setMsg("Logged in. Redirecting…", "ok");
  window.location.href = getNextUrl();
});
