// mangadex.js — PRINCE MOVIE
// Source MangaDex, utilisée uniquement par l'onglet Manga (index.html) et la page manga.html.
// Aucune clé n'est nécessaire : l'API publique https://api.mangadex.org est appelée directement.

const MD_COVERS = "https://uploads.mangadex.org/covers";
// Contenu tout public uniquement (pas d'érotique ni de pornographique), quelle que soit la config.
const MD_RATINGS = ["safe", "suggestive"];

const MD_GENRES_FR = {
  "Action": "Action", "Adventure": "Aventure", "Comedy": "Comédie", "Drama": "Drame", "Fantasy": "Fantastique",
  "Horror": "Horreur", "Mystery": "Mystère", "Romance": "Romance", "Sci-Fi": "Science-fiction",
  "Slice of Life": "Tranche de vie", "Sports": "Sport", "Supernatural": "Surnaturel", "Psychological": "Psychologique",
  "Thriller": "Thriller", "Historical": "Historique", "Music": "Musique", "Tragedy": "Tragédie", "Crime": "Crime",
  "Superhero": "Super-héros", "Medical": "Médical", "Philosophical": "Philosophique", "Isekai": "Isekai",
  "Mecha": "Mecha", "Magical Girls": "Magical Girls", "Martial Arts": "Arts martiaux", "School Life": "Vie scolaire",
  "Military": "Militaire", "Survival": "Survie", "Reincarnation": "Réincarnation", "Monsters": "Monstres"
};
const MD_STATUS_FR = { ongoing: "En cours", completed: "Terminé", hiatus: "En pause", cancelled: "Annulé" };
const MD_LANG_NAMES = {
  "fr": "Français", "en": "Anglais", "es": "Espagnol", "es-la": "Espagnol (Amérique latine)", "pt": "Portugais",
  "pt-br": "Portugais (Brésil)", "it": "Italien", "de": "Allemand", "ru": "Russe", "ar": "Arabe", "id": "Indonésien",
  "tr": "Turc", "vi": "Vietnamien", "pl": "Polonais", "ja": "Japonais", "ko": "Coréen", "zh": "Chinois (simplifié)",
  "zh-hk": "Chinois (traditionnel)"
};

// Les appels passent par le relais /api/mangadex (api/mangadex.mjs) : MangaDex refuse les appels
// directs depuis un autre site.
function mdProxyBase() {
  const manga = typeof CONFIG !== "undefined" && CONFIG && typeof CONFIG.MANGA === "object" && CONFIG.MANGA ? CONFIG.MANGA : {};
  return typeof manga.PROXY === "string" && manga.PROXY ? manga.PROXY : "/api/mangadex";
}

function mdProxyImage(url) {
  return `${mdProxyBase()}?img=${encodeURIComponent(url)}`;
}

// Les images sont d'abord chargées directement ; si MangaDex les refuse, on passe par le relais
// et on s'en souvient pour la suite.
function mdUseProxyImages() {
  try { return localStorage.getItem("prince:md-proxy") === "1"; } catch { return false; }
}

function mdImage(url) {
  return url && mdUseProxyImages() ? mdProxyImage(url) : url;
}

function mdConfig() {
  const manga = typeof CONFIG !== "undefined" && CONFIG && typeof CONFIG.MANGA === "object" && CONFIG.MANGA ? CONFIG.MANGA : {};
  const langs = Array.isArray(manga.CATALOGUE_LANGS) ? manga.CATALOGUE_LANGS.filter((lang) => typeof lang === "string" && lang) : [];
  return {
    defaultLang: typeof manga.DEFAULT_LANG === "string" && manga.DEFAULT_LANG ? manga.DEFAULT_LANG : "fr",
    catalogueLangs: langs.length ? langs : ["fr"]
  };
}

