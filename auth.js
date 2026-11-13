// auth.js — PRINCE MOVIE : comptes, langue, profils, administrateur.
// Mode Firebase (vrais comptes, vrai compteur d'utilisateurs) si CONFIG.FIREBASE est rempli,
// sinon mode local (démo : les comptes restent dans ce navigateur).
(function () {
  const C = typeof CONFIG !== "undefined" ? CONFIG : {};
  const ADMINS = (C.ADMIN_EMAILS || []).map((e) => e.toLowerCase());
  const FB = C.FIREBASE && C.FIREBASE.apiKey ? C.FIREBASE : null;
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignoré */ } }
  };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const LANGS = [
    { code: "fr", name: "Français", flag: "🇫🇷", tmdb: "fr-FR" },
    { code: "en", name: "English", flag: "🇬🇧", tmdb: "en-US" },
    { code: "es", name: "Español", flag: "🇪🇸", tmdb: "es-ES" },
    { code: "pt", name: "Português", flag: "🇧🇷", tmdb: "pt-BR" }
  ];

  // Dictionnaire : texte français → [anglais, espagnol, portugais]
  const D = {
    "Paramètres": ["Settings", "Ajustes", "Configurações"], "Ma liste": ["My list", "Mi lista", "Minha lista"], "Favoris": ["Favorites", "Favoritos", "Favoritos"],
    "Reprendre la lecture": ["Continue watching", "Seguir viendo", "Continuar assistindo"], "Mon compte": ["My account", "Mi cuenta", "Minha conta"],
    "Ajouter à ma liste": ["Add to my list", "Añadir a mi lista", "Adicionar à minha lista"], "Retirer de ma liste": ["Remove from my list", "Quitar de mi lista", "Remover da minha lista"],
    "Enregistrer": ["Save", "Guardar", "Salvar"], "Annuler": ["Cancel", "Cancelar", "Cancelar"], "Profil": ["Profile", "Perfil", "Perfil"], "Lecture automatique": ["Autoplay", "Reproducción automática", "Reprodução automática"],
    "Vous n’avez encore aucun favori.": ["You have no favorites yet.", "Aún no tienes favoritos.", "Você ainda não tem favoritos."],
    "Accueil": ["Home", "Inicio", "Início"], "Films": ["Movies", "Películas", "Filmes"], "Séries": ["Series", "Series", "Séries"],
    "Rechercher": ["Search", "Buscar", "Buscar"], "Titres, séries, films": ["Titles, series, movies", "Títulos, series, películas", "Títulos, séries, filmes"],
    "Lecture": ["Play", "Reproducir", "Assistir"], "Plus d’infos": ["More info", "Más info", "Mais info"], "Retour": ["Back", "Volver", "Voltar"],
    "Plein écran": ["Fullscreen", "Pantalla completa", "Tela cheia"], "Quitter le plein écran": ["Exit fullscreen", "Salir de pantalla completa", "Sair da tela cheia"],
    "Source": ["Source", "Fuente", "Fonte"], "Langue": ["Language", "Idioma", "Idioma"], "Saison": ["Season", "Temporada", "Temporada"],
    "Épisode": ["Episode", "Episodio", "Episódio"], "Lire l’épisode": ["Play episode", "Ver episodio", "Assistir episódio"],
    "Top 10 du moment": ["Top 10 right now", "Top 10 del momento", "Top 10 do momento"], "Films populaires": ["Popular movies", "Películas populares", "Filmes populares"],
    "Séries populaires": ["Popular series", "Series populares", "Séries populares"], "Films les mieux notés": ["Top rated movies", "Películas mejor valoradas", "Filmes mais bem avaliados"],
    "Séries les mieux notées": ["Top rated series", "Series mejor valoradas", "Séries mais bem avaliadas"], "Actuellement au cinéma": ["Now in theaters", "En cines ahora", "Em cartaz"],
    "Diffusées en ce moment": ["On air now", "En emisión", "No ar agora"], "Film": ["Movie", "Película", "Filme"], "Série": ["Series", "Serie", "Série"],
    "Chargement…": ["Loading…", "Cargando…", "Carregando…"], "Épisode suivant": ["Next episode", "Episodio siguiente", "Próximo episódio"],
    "Film suivant": ["Next movie", "Siguiente película", "Próximo filme"],
    "Terminé ? Enchaînez avec la suite.": ["Finished? Keep going with what’s next.", "¿Terminaste? Sigue con lo siguiente.", "Terminou? Continue com o próximo."],
    "Regarder l’épisode suivant": ["Watch next episode", "Ver el episodio siguiente", "Assistir ao próximo episódio"],
    "Regarder le film suivant": ["Watch the next movie", "Ver la siguiente película", "Assistir ao próximo filme"],
    "Plus tard": ["Later", "Más tarde", "Mais tarde"], "Déconnexion": ["Log out", "Cerrar sesión", "Sair"],
    "Changer de profil": ["Change profile", "Cambiar de perfil", "Trocar de perfil"], "Changer de langue": ["Change language", "Cambiar idioma", "Trocar idioma"],
    "Utilisateurs inscrits": ["Registered users", "Usuarios registrados", "Usuários cadastrados"], "Administrateur": ["Administrator", "Administrador", "Administrador"],
    "Connexion": ["Log in", "Iniciar sesión", "Entrar"], "Inscription": ["Sign up", "Registro", "Cadastro"], "Se connecter": ["Log in", "Iniciar sesión", "Entrar"],
    "Créer mon compte": ["Create my account", "Crear mi cuenta", "Criar minha conta"], "Mot de passe oublié ?": ["Forgot password?", "¿Olvidaste tu contraseña?", "Esqueceu a senha?"],
    "Adresse e-mail": ["Email address", "Correo electrónico", "E-mail"], "Mot de passe": ["Password", "Contraseña", "Senha"], "Nom d’utilisateur": ["Username", "Nombre de usuario", "Nome de usuário"],
    "Retrouver mon compte": ["Find my account", "Recuperar mi cuenta", "Encontrar minha conta"], "Envoyer le lien": ["Send the link", "Enviar el enlace", "Enviar o link"],
    "Retour à la connexion": ["Back to log in", "Volver al inicio de sesión", "Voltar ao login"],
    "Saisissez l’e-mail de votre compte : nous vous envoyons un lien pour choisir un nouveau mot de passe.": ["Enter your account email: we’ll send you a link to choose a new password.", "Escribe el correo de tu cuenta: te enviaremos un enlace para elegir una nueva contraseña.", "Digite o e-mail da sua conta: enviaremos um link para criar uma nova senha."],
    "Films et séries, sans limites.": ["Movies and series, without limits.", "Películas y series, sin límites.", "Filmes e séries, sem limites."],
    "Connectez-vous pour continuer.": ["Log in to continue.", "Inicia sesión para continuar.", "Entre para continuar."],
    "Choisissez votre langue": ["Choose your language", "Elige tu idioma", "Escolha seu idioma"], "Le site s’affichera dans la langue choisie.": ["The site will be shown in your language.", "El sitio se mostrará en tu idioma.", "O site será exibido no seu idioma."],
    "Qui regarde ?": ["Who’s watching?", "¿Quién mira?", "Quem está assistindo?"], "Choisissez votre profil": ["Choose your profile", "Elige tu perfil", "Escolha seu perfil"],
    "Personnages d’animé": ["Anime characters", "Personajes de anime", "Personagens de anime"], "Stars du cinéma": ["Movie stars", "Estrellas de cine", "Estrelas do cinema"],
    "Continuer": ["Continue", "Continuar", "Continuar"], "Commencer": ["Start", "Empezar", "Começar"],
    "Adresse e-mail invalide.": ["Invalid email address.", "Correo electrónico no válido.", "E-mail inválido."],
    "Mot de passe : 6 caractères minimum.": ["Password: 6 characters minimum.", "Contraseña: mínimo 6 caracteres.", "Senha: mínimo de 6 caracteres."],
    "Cet e-mail a déjà un compte.": ["This email already has an account.", "Este correo ya tiene una cuenta.", "Este e-mail já tem uma conta."],
    "E-mail ou mot de passe incorrect.": ["Wrong email or password.", "Correo o contraseña incorrectos.", "E-mail ou senha incorretos."],
    "Un lien vient d’être envoyé à cette adresse.": ["A link was just sent to this address.", "Se envió un enlace a esta dirección.", "Um link foi enviado para este endereço."],
    "Aucun compte trouvé avec cet e-mail.": ["No account found with this email.", "No hay cuenta con este correo.", "Nenhuma conta com este e-mail."],
    "Un problème est survenu. Réessayez.": ["Something went wrong. Try again.", "Algo salió mal. Inténtalo de nuevo.", "Algo deu errado. Tente novamente."],
    "Films et séries en français. Les vidéos sont diffusées par des services tiers.": ["Movies and series. Videos are streamed by third-party services.", "Películas y series. Los vídeos los emiten servicios de terceros.", "Filmes e séries. Os vídeos são transmitidos por serviços de terceiros."],
    "Sous-titres français": ["French subtitles", "Subtítulos en francés", "Legendas em francês"], "Sous-titres anglais": ["English subtitles", "Subtítulos en inglés", "Legendas em inglês"],
    "VO sans sous-titres": ["Original, no subtitles", "VO sin subtítulos", "Original sem legendas"],
    "Si la vidéo ne démarre pas, essayez une autre source. Certaines sources affichent des publicités.": ["If the video doesn’t start, try another source. Some sources show ads.", "Si el vídeo no arranca, prueba otra fuente. Algunas fuentes muestran anuncios.", "Se o vídeo não iniciar, tente outra fonte. Algumas fontes exibem anúncios."],
    "Si la vidéo ne démarre pas, essayez une autre source. Les fenêtres publicitaires des lecteurs sont bloquées.": ["If the video doesn’t start, try another source. Pop-up ads from players are blocked.", "Si el vídeo no arranca, prueba otra fuente. Las ventanas publicitarias de los reproductores están bloqueadas.", "Se o vídeo não iniciar, tente outra fonte. Os pop-ups dos players são bloqueados."]
  };

  let me = null;
  let langCode = store.get("pm:lang") || "fr";
  const LI = () => Math.max(0, LANGS.findIndex((l) => l.code === langCode));
  const tr = (s) => (langCode === "fr" || !D[s] ? s : D[s][LI() - 1] || s);
  const tmdbLang = () => LANGS[LI()].tmdb;

  function translateDom(root = document.body) {
    document.documentElement.lang = langCode;
    if (langCode === "fr" || !root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const raw = n.nodeValue.trim();
      if (raw && D[raw]) n.nodeValue = n.nodeValue.replace(raw, tr(raw));
    }
    root.querySelectorAll("[placeholder],[aria-label],[title]").forEach((el) => {
      ["placeholder", "aria-label", "title"].forEach((a) => {
        const v = el.getAttribute(a);
        if (v && D[v]) el.setAttribute(a, tr(v));
      });
    });
  }
  let obsTimer;
  new MutationObserver(() => { cancelAnimationFrame(obsTimer); obsTimer = requestAnimationFrame(() => translateDom()); })
    .observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", () => translateDom());

  // ---------- Profils ----------
  // [nom, couleur, emoji (catégories sans photo), recherche (optionnel)]
  const PROFILES = {
    anime: [
      ["Naruto Uzumaki", "#ff8a1f"], ["Sasuke Uchiha", "#3b4a8c"], ["Kakashi Hatake", "#7a8499"], ["Itachi Uchiha", "#a3243b"], ["Hinata Hyuga", "#8a7bd1"], ["Sakura Haruno", "#ff7eb6"],
      ["Monkey D. Luffy", "#e5484d"], ["Roronoa Zoro", "#2f9e6f"], ["Nami", "#ff9d2e"], ["Sanji", "#d9b800"], ["Nico Robin", "#7d5fff"], ["Portgas D. Ace", "#e0612b"],
      ["Son Goku", "#ff9d2e"], ["Vegeta", "#3a5bd9"], ["Gohan", "#b58a3c"], ["Piccolo", "#2e9e5b"],
      ["Levi Ackerman", "#6b7a90"], ["Mikasa Ackerman", "#c0392b"], ["Eren Yeager", "#2f8f83"], ["Armin Arlert", "#e0c15a"],
      ["Tanjiro Kamado", "#2f9e6f"], ["Nezuko Kamado", "#ff6fa8"], ["Zenitsu Agatsuma", "#f2c200"], ["Inosuke Hashibira", "#4a6fa5"], ["Kyojuro Rengoku", "#ff8a3d"], ["Shinobu Kocho", "#a06bff"],
      ["Satoru Gojo", "#4aa8ff"], ["Yuji Itadori", "#e5646b"], ["Megumi Fushiguro", "#3d4f7a"], ["Nobara Kugisaki", "#ff8a65"], ["Ryomen Sukuna", "#c0392b"],
      ["Izuku Midoriya", "#2ea36a"], ["Katsuki Bakugo", "#f08a24"], ["Shoto Todoroki", "#5f9bff"], ["Ochaco Uraraka", "#ff7eb6"],
      ["Light Yagami", "#8a5a2b"], ["L Lawliet", "#55607a"], ["Edward Elric", "#e0a824"], ["Alphonse Elric", "#8a8f99"], ["Gon Freecss", "#2fa35c"], ["Killua Zoldyck", "#9fb3d9"],
      ["Spike Spiegel", "#3b5bdb"], ["Saitama", "#e6b422"], ["Genos", "#d9822b"], ["Denji", "#e0452b"], ["Power", "#ff7a59"], ["Makima", "#c0392b"],
      ["Anya Forger", "#ff9fc4"], ["Loid Forger", "#3a8a6a"], ["Yor Forger", "#b02a4a"], ["Rimuru Tempest", "#4aa8ff"], ["Asta", "#6bb05a"], ["Violet Evergarden", "#c8a2ff"]
    ],
    stars: [
      ["Zendaya", "#b86bff"], ["Timothée Chalamet", "#6b8cff"], ["Margot Robbie", "#ff7eb6"], ["Ryan Gosling", "#e0a458"], ["Tom Holland", "#d64545"], ["Scarlett Johansson", "#c0392b"],
      ["Jenna Ortega", "#7d5fff"], ["Pedro Pascal", "#3aa675"], ["Leonardo DiCaprio", "#4a7bd9"], ["Brad Pitt", "#d9a23b"], ["Angelina Jolie", "#c0392b"], ["Johnny Depp", "#8a6a3b"],
      ["Will Smith", "#3b82c4"], ["Dwayne Johnson", "#d9822b"], ["Kevin Hart", "#2f9e6f"], ["Chris Hemsworth", "#e0a824"], ["Robert Downey Jr.", "#c0392b"], ["Chris Evans", "#3b5bdb"],
      ["Keanu Reeves", "#4a5568"], ["Jason Statham", "#6b7a90"], ["Vin Diesel", "#8a6a3b"], ["Gal Gadot", "#e0452b"], ["Emma Watson", "#b58a9c"], ["Anya Taylor-Joy", "#7b8cff"],
      ["Millie Bobby Brown", "#ff7eb6"], ["Florence Pugh", "#e5646b"], ["Sydney Sweeney", "#ffb347"], ["Austin Butler", "#6b7a90"], ["Cillian Murphy", "#3b82c4"], ["Henry Cavill", "#3b5bdb"],
      ["Omar Sy", "#d9a23b"], ["Marion Cotillard", "#c06b8a"], ["Jean Dujardin", "#6b7a90"], ["Léa Seydoux", "#c0392b"], ["Vincent Cassel", "#3a4a6a"], ["Eva Green", "#2f9e6f"],
      ["Denzel Washington", "#8a6a3b"], ["Morgan Freeman", "#6b7a90"], ["Samuel L. Jackson", "#7d5fff"], ["Idris Elba", "#4a7bd9"], ["Viola Davis", "#d9822b"], ["Lupita Nyong'o", "#2f9e6f"]
    ],
    fun: [
      ["Lion", "#e0a824", "🦁"], ["Loup", "#6b7a90", "🐺"], ["Renard", "#ff8a1f", "🦊"], ["Panda", "#55607a", "🐼"], ["Tigre", "#e0612b", "🐯"], ["Aigle", "#8a6a3b", "🦅"],
      ["Dragon", "#2fa35c", "🐲"], ["Licorne", "#ff7eb6", "🦄"], ["Chat", "#9b5cff", "🐱"], ["Chien", "#c08a3b", "🐶"], ["Hibou", "#7a5a3b", "🦉"], ["Requin", "#3b82c4", "🦈"],
      ["Roi", "#c79bff", "👑"], ["Ninja", "#3a3a4a", "🥷"], ["Astronaute", "#4aa8ff", "👨‍🚀"], ["Robot", "#6bb0d9", "🤖"], ["Fantôme", "#8a8fb8", "👻"], ["Alien", "#46d369", "👽"],
      ["Pirate", "#c0392b", "🏴‍☠️"], ["Magicien", "#7d5fff", "🧙"], ["Super-héros", "#e5484d", "🦸"], ["Vampire", "#a3243b", "🧛"], ["Cinéma", "#9b5cff", "🎬"], ["Pop-corn", "#f2c200", "🍿"],
      ["Manette", "#3b5bdb", "🎮"], ["Fusée", "#ff8a3d", "🚀"], ["Éclair", "#f2c200", "⚡"], ["Feu", "#e0452b", "🔥"]
    ]
  };
  const PROFILE_KINDS = [["anime", "Personnages d’animé"], ["stars", "Stars du cinéma"], ["fun", "Mascottes & icônes"]];
  const emojiOf = (kind, name) => { const e = (PROFILES[kind] || []).find((x) => x[0] === name); return e && e[2] || ""; };

  // Images : une seule file d'attente (Jikan limite le débit), AniList en secours, TMDB pour les stars.
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const FIX = { "L Lawliet": "L", "Nami": "Nami", "Power": "Power Chainsaw Man", "Asta": "Asta Black Clover", "Genos": "Genos One Punch", "Saitama": "Saitama One Punch Man" };
  async function animeFromJikan(name) {
    const r = await fetch(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(FIX[name] || name)}&limit=1&order_by=favorites&sort=desc`);
    if (!r.ok) throw new Error("jikan " + r.status);
    return (await r.json()).data?.[0]?.images?.jpg?.image_url || "";
  }
  async function animeFromAniList(name) {
    const r = await fetch("https://graphql.anilist.co", {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: "query($q:String){Character(search:$q){image{large medium}}}", variables: { q: FIX[name] || name } })
    });
    if (!r.ok) throw new Error("anilist " + r.status);
    const c = (await r.json()).data?.Character?.image;
    return c?.large || c?.medium || "";
  }
  async function fetchImage(kind, name) {
    if (kind === "anime") {
      try { const u = await animeFromAniList(name); if (u) return u; } catch { /* essai suivant */ }
      try { return await animeFromJikan(name); } catch { return null; }
    }
    if (kind === "stars" && C.TMDB_KEY) {
      try {
        const r = await fetch(`https://api.themoviedb.org/3/search/person?api_key=${C.TMDB_KEY}&query=${encodeURIComponent(name)}`);
        if (!r.ok) return null;
        const p = (await r.json()).results?.find((x) => x.profile_path);
        return p ? `https://image.tmdb.org/t/p/w185${p.profile_path}` : "";
      } catch { return null; }
    }
    return "";
  }
  let imgQueue = Promise.resolve();
  const imgPending = {};
  function profileImage(kind, name) {
    const key = `${kind}:${name}`;
    const cache = store.get("pm:img2") || {};
    if (cache[key]) return Promise.resolve(cache[key]);
    if (kind === "fun") return Promise.resolve("");
    if (imgPending[key]) return imgPending[key];
    imgPending[key] = imgQueue = imgQueue.then(async () => {
      const url = await fetchImage(kind, name);
      if (kind === "anime") await wait(220);
      if (url) { const c = store.get("pm:img2") || {}; c[key] = url; store.set("pm:img2", c); }
      delete imgPending[key];
      return url || "";
    });
    return imgPending[key];
  }
  const initials = (n) => n.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  function avatarHtml(p, extra = "") {
    if (!p) return `<span class="av ${extra}" style="--c:#8b3dff">?</span>`;
    const emoji = p.emoji || emojiOf(p.kind, p.name);
    const cached = p.img || (store.get("pm:img2") || {})[`${p.kind}:${p.name}`] || "";
    const inner = cached ? `<img src="${esc(cached)}" alt="" referrerpolicy="no-referrer">` : (emoji ? `<span class="av-emoji">${esc(emoji)}</span>` : esc(initials(p.name)));
    return `<span class="av ${extra}" style="--c:${esc(p.c)}" data-kind="${esc(p.kind || "")}" data-name="${esc(p.name)}"${cached || emoji ? "" : " data-need-img"}>${inner}</span>`;
  }
  // Complète les avatars d'animés / de stars dont l'image n'est pas encore connue.
  function hydrateAvatars(root = document) {
    root.querySelectorAll(".av[data-need-img]").forEach((el) => {
      el.removeAttribute("data-need-img");
      profileImage(el.dataset.kind, el.dataset.name).then((url) => {
        if (url && el.isConnected) el.innerHTML = `<img src="${esc(url)}" alt="" referrerpolicy="no-referrer">`;
      });
    });
  }

  // ---------- Service de comptes ----------
  const sha = async (s) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode("prince:" + s)))].map((b) => b.toString(16).padStart(2, "0")).join("");
  const users = () => store.get("pm:users") || {};
  const fb = {};
  const loadScript = (src) => new Promise((ok, ko) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = ko; document.head.append(s); });
  const fail = (m) => { const e = new Error(m); e.userMessage = m; return e; };

  async function fbUserDoc(u, name) {
    const ref = fb.db.doc(`users/${u.uid}`);
    const snap = await ref.get();
    if (snap.exists) return { ...snap.data(), uid: u.uid };
    const doc = { email: u.email, name: name || u.displayName || u.email.split("@")[0], created: Date.now() };
    await ref.set(doc);
    return { ...doc, uid: u.uid };
  }

  const ready = (async () => {
    if (!FB) { const e = store.get("pm:session"); me = e && users()[e] ? users()[e] : null; }
    else {
      const base = "https://www.gstatic.com/firebasejs/10.12.2/firebase-";
      await loadScript(base + "app-compat.js"); await loadScript(base + "auth-compat.js"); await loadScript(base + "firestore-compat.js");
      firebase.initializeApp(FB); fb.auth = firebase.auth(); fb.db = firebase.firestore();
      await new Promise((res) => { const off = fb.auth.onAuthStateChanged(async (u) => { off(); try { if (u) me = await fbUserDoc(u); } catch { /* ignoré */ } res(); }); });
    }
    if (me?.lang) { langCode = me.lang; store.set("pm:lang", langCode); }
  })();

  const checkInput = (email, pw) => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw fail("Adresse e-mail invalide.");
    if (pw !== undefined && pw.length < 6) throw fail("Mot de passe : 6 caractères minimum.");
  };
  const fbError = (e) => {
    const c = e.code || "";
    if (c.includes("email-already")) return fail("Cet e-mail a déjà un compte.");
    if (c.includes("invalid-credential") || c.includes("wrong-password") || c.includes("user-not-found")) return fail("E-mail ou mot de passe incorrect.");
    if (c.includes("weak-password")) return fail("Mot de passe : 6 caractères minimum.");
    if (c.includes("invalid-email")) return fail("Adresse e-mail invalide.");
    return e.userMessage ? e : fail("Un problème est survenu. Réessayez.");
  };

  const auth = {
    async signUp(email, pw, name) {
      email = email.trim().toLowerCase(); checkInput(email, pw);
      name = (name || "").trim() || email.split("@")[0];
      if (!FB) {
        const all = users();
        if (all[email]) throw fail("Cet e-mail a déjà un compte.");
        me = { email, name, hash: await sha(pw), created: Date.now() };
        all[email] = me; store.set("pm:users", all); store.set("pm:session", email);
      } else {
        try {
          const cred = await fb.auth.createUserWithEmailAndPassword(email, pw);
          await cred.user.updateProfile({ displayName: name });
          me = await fbUserDoc(cred.user, name);
        } catch (e) { throw fbError(e); }
      }
      return me;
    },
    async signIn(email, pw) {
      email = email.trim().toLowerCase(); checkInput(email);
      if (!FB) {
        const u = users()[email];
        if (!u || u.hash !== (await sha(pw))) throw fail("E-mail ou mot de passe incorrect.");
        me = u; store.set("pm:session", email);
      } else {
        try { const cred = await fb.auth.signInWithEmailAndPassword(email, pw); me = await fbUserDoc(cred.user); }
        catch (e) { throw fbError(e); }
      }
      if (me.lang) { langCode = me.lang; store.set("pm:lang", langCode); }
      return me;
    },
    async reset(email) {
      email = email.trim().toLowerCase(); checkInput(email);
      if (!FB) {
        if (!users()[email]) throw fail("Aucun compte trouvé avec cet e-mail.");
        return "demo";
      }
      try { await fb.auth.sendPasswordResetEmail(email); } catch (e) { throw fbError(e); }
      return "sent";
    },
    async signOut() {
      if (FB) await fb.auth.signOut(); else store.set("pm:session", null);
      me = null; location.replace("login.html");
    },
    async save(patch) {
      me = { ...me, ...patch };
      if (patch.lang) { langCode = patch.lang; store.set("pm:lang", langCode); }
      if (!FB) { const all = users(); all[me.email] = me; store.set("pm:users", all); }
      else await fb.db.doc(`users/${me.uid}`).set(patch, { merge: true });
    },
    async changePassword(oldPw, newPw) {
      if (newPw.length < 6) throw fail("Mot de passe : 6 caractères minimum.");
      if (!FB) {
        if (me.hash !== (await sha(oldPw))) throw fail("E-mail ou mot de passe incorrect.");
        await auth.save({ hash: await sha(newPw) });
      } else {
        try {
          const u = fb.auth.currentUser;
          await u.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(u.email, oldPw));
          await u.updatePassword(newPw);
        } catch (e) { throw fbError(e); }
      }
    },
    async deleteAccount() {
      if (!FB) { const all = users(); delete all[me.email]; store.set("pm:users", all); store.set("pm:session", null); }
      else { await fb.db.doc(`users/${me.uid}`).delete(); await fb.auth.currentUser.delete(); }
      me = null; location.replace("login.html");
    },
    async listUsers() {
      if (!FB) return Object.values(users()).map((u) => ({ email: u.email, name: u.name, created: u.created, profile: u.profile }));
      return (await fb.db.collection("users").get()).docs.map((d) => d.data());
    },
    async countUsers() {
      if (!FB) return Object.keys(users()).length;
      return (await fb.db.collection("users").get()).size;
    }
  };

  const isAdmin = () => Boolean(me && ADMINS.includes(String(me.email).toLowerCase()));

  async function requireLogin() {
    await ready;
    if (!me) { location.replace("login.html"); return false; }
    if (!me.lang) { location.replace("language.html"); return false; }
    if (!me.profile) { location.replace("profiles.html"); return false; }
    document.documentElement.classList.add("authed");
    return true;
  }

  // Pages d'identification : si on est déjà connecté, on file vers la bonne étape.
  async function redirectIfLoggedIn() {
    await ready;
    if (!me) return false;
    location.replace(!me.lang ? "language.html" : !me.profile ? "profiles.html" : "index.html");
    return true;
  }

  // ---------- Données du compte : favoris, historique, réglages ----------
  const DEFAULT_SETTINGS = { subLang: "", autoNext: true, source: 0, remember: true, reduceMotion: false };
  const settings = {
    get() { return { ...DEFAULT_SETTINGS, ...(me && me.settings || {}) }; },
    set(patch) { return auth.save({ settings: { ...settings.get(), ...patch } }); }
  };
  const keyOf = (m) => `${m.type}:${m.id}`;
  const favs = {
    list() { return (me && me.favs) || []; },
    has(m) { return favs.list().some((f) => keyOf(f) === keyOf(m)); },
    toggle(m) {
      const list = favs.list();
      const on = list.some((f) => keyOf(f) === keyOf(m));
      const next = on ? list.filter((f) => keyOf(f) !== keyOf(m))
        : [{ id: m.id, type: m.type, title: m.title, poster: m.poster || "", added: Date.now() }, ...list].slice(0, 300);
      auth.save({ favs: next });
      return !on;
    },
    clear() { return auth.save({ favs: [] }); }
  };
  // Historique « reprendre la lecture » : un seul enregistrement par titre, le plus récent en premier.
  const recent = {
    list() { return (me && me.recent) || []; },
    add(m) {
      if (!me || !settings.get().remember) return;
      const list = recent.list().filter((r) => keyOf(r) !== keyOf(m));
      const prev = recent.list().find((r) => keyOf(r) === keyOf(m)) || {};
      auth.save({ recent: [{ ...prev, ...m, at: Date.now() }, ...list].slice(0, 30) });
    },
    remove(m) { return auth.save({ recent: recent.list().filter((r) => keyOf(r) !== keyOf(m)) }); },
    clear() { return auth.save({ recent: [] }); }
  };

  // Menu utilisateur dans la barre du haut. L'administrateur a un badge visible en permanence.
  function mountUserMenu() {
    const bar = document.querySelector(".topbar");
    if (!bar || !me) return;
    const admin = isAdmin();
    const box = document.createElement("div");
    box.className = "user-menu";
    box.innerHTML = `${admin ? `<a class="admin-chip" href="settings.html#admin" title="Administrateur">👑 <span>Admin</span></a>` : ""}
      <button class="user-btn" type="button" aria-haspopup="true" aria-expanded="false" aria-label="${esc(me.name)}">${avatarHtml(me.profile)}</button>
      <div class="user-pop" hidden>
        <div class="user-id">${avatarHtml(me.profile, "av-lg")}<div><strong>${esc(me.name)}</strong><small>${esc(me.email)}</small></div></div>
        ${admin ? `<a class="admin-box" href="settings.html#admin"><span class="admin-tag">👑 Administrateur</span><b id="admin-count">…</b><small>Utilisateurs inscrits${FB ? "" : " (démo : cet appareil)"}</small></a>` : ""}
        <a href="index.html?view=list">Ma liste</a>
        <a href="settings.html">Paramètres</a>
        <a href="profiles.html?next=index.html">Changer de profil</a>
        <button type="button" data-out>Déconnexion</button>
      </div>`;
    bar.append(box);
    const btn = box.querySelector(".user-btn"), pop = box.querySelector(".user-pop");
    const toggle = (open) => {
      pop.hidden = !open; btn.setAttribute("aria-expanded", String(open));
      if (open && admin) auth.countUsers().then((n) => { box.querySelector("#admin-count").textContent = n; }).catch(() => { box.querySelector("#admin-count").textContent = "—"; });
    };
    btn.addEventListener("click", (e) => { e.stopPropagation(); toggle(pop.hidden); });
    document.addEventListener("click", (e) => { if (!box.contains(e.target)) toggle(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") toggle(false); });
    box.querySelector("[data-out]").addEventListener("click", () => auth.signOut());
    translateDom(box);
    hydrateAvatars(box);
  }

  window.PM = {
    LANGS, PROFILES, PROFILE_KINDS, ready, auth, tr, tmdbLang, translateDom, profileImage, avatarHtml, hydrateAvatars, esc, store, isAdmin,
    requireLogin, redirectIfLoggedIn, mountUserMenu, favs, recent, settings, DEFAULT_SETTINGS, ADMINS, get me() { return me; }, get lang() { return langCode; }, hasFirebase: Boolean(FB)
  };
})();
