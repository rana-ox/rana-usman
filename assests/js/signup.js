import { supabase } from "./auth.js";

const form = document.getElementById("signupForm");
const msg = document.getElementById("msg");
const goLogin = document.getElementById("goLogin");

function setMsg(text, type = "") {
  msg.textContent = text || "";
  msg.className = type; // "", "ok", "danger"
}

function getNextUrl() {
  const params = new URLSearchParams(location.search);
  const next = params.get("next");
  if (next && next.startsWith("/")) return next;
  return "/index.html";
}

// keep "Already have an account" returning to same next
(function syncNextToLoginLink() {
  const next = getNextUrl();
  if (goLogin) goLogin.href = `/login.html?next=${encodeURIComponent(next)}`;
})();

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg("Creating account…");

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    setMsg(error.message || "Signup failed.", "danger");
    return;
  }

  // Supabase may require email confirmation depending on your Auth settings.
  if (!data?.session) {
    setMsg("Account created. Please check your email to confirm, then login.", "ok");
    return;
  }

  setMsg("Signed up. Redirecting…", "ok");
  window.location.href = getNextUrl();
});