async function mdFetch(path, params = {}, attempt = 0) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) value.forEach((item) => query.append(`${key}[]`, item));
    else query.append(key, value);
  });
  const text = query.toString();
  const response = await fetch(`${mdProxyBase()}?path=${encodeURIComponent(path)}${text ? `&${text}` : ""}`, { headers: { Accept: "application/json" } });
  // Limite de requêtes atteinte : on patiente un instant puis on réessaie (deux fois au maximum).
  if (response.status === 429 && attempt < 2) {
    const wait = Math.min(Math.max(Number(response.headers.get("Retry-After")) || 1, 1), 4);
    await new Promise((resolve) => window.setTimeout(resolve, wait * 1000));
    return mdFetch(path, params, attempt + 1);
  }
  let data = null;
  try { data = await response.json(); } catch { /* réponse non JSON */ }
  if (response.status === 404 && !data) {
    throw new Error("Le relais MangaDex est introuvable : ajoutez le fichier api/mangadex.mjs à votre site.");
  }
  if (!response.ok || (data && data.result === "error")) {
    const detail = data && data.errors && data.errors[0] && data.errors[0].detail;
    throw new Error(detail || `MangaDex a répondu avec le statut ${response.status}.`);
  }
  return data;
}

function mdPick(map, langs) {
  if (!map || typeof map !== "object") return "";
  for (const lang of langs) if (map[lang]) return map[lang];
  return Object.values(map).find(Boolean) || "";
}

function mdLangName(code) {
  const key = String(code || "").toLowerCase();
  if (MD_LANG_NAMES[key]) return MD_LANG_NAMES[key];
  try {
    const name = new Intl.DisplayNames(["fr"], { type: "language" }).of(key);
    if (name && name.toLowerCase() !== key) return name.charAt(0).toUpperCase() + name.slice(1);
  } catch { /* nom indisponible */ }
  return key.toUpperCase();
}

// Transforme une fiche MangaDex en élément compatible avec les cartes du site.
function mdNormalize(entry) {
  const attributes = entry.attributes || {};
  const relations = entry.relationships || [];
  const coverRelation = relations.find((relation) => relation.type === "cover_art");
  const fileName = coverRelation && coverRelation.attributes && coverRelation.attributes.fileName;
  const coverBase = fileName ? `${MD_COVERS}/${entry.id}/${fileName}` : "";
  const genres = (attributes.tags || [])
    .filter((tag) => tag.attributes && tag.attributes.group === "genre")
    .map((tag) => mdPick(tag.attributes.name, ["en"]))
    .filter(Boolean)
    .map((name) => MD_GENRES_FR[name] || name);
  const authors = [...new Set(relations
    .filter((relation) => (relation.type === "author" || relation.type === "artist") && relation.attributes && relation.attributes.name)
    .map((relation) => relation.attributes.name))];
  return {
    id: entry.id,
    media_type: "manga",
    badge: "Manga",
    title: mdPick(attributes.title, ["fr", "en"]) || "Titre sans nom",
    overview: mdPick(attributes.description, ["fr", "en"]).replace(/\r/g, "").split(/\n\s*---/)[0].trim(),
    release_date: attributes.year ? `${attributes.year}-01-01` : "",
    genre: genres.slice(0, 3).join(" · "),
    genres_all: genres,
    status: MD_STATUS_FR[attributes.status] || "",
    authors,
    languages: Array.isArray(attributes.availableTranslatedLanguage) ? attributes.availableTranslatedLanguage : [],
    poster_url: coverBase ? mdImage(`${coverBase}.256.jpg`) : "",
    poster_url_large: coverBase ? mdImage(`${coverBase}.512.jpg`) : ""
  };
}

// Liste de mangas japonais ayant au moins un chapitre lisible dans les langues demandées.
async function mdList(extra = {}, langs = null) {
  const data = await mdFetch("/manga", {
    limit: 24,
    includes: ["cover_art"],
    contentRating: MD_RATINGS,
    originalLanguage: ["ja"],
    hasAvailableChapters: "true",
    availableTranslatedLanguage: langs || mdConfig().catalogueLangs,
    ...extra
  });
  return { results: (data.data || []).map(mdNormalize) };
}

function mdSearch(query) {
  return mdList({ title: query, limit: 40, "order[relevance]": "desc" }, ["fr", "en"]);
}

async function mdGetManga(id) {
  const data = await mdFetch(`/manga/${encodeURIComponent(id)}`, { includes: ["cover_art", "author", "artist"] });
  return mdNormalize(data.data);
}

