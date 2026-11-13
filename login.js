// login.js — pages d'identification : connexion, inscription, mot de passe oublié, langue, profil.
(async function () {
  const $ = (id) => document.getElementById(id);
  const page = document.body.dataset.page;
  const params = new URLSearchParams(location.search);
  const safeNext = () => { const n = params.get("next") || ""; return /^[a-z-]+\.html(#\w+)?$/i.test(n) ? n : ""; };
  const say = (el, text, ok = false) => { if (!el) return; el.hidden = !text; el.textContent = PM.tr(text || ""); el.classList.toggle("ok", ok); };

  // Affiches de fond (si la clé TMDB est disponible)
  (async function wall() {
    const box = $("wall");
    if (!box) return;
    try {
      const key = typeof CONFIG !== "undefined" ? CONFIG.TMDB_KEY : "";
      if (!key) return;
      const r = await fetch(`https://api.themoviedb.org/3/trending/all/week?api_key=${key}`);
      const posters = (await r.json()).results.map((x) => x.poster_path).filter(Boolean);
      if (!posters.length) return;
      const cols = 6, per = Math.max(8, Math.ceil(posters.length / cols));
      box.innerHTML = Array.from({ length: cols }, (_, c) => {
        const one = Array.from({ length: per }, (_, i) => posters[(c * per + i) % posters.length]);
        return `<div class="col">${[...one, ...one].map((p) => `<img src="https://image.tmdb.org/t/p/w185${p}" alt="" loading="lazy">`).join("")}</div>`;
      }).join("");
    } catch { /* fond dégradé seulement */ }
  })();

  await PM.ready;
  const me = PM.me;
  const finished = Boolean(me && me.lang && me.profile);

  // Connexion / inscription / mot de passe oublié : déjà connecté → on continue sans repasser par là.
  if (["login", "signup", "forgot"].includes(page)) {
    if (await PM.redirectIfLoggedIn()) return;
  } else if (!me) { location.replace("login.html"); return; }

  const eye = $("eye");
  if (eye) eye.addEventListener("click", () => { const p = $("f-pw"); p.type = p.type === "password" ? "text" : "password"; });

  // ----- Connexion et inscription -----
  const form = $("auth-form");
  if (form) form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("auth-submit");
    btn.disabled = true; say($("auth-msg"), "");
    try {
      if (page === "signup") await PM.auth.signUp($("f-email").value, $("f-pw").value, $("f-name").value);
      else await PM.auth.signIn($("f-email").value, $("f-pw").value);
      await PM.redirectIfLoggedIn();
    } catch (err) { say($("auth-msg"), err.userMessage || "Un problème est survenu. Réessayez."); btn.disabled = false; }
  });

  // ----- Mot de passe oublié -----
  const reset = $("reset-form");
  if (reset) reset.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const r = await PM.auth.reset($("r-email").value);
      say($("reset-msg"), r === "sent" ? "Un lien vient d’être envoyé à cette adresse." : "Compte trouvé. (Mode démo : l’envoi d’e-mails demande Firebase, voir LISEZMOI.md.)", true);
    } catch (err) { say($("reset-msg"), err.userMessage || "Un problème est survenu. Réessayez."); }
  });

  // ----- Langue -----
  if (page === "language") {
    let picked = me.lang || null;
    const grid = $("lang-grid"), next = $("lang-next");
    grid.innerHTML = PM.LANGS.map((l) =>
      `<button class="lang-card${l.code === picked ? " is-picked" : ""}" type="button" data-code="${l.code}"><span class="flag">${l.flag}</span>${l.name}</button>`).join("");
    if (finished) { $("lang-cancel").hidden = false; $("lang-back").href = safeNext() || "settings.html"; document.querySelector(".step").hidden = true; }
    else if (me.profile) document.querySelector(".step").hidden = true;
    next.disabled = !picked;
    grid.addEventListener("click", (e) => {
      const card = e.target.closest("[data-code]");
      if (!card) return;
      picked = card.dataset.code;
      grid.querySelectorAll(".lang-card").forEach((c) => c.classList.toggle("is-picked", c === card));
      next.disabled = false;
    });
    next.addEventListener("click", async () => {
      next.disabled = true;
      await PM.auth.save({ lang: picked });
      location.replace(safeNext() || (me.profile ? "settings.html" : "profiles.html"));
    });
  }

  // ----- Profil -----
  if (page === "profiles") {
    let kind = PM.me.profile?.kind || "anime";
    let picked = PM.me.profile || null;
    const grid = $("profile-grid"), next = $("profile-next"), tabs = $("profile-tabs");
    if (finished) { $("profile-cancel").hidden = false; $("profile-back").href = safeNext() || "settings.html"; $("profile-step").hidden = true; next.textContent = PM.tr("Enregistrer"); }
    tabs.innerHTML = PM.PROFILE_KINDS.map(([k, label]) => `<button class="tab-btn${k === kind ? " is-active" : ""}" type="button" data-kind="${k}" role="tab">${label}</button>`).join("");
    const short = (name) => (/^(Son|Monkey|Portgas|Nico|Roronoa|Ryomen|Satoru|Light|Kyojuro)/.test(name) ? name.split(" ").pop() : name.split(" ")[0]);
    function draw() {
      grid.innerHTML = PM.PROFILES[kind].map(([name, c, emoji]) => {
        const p = { name, kind, c, emoji: emoji || "" };
        const on = picked && picked.name === name && picked.kind === kind;
        return `<button class="profile-card${on ? " is-picked" : ""}" type="button" data-name="${PM.esc(name)}" data-c="${c}">${PM.avatarHtml(p)}<span>${PM.esc(emoji ? name : short(name))}</span></button>`;
      }).join("");
      PM.translateDom(grid);
      PM.hydrateAvatars(grid);
    }
    tabs.addEventListener("click", (e) => {
      const b = e.target.closest("[data-kind]");
      if (!b) return;
      kind = b.dataset.kind;
      tabs.querySelectorAll(".tab-btn").forEach((x) => x.classList.toggle("is-active", x === b));
      draw();
    });
    grid.addEventListener("click", (e) => {
      const card = e.target.closest(".profile-card");
      if (!card) return;
      const img = card.querySelector(".av img");
      picked = { name: card.dataset.name, kind, c: card.dataset.c, img: img ? img.getAttribute("src") : "" };
      grid.querySelectorAll(".profile-card").forEach((c) => c.classList.toggle("is-picked", c === card));
      next.disabled = false;
    });
    next.disabled = !picked;
    next.addEventListener("click", async () => {
      next.disabled = true;
      await PM.auth.save({ profile: picked });
      location.replace(safeNext() || (finished ? "settings.html" : "index.html"));
    });
    draw();
  }
})();
