// settings.js — page Paramètres
(async function () {
  const $ = (id) => document.getElementById(id);
  const fail = (e) => { const b = $("s-error"); if (b) { b.hidden = false; b.textContent = "Une partie de la page n’a pas pu se charger : " + (e && e.message || e) + ". Videz le cache du navigateur (Ctrl+F5) et vérifiez que auth.js, config.js et settings.js sont bien les nouveaux fichiers."; } console.error(e); };
  if (typeof PM === "undefined" || !PM.settings || !PM.favs) { fail("auth.js n’est pas à jour"); return; }
  if (!(await PM.requireLogin())) return;
  try { PM.mountUserMenu(); } catch (e) { fail(e); }
  try {
    $("hero-name").textContent = PM.me.name || "Paramètres";
    $("hero-email").textContent = PM.me.email || "";
    $("hero-avatar").innerHTML = PM.avatarHtml(PM.me.profile);
    PM.hydrateAvatars($("hero-avatar"));
    $("hero-badge").hidden = !PM.isAdmin();
  } catch (e) { fail(e); }
  try {
  const me = () => PM.me;
  const flash = (id, text, ok = true) => { const el = $(id); el.textContent = PM.tr(text); el.classList.toggle("ok", ok); el.hidden = false; clearTimeout(el._t); el._t = setTimeout(() => { el.hidden = true; }, 3500); };

  // Compte
  $("s-name").value = me().name || "";
  $("s-email").value = me().email || "";
  $("name-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("s-name").value.trim();
    if (!name) return flash("name-msg", "Nom d’utilisateur", false);
    await PM.auth.save({ name });
    flash("name-msg", "Enregistré.");
  });
  $("pw-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    try { await PM.auth.changePassword($("pw-old").value, $("pw-new").value); $("pw-old").value = $("pw-new").value = ""; flash("pw-msg", "Mot de passe modifié."); }
    catch (err) { flash("pw-msg", err.userMessage || "Un problème est survenu. Réessayez.", false); }
  });

  // Profil et langue
  const p = me().profile;
  $("s-avatar").innerHTML = PM.avatarHtml(p, "av-xl");
  PM.hydrateAvatars($("s-avatar"));
  $("s-profile-name").textContent = p.name;
  $("s-profile-kind").textContent = (PM.PROFILE_KINDS.find((k) => k[0] === p.kind) || [0, ""])[1];
  const L = PM.LANGS.find((l) => l.code === PM.lang);
  $("s-lang").textContent = `${L.flag}  ${L.name}`;

  // Lecture
  const cfg = typeof CONFIG !== "undefined" ? CONFIG : {};
  const servers = (cfg.STREAM_SERVERS || []).map((s, i) => `<option value="${i}">Source ${i + 1}${typeof s === "object" && s.name ? " · " + PM.esc(s.name) : ""}</option>`);
  $("set-source").innerHTML = servers.join("");
  const st = PM.settings.get();
  $("set-sub").value = st.subLang || "";
  $("set-source").value = String(st.source || 0);
  $("set-next").checked = st.autoNext !== false;
  $("set-remember").checked = st.remember !== false;
  const saved = () => flash("set-msg", "Réglages enregistrés.");
  $("set-sub").addEventListener("change", () => { PM.settings.set({ subLang: $("set-sub").value }); saved(); });
  $("set-source").addEventListener("change", () => { PM.settings.set({ source: Number($("set-source").value) }); saved(); });
  $("set-next").addEventListener("change", () => { PM.settings.set({ autoNext: $("set-next").checked }); saved(); });
  $("set-remember").addEventListener("change", () => { PM.settings.set({ remember: $("set-remember").checked }); saved(); });

  // Favoris et historique
  const counts = () => { $("cnt-fav").textContent = PM.favs.list().length; $("cnt-rec").textContent = PM.recent.list().length; };
  counts();
  $("clr-fav").addEventListener("click", () => { if (confirm(PM.tr("Vider tous vos favoris ?"))) { PM.favs.clear(); counts(); } });
  $("clr-rec").addEventListener("click", () => { PM.recent.clear(); counts(); });

  // Administrateur
  if (PM.isAdmin()) {
    $("admin").hidden = false; $("nav-admin").hidden = false;
    $("adm-mode").textContent = PM.hasFirebase ? "En ligne" : "Démo locale";
    $("adm-note").textContent = PM.hasFirebase
      ? "Comptes Firebase : le total ci-dessous compte tous les inscrits du site."
      : "Mode démo : les comptes sont enregistrés dans ce navigateur, donc seuls les comptes créés sur cet appareil sont comptés. Renseignez Firebase dans config.js pour un vrai compteur.";
    try {
      const list = await PM.auth.listUsers();
      $("adm-count").textContent = list.length;
      $("adm-users").innerHTML = list.sort((a, b) => (b.created || 0) - (a.created || 0)).map((u) =>
        `<tr><td>${PM.esc(u.name || "")}</td><td>${PM.esc(u.email || "")}</td><td>${u.created ? new Date(u.created).toLocaleDateString(PM.lang) : "—"}</td></tr>`).join("");
    } catch { $("adm-count").textContent = "—"; }
  }

  // Zone sensible
  $("btn-out").addEventListener("click", () => PM.auth.signOut());
  $("btn-del").addEventListener("click", async () => {
    if (!confirm(PM.tr("Supprimer définitivement votre compte ?"))) return;
    try { await PM.auth.deleteAccount(); } catch { alert(PM.tr("Un problème est survenu. Réessayez.")); }
  });

  // Navigation latérale : section active selon le défilement
  const links = [...document.querySelectorAll(".settings-nav a")];
  const mark = () => {
    let cur = links[0];
    links.forEach((a) => { const t = document.querySelector(a.getAttribute("href")); if (t && !t.hidden && t.getBoundingClientRect().top < 140) cur = a; });
    links.forEach((a) => a.classList.toggle("is-active", a === cur));
  };
  window.addEventListener("scroll", mark, { passive: true });
  mark();
  if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
  } catch (e) { fail(e); }
})();