// Chapitres lisibles dans une langue : triés, sans doublons, sans liens externes.
async function mdGetChapters(mangaId, lang) {
  const raw = [];
  let offset = 0;
  let total = 0;
  do {
    const page = await mdFetch(`/manga/${encodeURIComponent(mangaId)}/feed`, {
      limit: 500,
      offset,
      translatedLanguage: [lang],
      contentRating: MD_RATINGS,
      includeExternalUrl: "0",
      includeEmptyPages: "0",
      "order[chapter]": "asc"
    });
    raw.push(...(page.data || []));
    total = page.total || 0;
    offset += 500;
  } while (offset < total && offset < 5000);

  const unique = new Map();
  raw.forEach((chapter) => {
    const a = chapter.attributes || {};
    if (!a.pages || a.externalUrl) return;
    const hasNumber = a.chapter !== null && a.chapter !== undefined && a.chapter !== "";
    const key = hasNumber ? `n:${a.chapter}` : `id:${chapter.id}`;
    const item = { id: chapter.id, chapter: hasNumber ? String(a.chapter) : "", volume: a.volume || "", title: a.title || "", pages: a.pages, publishAt: a.publishAt || "" };
    const previous = unique.get(key);
    if (!previous || item.pages > previous.pages) unique.set(key, item);
  });
  const number = (chapter) => (chapter.chapter === "" ? -1 : parseFloat(chapter.chapter));
  return [...unique.values()].sort((a, b) => {
    const diff = (Number.isNaN(number(a)) ? 0 : number(a)) - (Number.isNaN(number(b)) ? 0 : number(b));
    return diff || a.publishAt.localeCompare(b.publishAt);
  });
}

function mdChapterLabel(chapter, withTitle = true) {
  const parts = [];
  if (chapter.volume) parts.push(`Vol. ${chapter.volume}`);
  parts.push(chapter.chapter ? `Chap. ${chapter.chapter}` : "One-shot");
  const label = parts.join(" · ");
  return withTitle && chapter.title ? `${label} — ${chapter.title}` : label;
}

// Adresse des pages d'un chapitre. Le serveur renvoyé est temporaire : on le redemande en cas d'échec.
async function mdGetPages(chapterId) {
  const data = await mdFetch(`/at-home/server/${encodeURIComponent(chapterId)}`);
  const chapter = data.chapter;
  if (!data.baseUrl || !chapter || !chapter.hash) throw new Error("Ce chapitre n’est pas disponible pour le moment.");
  return { baseUrl: data.baseUrl, hash: chapter.hash, data: chapter.data || [], dataSaver: chapter.dataSaver || [] };
}

function mdPageUrls(pages, quality) {
  const mode = quality === "data-saver" ? "data-saver" : "data";
  const files = mode === "data" ? pages.data : pages.dataSaver;
  return files.map((file) => `${pages.baseUrl}/${mode}/${pages.hash}/${file}`);
}

// Image MangaDex qui ne se charge pas : on réessaie via le relais, puis on prévient le lecteur.
document.addEventListener("error", (event) => {
  const image = event.target;
  if (!image || image.tagName !== "IMG") return;
  const source = image.currentSrc || image.src || "";
  const direct = /^https:\/\/([a-z0-9-]+\.)*mangadex\.(org|network)(:\d+)?\//i.test(source);
  if (direct && !image.dataset.mdProxied) {
    image.dataset.mdProxied = "1";
    image.removeAttribute("srcset");
    image.addEventListener("load", () => {
      try { localStorage.setItem("prince:md-proxy", "1"); } catch { /* ignoré */ }
    }, { once: true });
    image.src = mdProxyImage(source);
    return;
  }
  if (direct || image.dataset.mdProxied || source.includes(`${mdProxyBase()}?img=`)) {
    if (typeof window.mdOnImageFailed === "function") window.mdOnImageFailed(image);
  }
}, true);

const MangaDex = {
  list: mdList,
  search: mdSearch,
  get: mdGetManga,
  chapters: mdGetChapters,
  pages: mdGetPages
};

/* ==========================================================================
   Page de lecture (manga.html)
   ========================================================================== */

