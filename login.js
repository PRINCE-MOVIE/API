// login.js — connexion, choix de la langue, choix du profil
(async function () {
  const $ = (id) => document.getElementById(id);
  const steps = { auth: $("step-auth"), language: $("step-language"), profile: $("step-profile") };
  const show = (name) => {
    Object.entries(steps).forEach(([k, el]) => { el.hidden = k !== name; });
    PM.translateDom(steps[name]);
  };
  const say = (el, text, ok = false) => { el.hidden = !text; el.textContent = PM.tr(text || ""); el.classList.toggle("ok", ok); };

  // Affiches de fond (si la clé TMDB est disponible)
  (async function wall() {
    const box = $("wall");
    const fill = (posters) => {
      const cols = 6, per = Math.max(8, Math.ceil(posters.length / cols));
      box.innerHTML = Array.from({ length: cols }, (_, c) => {
        const one = Array.from({ length: per }, (_, i) => posters[(c * per + i) % posters.length]);
        const cells = [...one, ...one].map((p) => (p ? `<img src="https://image.tmdb.org/t/p/w185${p}" alt="" loading="lazy">` : "<i></i>")).join("");
        return `<div class="col">${cells}</div>`;
      }).join("");
    };
    fill([]);
    try {
      const key = typeof CONFIG !== "undefined" ? CONFIG.TMDB_KEY : "";
      if (!key) return;
      const r = await fetch(`https://api.themoviedb.org/3/trending/all/week?api_key=${key}`);
      const list = (await r.json()).results.map((x) => x.poster_path).filter(Boolean);
      if (list.length) fill(list);
    } catch { /* fond dégradé seulement */ }
  })();

  await PM.ready;

  // ----- Connexion / inscription -----
  let mode = "login";
  const form = $("auth-form");
  document.querySelectorAll("#step-auth [data-mode]").forEach((b) => b.addEventListener("click", () => {
    mode = b.dataset.mode;
    document.querySelectorAll("#step-auth [data-mode]").forEach((x) => x.classList.toggle("is-active", x === b));
    form.querySelector(".f-name").hidden = mode !== "signup";
    $("auth-submit").textContent = PM.tr(mode === "signup" ? "Créer mon compte" : "Se connecter");
    $("f-pw").autocomplete = mode === "signup" ? "new-password" : "current-password";
    say($("auth-msg"), "");
  }));
  $("eye").addEventListener("click", () => { const p = $("f-pw"); p.type = p.type === "password" ? "text" : "password"; });
  $("forgot").addEventListener("click", () => { $("auth-main").hidden = true; $("reset-form").hidden = false; $("r-email").value = $("f-email").value; });
  $("back-login").addEventListener("click", () => { $("reset-form").hidden = true; $("auth-main").hidden = false; });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("auth-submit");
    btn.disabled = true; say($("auth-msg"), "");
    try {
      if (mode === "signup") await PM.auth.signUp($("f-email").value, $("f-pw").value, $("f-name").value);
      else await PM.auth.signIn($("f-email").value, $("f-pw").value);
      route();
    } catch (err) { say($("auth-msg"), err.userMessage || "Un problème est survenu. Réessayez."); }
    btn.disabled = false;
  });

  $("reset-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const r = await PM.auth.reset($("r-email").value);
      say($("reset-msg"), r === "sent" ? "Un lien vient d’être envoyé à cette adresse." : "Compte trouvé. (Mode démo : l’envoi d’e-mails demande Firebase, voir LISEZMOI.md.)", true);
    } catch (err) { say($("reset-msg"), err.userMessage || "Un problème est survenu. Réessayez."); }
  });

  // ----- Langue -----
  let pickedLang = PM.me?.lang || null;
  $("lang-grid").innerHTML = PM.LANGS.map((l) =>
    `<button class="lang-card${l.code === pickedLang ? " is-picked" : ""}" type="button" data-code="${l.code}"><span class="flag">${l.flag}</span>${l.name}</button>`).join("");
  $("lang-grid").addEventListener("click", (e) => {
    const card = e.target.closest("[data-code]");
    if (!card) return;
    pickedLang = card.dataset.code;
    $("lang-grid").querySelectorAll(".lang-card").forEach((c) => c.classList.toggle("is-picked", c === card));
    $("lang-next").disabled = false;
  });
  $("lang-next").disabled = !pickedLang;
  $("lang-next").addEventListener("click", async () => {
    $("lang-next").disabled = true;
    await PM.auth.save({ lang: pickedLang });
    // On recharge pour que toute la page s'affiche dans la langue choisie.
    location.hash = PM.me.profile ? "" : "profile";
    location.reload();
  });

  // ----- Profil -----
  let kind = "anime", pickedProfile = PM.me?.profile || null;
  async function drawProfiles() {
    const grid = $("profile-grid");
    grid.innerHTML = PM.PROFILES[kind].map(([name, c]) => {
      const p = { name, kind, c, img: "" };
      return `<button class="profile-card${pickedProfile && pickedProfile.name === name ? " is-picked" : ""}" type="button" data-name="${PM.esc(name)}" data-c="${c}">${PM.avatarHtml(p)}<span>${PM.esc(/^(Son|Monkey)/.test(name) ? name.split(" ").pop() : name.split(" ")[0])}</span></button>`;
    }).join("");
    // Les vraies images arrivent au fur et à mesure (animés : Jikan, stars : TMDB).
    for (const card of grid.querySelectorAll(".profile-card")) {
      PM.profileImage(kind, card.dataset.name).then((url) => {
        if (!url || !card.isConnected) return;
        card.dataset.img = url;
        card.querySelector(".av").innerHTML = `<img src="${PM.esc(url)}" alt="" referrerpolicy="no-referrer">`;
      });
    }
  }
  document.querySelectorAll("#step-profile [data-kind]").forEach((b) => b.addEventListener("click", () => {
    kind = b.dataset.kind;
    document.querySelectorAll("#step-profile [data-kind]").forEach((x) => x.classList.toggle("is-active", x === b));
    drawProfiles();
  }));
  $("profile-grid").addEventListener("click", (e) => {
    const card = e.target.closest(".profile-card");
    if (!card) return;
    pickedProfile = { name: card.dataset.name, kind, c: card.dataset.c, img: card.dataset.img || "" };
    $("profile-grid").querySelectorAll(".profile-card").forEach((c) => c.classList.toggle("is-picked", c === card));
    $("profile-next").disabled = false;
  });
  $("profile-next").disabled = !pickedProfile;
  $("profile-next").addEventListener("click", async () => {
    $("profile-next").disabled = true;
    await PM.auth.save({ profile: pickedProfile });
    location.replace("index.html");
  });

  // ----- Aiguillage -----
  function route() {
    const me = PM.me, h = location.hash.replace("#", "");
    if (!me) return show("auth");
    if (h === "language" || !me.lang) { show("language"); return; }
    if (h === "profile" || !me.profile) { drawProfiles(); show("profile"); return; }
    location.replace("index.html");
  }
  route();
})();
