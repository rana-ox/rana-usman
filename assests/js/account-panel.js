(function () {
  async function waitForClient() {
    for (let i = 0; i < 100; i++) {
      if (window.supabase?.auth) return window.supabase;
      await new Promise(r => setTimeout(r, 50));
    }
    return null;
  }

  const panel = document.getElementById("accountPanel");
  const btn = document.getElementById("accountBtn");
  const menu = document.getElementById("accountMenu");

  function setOpen(open) {
    if (!menu) return;
    menu.style.display = open ? "block" : "none";
    menu.setAttribute("aria-hidden", open ? "false" : "true");
  }

  document.addEventListener("click", (e) => {
    if (!panel) return;
    if (!panel.contains(e.target)) setOpen(false);
  });

  btn?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(menu.style.display !== "block");
  });

  const label = document.getElementById("accountLabel");
  const sub = document.getElementById("accountSub");

  const menuLogin = document.getElementById("menuLogin");
  const menuSignup = document.getElementById("menuSignup");
  const menuSubmit = document.getElementById("menuSubmit");
  const menuMySub = document.getElementById("menuMySub");
  const menuChangePw = document.getElementById("menuChangePw");
  const menuAdmin = document.getElementById("menuAdmin");
  const menuLogout = document.getElementById("menuLogout");

  function show(el, on) {
    if (el) el.style.display = on ? "" : "none";
  }

  async function refreshUI(client) {
    const { data } = await client.auth.getSession();
    const session = data.session;

    if (!session) {
      label.textContent = "Guest";
      sub.textContent = "Not logged in";

      show(menuLogin, true);
      show(menuSignup, true);
      show(menuSubmit, false);
      show(menuMySub, false);
      show(menuChangePw, false);
      show(menuAdmin, false);
      show(menuLogout, false);
      return;
    }

    const email = session.user.email;
    const name =
      session.user.user_metadata?.full_name ||
      session.user.user_metadata?.name ||
      "Logged in";

    label.textContent = name;
    sub.textContent = email;

    show(menuLogin, false);
    show(menuSignup, false);
    show(menuSubmit, true);
    show(menuMySub, true);
    show(menuChangePw, true);
    show(menuAdmin, false);
    show(menuLogout, true);
  }

  (async () => {
    const client = await waitForClient();
    if (!client) return;

    await refreshUI(client);
    client.auth.onAuthStateChange(() => refreshUI(client));

    menuLogout?.addEventListener("click", async () => {
      setOpen(false);
      await client.auth.signOut();
      location.reload();
    });
  })();
})();