function mdEscape(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function mdReadStore(key) {
  try { return JSON.parse(localStorage.getItem(key) || "null") || {}; } catch { return {}; }
}

function mdWriteStore(key, patch) {
  try { localStorage.setItem(key, JSON.stringify({ ...mdReadStore(key), ...patch })); } catch { /* stockage indisponible */ }
}

function initMangaPage() {
  const $ = (id) => document.getElementById(id);
  const els = {
    cover: $("manga-cover"), title: $("manga-title"), meta: $("manga-meta"), genres: $("manga-genres"),
    synopsis: $("manga-synopsis"), more: $("manga-more"), lang: $("manga-lang"), chapter: $("manga-chapter"),
    quality: $("manga-quality"), prev: $("manga-prev"), next: $("manga-next"), start: $("manga-start"),
    status: $("manga-status"), message: $("reader-message"), messageTitle: $("reader-message-title"),
    messageText: $("reader-message-text"), pages: $("reader-pages"), footer: $("reader-footer"),
    footerNext: $("reader-next"), footerInfo: $("reader-footer-info"), stage: $("reader")
  };

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id") || "";
  const fallbackTitle = params.get("title") || "Manga";
  const storeKey = `prince:manga:${id}`;
  const state = { manga: null, lang: "fr", chapters: [], index: -1, pages: null, quality: "data", token: 0, retried: false };

  document.title = `${fallbackTitle} — PRINCE MOVIE`;
  els.title.textContent = fallbackTitle;

  // Bouton retour : revient au catalogue sans le recharger à zéro.
  const backButton = document.querySelector(".back-button");
  if (backButton) {
    backButton.addEventListener("click", (event) => {
      try {
        const referrer = document.referrer ? new URL(document.referrer) : null;
        if (referrer && referrer.origin === window.location.origin && /(\/|index\.html)$/.test(referrer.pathname) && window.history.length > 1) {
          event.preventDefault();
          window.history.back();
        }
      } catch { /* on laisse le lien normal */ }
    });
  }

  function showMessage(title, text, failed = false, showLoader = false) {
    els.message.hidden = false;
    els.pages.hidden = true;
    els.footer.hidden = true;
    els.message.classList.toggle("is-error", failed);
    els.messageTitle.textContent = title;
    els.messageText.textContent = text;
    els.message.querySelector(".loader-bars").hidden = !showLoader;
    els.start.hidden = true;
  }

  function setStatus(text, failed = false) {
    els.status.textContent = text;
    els.status.classList.toggle("is-error", failed);
  }

  function setOptions(select, options, placeholder) {
    select.replaceChildren();
    if (!options.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = placeholder;
      select.append(option);
      select.disabled = true;
      return;
    }
    options.forEach(({ value, label }) => {
      const option = document.createElement("option");
      option.value = String(value);
      option.textContent = label;
      select.append(option);
    });
    select.disabled = false;
  }

  function renderHeader(manga) {
    document.title = `${manga.title} — PRINCE MOVIE`;
    els.title.textContent = manga.title;
    if (manga.poster_url_large) {
      els.cover.src = manga.poster_url_large;
      els.cover.alt = `Couverture de ${manga.title}`;
      els.cover.hidden = false;
      document.getElementById("manga-backdrop").style.backgroundImage = `url("${manga.poster_url_large}")`;
    }
    const year = manga.release_date ? manga.release_date.slice(0, 4) : "";
    els.meta.innerHTML = [
      year ? `<span>${mdEscape(year)}</span>` : "",
      manga.status ? `<span>${mdEscape(manga.status)}</span>` : "",
      manga.authors.length ? `<span>${mdEscape(manga.authors.slice(0, 2).join(", "))}</span>` : ""
    ].join("");
    els.genres.textContent = manga.genres_all.slice(0, 5).join(" • ");
    els.genres.hidden = !manga.genres_all.length;
    els.synopsis.textContent = manga.overview || "Pas de résumé disponible pour ce manga.";
    els.more.hidden = els.synopsis.textContent.length < 260;
  }

  els.more.addEventListener("click", () => {
    const open = els.synopsis.classList.toggle("is-open");
    els.more.textContent = open ? "Réduire" : "Lire la suite";
    els.more.setAttribute("aria-expanded", String(open));
  });

  function languageOptions(languages) {
    const rank = (code) => (code === "fr" ? 0 : code === "en" ? 1 : 2);
    return [...languages]
      .sort((a, b) => rank(a) - rank(b) || mdLangName(a).localeCompare(mdLangName(b), "fr"))
      .map((code) => ({ value: code, label: mdLangName(code) }));
  }

  function updateNav() {
    els.prev.disabled = state.index <= 0;
    els.next.disabled = state.index < 0 || state.index >= state.chapters.length - 1;
  }

  function updateStartButton() {
    const saved = mdReadStore(storeKey);
    const savedIndex = saved.lang === state.lang ? state.chapters.findIndex((chapter) => chapter.id === saved.chapter) : -1;
    const index = savedIndex >= 0 ? savedIndex : 0;
    const chapter = state.chapters[index];
    els.start.textContent = `${savedIndex >= 0 ? "Reprendre" : "Commencer"} · ${mdChapterLabel(chapter, false).toLowerCase().replace(/^./, (c) => c.toUpperCase())}`;
    els.start.dataset.index = String(index);
    els.start.hidden = false;
  }

  function showIdle() {
    state.index = -1;
    state.token += 1;
    els.chapter.value = "";
    updateNav();
    els.message.hidden = false;
    els.pages.hidden = true;
    els.pages.replaceChildren();
    els.footer.hidden = true;
    els.message.classList.remove("is-error");
    els.message.querySelector(".loader-bars").hidden = true;
    els.messageTitle.textContent = `${state.chapters.length} chapitre${state.chapters.length > 1 ? "s" : ""} en ${mdLangName(state.lang).toLowerCase()}`;
    els.messageText.textContent = "Choisissez un chapitre dans la liste ou lancez la lecture.";
    updateStartButton();
    setStatus(`${state.chapters.length} chapitre${state.chapters.length > 1 ? "s" : ""} disponible${state.chapters.length > 1 ? "s" : ""}`);
  }

  async function loadChapters(lang) {
    state.lang = lang;
    state.chapters = [];
    state.index = -1;
    state.token += 1;
    setOptions(els.chapter, [], "Chargement…");
    els.prev.disabled = true;
    els.next.disabled = true;
    setStatus("Chargement des chapitres…");
    showMessage("Chargement des chapitres", "Récupération de la liste depuis MangaDex…", false, true);
    const token = state.token;
    try {
      const chapters = await MangaDex.chapters(id, lang);
      if (token !== state.token) return;
      state.chapters = chapters;
      if (!chapters.length) {
        setOptions(els.chapter, [], "Aucun chapitre");
        const others = (state.manga ? state.manga.languages : []).filter((code) => code !== lang);
        showMessage(
          `Aucun chapitre en ${mdLangName(lang).toLowerCase()}`,
          others.length ? "Essayez une autre langue dans le menu « Langue »." : "Ce manga n’a pas encore de chapitre lisible ici.",
          true
        );
        setStatus("Aucun chapitre dans cette langue", true);
        return;
      }
      setOptions(els.chapter, chapters.map((chapter, index) => ({ value: index, label: mdChapterLabel(chapter) })), "Aucun chapitre");
      els.chapter.selectedIndex = -1;
      showIdle();
    } catch (error) {
      if (token !== state.token) return;
      setOptions(els.chapter, [], "Indisponible");
      showMessage("Chapitres indisponibles", `${error.message} Vérifiez votre connexion puis rechargez la page.`, true);
      setStatus("Impossible de charger les chapitres", true);
    }
  }

  function renderPages() {
    const urls = mdPageUrls(state.pages, state.quality);
    els.pages.replaceChildren();
    if (!urls.length) {
      showMessage("Chapitre vide", "Aucune page n’est disponible pour ce chapitre.", true);
      return;
    }
    urls.forEach((url, index) => {
      const image = document.createElement("img");
      image.className = "reader-page";
      image.alt = `Page ${index + 1} sur ${urls.length}`;
      image.decoding = "async";
      image.loading = index < 2 ? "eager" : "lazy";
      image.referrerPolicy = "no-referrer";
      image.addEventListener("load", () => {
        image.classList.add("is-loaded");
        image.classList.remove("is-broken");
      });
      image.src = mdImage(url);
      els.pages.append(image);
    });
    els.message.hidden = true;
    els.pages.hidden = false;
    els.footer.hidden = false;
  }

  // Une page ne se charge pas : on redemande un serveur d'images, une seule fois par chapitre.
  async function retryPages(force) {
    if (state.retried && !force) return;
    state.retried = true;
    const token = state.token;
    const chapter = state.chapters[state.index];
    if (!chapter) return;
    try {
      const fresh = await MangaDex.pages(chapter.id);
      if (token !== state.token) return;
      state.pages = fresh;
      const urls = mdPageUrls(fresh, state.quality);
      [...els.pages.querySelectorAll("img")].forEach((image, index) => {
        if (!image.classList.contains("is-loaded") && urls[index]) {
          image.src = image.dataset.mdProxied || mdUseProxyImages() ? mdProxyImage(urls[index]) : urls[index];
        }
      });
    } catch { /* la page reste signalée comme indisponible */ }
  }

  window.mdOnImageFailed = (image) => {
    if (!els.pages.contains(image)) return;
    image.classList.add("is-broken");
    retryPages(false);
  };

  els.pages.addEventListener("click", (event) => {
    if (event.target.classList && event.target.classList.contains("is-broken")) retryPages(true);
  });

  async function openChapter(index, scrollToTop = true) {
    const chapter = state.chapters[index];
    if (!chapter) return;
    const token = ++state.token;
    state.index = index;
    state.retried = false;
    els.chapter.value = String(index);
    updateNav();
    setStatus(`Chargement de ${mdChapterLabel(chapter, false).toLowerCase()}…`);
    showMessage(mdChapterLabel(chapter, false), "Chargement des pages…", false, true);
    if (scrollToTop) els.stage.scrollIntoView({ block: "start" });
    try {
      const pages = await MangaDex.pages(chapter.id);
      if (token !== state.token) return;
      state.pages = pages;
      renderPages();
      mdWriteStore(storeKey, { lang: state.lang, chapter: chapter.id });
      const last = index >= state.chapters.length - 1;
      els.footerNext.disabled = last;
      els.footerNext.textContent = last ? "Dernier chapitre disponible" : "Chapitre suivant";
      els.footerInfo.textContent = `${mdChapterLabel(chapter, false)} · ${pages.data.length} page${pages.data.length > 1 ? "s" : ""}`;
      setStatus(`${mdChapterLabel(chapter, false)} · ${pages.data.length} pages`);
    } catch (error) {
      if (token !== state.token) return;
      showMessage("Chapitre indisponible", error.message, true);
      setStatus("Impossible de charger ce chapitre", true);
    }
  }

  els.start.addEventListener("click", () => openChapter(Number(els.start.dataset.index) || 0));
  els.chapter.addEventListener("change", () => openChapter(Number(els.chapter.value)));
  els.prev.addEventListener("click", () => openChapter(state.index - 1));
  els.next.addEventListener("click", () => openChapter(state.index + 1));
  els.footerNext.addEventListener("click", () => openChapter(state.index + 1));
  els.lang.addEventListener("change", () => {
    mdWriteStore(storeKey, { lang: els.lang.value });
    els.pages.replaceChildren();
    loadChapters(els.lang.value);
  });
  els.quality.addEventListener("change", () => {
    state.quality = els.quality.value === "data-saver" ? "data-saver" : "data";
    try { localStorage.setItem("prince:manga-quality", state.quality); } catch { /* ignoré */ }
    if (state.index >= 0 && state.pages) {
      renderPages();
    }
  });

  try { state.quality = localStorage.getItem("prince:manga-quality") === "data-saver" ? "data-saver" : "data"; } catch { /* ignoré */ }
  els.quality.value = state.quality;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    showMessage("Manga introuvable", "Revenez à l’accueil et choisissez un manga dans le catalogue.", true);
    setStatus("Manga introuvable", true);
    return;
  }

  showMessage("Chargement du manga", "Récupération de la fiche depuis MangaDex…", false, true);
  MangaDex.get(id).then((manga) => {
    state.manga = manga;
    renderHeader(manga);
    if (!manga.languages.length) {
      setOptions(els.lang, [], "Aucune langue");
      showMessage("Aucun chapitre disponible", "Ce manga n’a pas encore de chapitre lisible ici.", true);
      setStatus("Aucun chapitre disponible", true);
      return;
    }
    const options = languageOptions(manga.languages);
    setOptions(els.lang, options, "Aucune langue");
    const saved = mdReadStore(storeKey).lang;
    const wanted = [saved, mdConfig().defaultLang, "fr", "en"].find((code) => code && manga.languages.includes(code)) || options[0].value;
    els.lang.value = wanted;
    return loadChapters(wanted);
  }).catch((error) => {
    showMessage("Impossible d’ouvrir ce manga", `${error.message} Revenez au catalogue puis réessayez.`, true);
    setStatus("Impossible de charger la fiche", true);
  });
}

if (document.body && document.body.dataset.page === "manga") {
  initMangaPage();
}
