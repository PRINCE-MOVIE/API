const DEMO_CATALOGUE = {
  movie: [
    { id: 693134, media_type: "movie", title: "Dune : Deuxième partie", release_date: "2024-02-27", overview: "Au cœur du désert, une légende prend forme.", genre: "Épopée · Science-fiction", colors: ["#30213b", "#a34f58"] },
    { id: 872585, media_type: "movie", title: "Oppenheimer", release_date: "2023-07-19", overview: "L’histoire d’un esprit qui a changé le monde.", genre: "Drame · Histoire", colors: ["#403025", "#d27a3c"] },
    { id: 787699, media_type: "movie", title: "Wonka", release_date: "2023-12-06", overview: "Un peu de magie suffit à tout changer.", genre: "Fantastique · Aventure", colors: ["#253448", "#8d4772"] },
    { id: 346698, media_type: "movie", title: "Barbie", release_date: "2023-07-19", overview: "La vie en rose n’a jamais été aussi inattendue.", genre: "Comédie · Aventure", colors: ["#512a4b", "#f57791"] },
    { id: 569094, media_type: "movie", title: "Spider-Man : Across the Spider-Verse", release_date: "2023-05-31", overview: "Un saut de plus dans le multivers.", genre: "Animation · Action", colors: ["#182851", "#b43162"] },
    { id: 438631, media_type: "movie", title: "Dune", release_date: "2021-09-15", overview: "Une aventure au-delà des étoiles.", genre: "Science-fiction · Aventure", colors: ["#3b3028", "#b47a3e"] },
    { id: 980489, media_type: "movie", title: "Gran Turismo", release_date: "2023-08-09", overview: "Du jeu vidéo à la ligne de départ.", genre: "Action · Drame", colors: ["#222d38", "#be4544"] },
    { id: 550, media_type: "movie", title: "Fight Club", release_date: "1999-10-15", overview: "La première règle ? Il y en a toujours une.", genre: "Drame · Thriller", colors: ["#342523", "#805944"] }
  ],
  tv: [
    { id: 94997, media_type: "tv", name: "House of the Dragon", first_air_date: "2022-08-21", overview: "Le feu et le sang façonnent une dynastie.", genre: "Fantastique · Drame", colors: ["#432327", "#ae5845"] },
    { id: 1396, media_type: "tv", name: "Breaking Bad", first_air_date: "2008-01-20", overview: "Un professeur de chimie bascule dans l’inconnu.", genre: "Drame · Crime", colors: ["#263532", "#8d9f63"] },
    { id: 66732, media_type: "tv", name: "Stranger Things", first_air_date: "2016-07-15", overview: "Une petite ville, de grands mystères.", genre: "Mystère · Fantastique", colors: ["#25243f", "#9d344e"] },
    { id: 94605, media_type: "tv", name: "Arcane", first_air_date: "2021-11-06", overview: "Deux sœurs. Deux mondes. Une seule histoire.", genre: "Animation · Aventure", colors: ["#213642", "#9c6a9d"] },
    { id: 1399, media_type: "tv", name: "Game of Thrones", first_air_date: "2011-04-17", overview: "Le pouvoir se joue sur un échiquier de glace.", genre: "Drame · Fantastique", colors: ["#30343b", "#a27c49"] },
    { id: 66788, media_type: "tv", name: "The queen's gambit", first_air_date: "2020-10-23", overview: "Le génie avance toujours d’un coup.", genre: "Drame", colors: ["#393027", "#ae7645"] },
    { id: 82856, media_type: "tv", name: "The Mandalorian", first_air_date: "2019-11-12", overview: "Au-delà des étoiles, un nouveau récit.", genre: "Science-fiction · Action", colors: ["#2e302a", "#9c7345"] },
    { id: 71912, media_type: "tv", name: "The Witcher", first_air_date: "2019-12-20", overview: "Destin, magie et monstres à l’horizon.", genre: "Fantastique · Aventure", colors: ["#29302e", "#8c754b"] }
  ]
};

const state = {
  view: "home",
  query: "",
  requestId: 0,
  activeMedia: null,
  featured: null,
  featuredItem: null,
  heroList: [],
  heroIndex: 0
};

const HERO_DELAY = 7000;
let heroTimer = null;

// Genres TMDB en français (films et séries) pour la ligne « Action • Aventure ».
const GENRES = {
  28: "Action", 12: "Aventure", 16: "Animation", 35: "Comédie", 80: "Crime", 99: "Documentaire",
  18: "Drame", 10751: "Famille", 14: "Fantastique", 36: "Histoire", 27: "Horreur", 10402: "Musique",
  9648: "Mystère", 10749: "Romance", 878: "Science-fiction", 10770: "Téléfilm", 53: "Thriller",
  10752: "Guerre", 37: "Western", 10759: "Action & Aventure", 10762: "Enfants", 10763: "Actualités",
  10764: "Télé-réalité", 10765: "Science-fiction", 10766: "Feuilleton", 10767: "Talk-show", 10768: "Guerre & Politique"
};

function getGenres(item) {
  if (PM.lang !== "fr") return [];
  if (item.genre) return item.genre.split("·").map((part) => part.trim()).filter(Boolean).slice(0, 3);
  return [...new Set((item.genre_ids || []).map((id) => GENRES[id]).filter(Boolean))].slice(0, 3);
}

const HOME_STATE_KEY = "prince:home";
const SPLASH_SEEN_KEY = "prince:splash-seen";
let homeStateReady = false;

function readSession(key) {
  try { return JSON.parse(sessionStorage.getItem(key) || "null"); } catch { return null; }
}

function writeSession(key, value) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* stockage indisponible */ }
}

// Mémorise l'onglet, la recherche et la position de défilement de l'accueil.
function saveHomeState() {
  if (!homeStateReady) return;
  writeSession(HOME_STATE_KEY, { view: state.view, query: state.query, scroll: Math.round(window.scrollY) });
}

// État du lecteur (source, saison, épisode) mémorisé par titre.
function getPlayerStateKey() {
  const params = new URLSearchParams(window.location.search);
  return `prince:player:${params.get("type")}:${params.get("id")}`;
}

function readPlayerState() {
  return readSession(getPlayerStateKey()) || {};
}

function savePlayerState(patch) {
  writeSession(getPlayerStateKey(), { ...readPlayerState(), ...patch });
}

const catalogue = document.getElementById("catalogue");
const statusMessage = document.getElementById("status-message");
const billboard = document.getElementById("billboard");
const topbar = document.querySelector(".topbar");
const searchInput = document.getElementById("search-input");
const clearSearchButton = document.querySelector(".clear-search");
const playerFrame = document.getElementById("content-frame");
const playerMessage = document.getElementById("player-message");
const nodeSelector = document.getElementById("node-selector");
const episodeControls = document.getElementById("episode-controls");
const seasonSelect = document.getElementById("season-select");
const episodeSelect = document.getElementById("episode-select");
const loadEpisodeButton = document.getElementById("load-episode");
const langSelector = document.getElementById("lang-selector");

// Bloque pop-ups, redirections et nouvelles fenêtres publicitaires venant des lecteurs.
// (pas de allow-popups ni allow-top-navigation)
const PLAYER_SANDBOX = "allow-scripts allow-same-origin allow-forms allow-presentation";
const PLAYER_ALLOW = "autoplay; fullscreen; picture-in-picture; encrypted-media";
const playerMeta = { id: "", type: "", title: "", poster: "" };
const playerRuntime = {
  servers: [],
  currentIndex: 0,
  invalidServerCount: 0,
  selectionRequestId: 0,
  availableSeasons: [],
  availableEpisodes: [],
  currentResource: null,
  runtimes: {},
  movieRuntime: 0,
  startedAt: 0
};

function getConfig() {
  return typeof CONFIG !== "undefined" && CONFIG && typeof CONFIG === "object" ? CONFIG : {};
}

function hasApiKey() {
  const apiKey = getConfig().TMDB_KEY;
  return typeof apiKey === "string" && Boolean(apiKey && apiKey !== "METS_TA_CLE_API_ICI");
}

function getMediaTitle(media) {
  return media.title || media.name || "Titre sans nom";
}

function getMediaType(media) {
  return media.media_type || (media.first_air_date || media.name ? "tv" : "movie");
}

function getYear(media) {
  const date = media.release_date || media.first_air_date;
  return date ? date.slice(0, 4) : "—";
}

function setLoading() {
  const cards = Array.from({ length: 10 }, () => '<div class="skeleton" aria-hidden="true"></div>').join("");
  catalogue.innerHTML = state.query
    ? `<div class="poster-grid">${cards}</div>`
    : `<section class="row" aria-hidden="true"><div class="row-title-skeleton"></div><div class="row-track">${cards}</div></section>`;
}

function setStatus(message) {
  statusMessage.textContent = message;
  statusMessage.hidden = !message;
}

function getDemoItems(view, query) {
  const items = view === "home"
    ? [...DEMO_CATALOGUE.movie.slice(0, 4), ...DEMO_CATALOGUE.tv.slice(0, 4)]
    : DEMO_CATALOGUE[view];
  if (!query) return items;
  const normalizedQuery = query.toLocaleLowerCase("fr");
  return items.filter((item) => `${getMediaTitle(item)} ${item.overview} ${item.genre}`.toLocaleLowerCase("fr").includes(normalizedQuery));
}

function getDemoRows(view, query) {
  if (query) return [{ title: "", items: getDemoItems(view, query) }];
  if (view === "movie") return [{ title: "Films de démonstration", items: DEMO_CATALOGUE.movie }];
  if (view === "tv") return [{ title: "Séries de démonstration", items: DEMO_CATALOGUE.tv }];
  return [
    { title: "Top 10 du moment", items: getDemoItems("home", ""), ranked: true },
    { title: "Films", items: DEMO_CATALOGUE.movie },
    { title: "Séries", items: DEMO_CATALOGUE.tv }
  ];
}

// Les rangées affichées pour chaque onglet. La recherche reste une simple grille.
function getRowPlan(view, query) {
  const lang = PM.tmdbLang();
  const common = `include_adult=false&language=${lang}`;
  if (query) return [{ title: "", path: `/search/multi?query=${encodeURIComponent(query)}&${common}` }];
  const popularMovies = { title: "Films populaires", path: `/discover/movie?sort_by=popularity.desc&${common}` };
  const popularShows = { title: "Séries populaires", path: `/discover/tv?sort_by=popularity.desc&${common}` };
  const topMovies = { title: "Films les mieux notés", path: `/movie/top_rated?language=${lang}` };
  const topShows = { title: "Séries les mieux notées", path: `/tv/top_rated?language=${lang}` };
  if (view === "movie") {
    return [popularMovies, topMovies, { title: "Actuellement au cinéma", path: `/movie/now_playing?language=${lang}&region=FR` }];
  }
  if (view === "tv") {
    return [popularShows, topShows, { title: "Diffusées en ce moment", path: `/tv/on_the_air?language=${lang}` }];
  }
  return [{ title: "Top 10 du moment", path: `/trending/all/week?language=${lang}`, ranked: true }, popularMovies, popularShows, topMovies, topShows];
}

async function fetchCatalogue(view, query, requestId) {
  const plan = getRowPlan(view, query);
  const results = await Promise.allSettled(plan.map((row) => fetchTmdb(row.path)));
  if (requestId !== state.requestId) return null;
  const rows = [];
  let firstError = null;
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      firstError = firstError || result.reason;
      return;
    }
    let items = (result.value.results || []).filter((item) => item.media_type !== "person");
    if (!query) items = items.filter((item) => item.poster_path);
    if (items.length || query) rows.push({ title: plan[index].title, items, ranked: Boolean(plan[index].ranked) });
  });
  if (!rows.length && firstError) throw firstError;
  return rows.length ? rows : [{ title: "", items: [] }];
}

async function fetchTmdb(endpoint) {
  if (!hasApiKey()) {
    throw new Error("Ajoutez votre clé TMDB dans config.js pour charger les saisons et épisodes disponibles.");
  }
  const separator = endpoint.includes("?") ? "&" : "?";
  const response = await fetch(`https://api.themoviedb.org/3${endpoint}${separator}api_key=${encodeURIComponent(getConfig().TMDB_KEY)}`, {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) throw new Error(`TMDB a répondu avec le statut ${response.status}.`);
  return response.json();
}

function formatRating(item) {
  const rating = Number(item.vote_average);
  return rating > 0 ? rating.toFixed(1).replace(".", ",") : "";
}

const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.2-9.4C1.700 7.700 3.600 4.500 6.800 4.500c2 0 3.500 1.100 5.200 3.100 1.700-2 3.200-3.100 5.200-3.100 3.200 0 5.100 3.200 4 6.600-1.700 4.800-9.200 9.400-9.200 9.400Z"/></svg>';
const favToItem = (f) => ({ id: f.id, media_type: f.type, title: f.title, poster_path: f.poster || "" });

function cardHtml(item, opts = {}) {
  const title = getMediaTitle(item);
  const type = getMediaType(item);
  const colorStart = item.colors ? item.colors[0] : "#2b2b2b";
  const colorEnd = item.colors ? item.colors[1] : "#161616";
  const rec = opts.resume || null;
  const mediaObj = { id: item.id, title, type, poster: item.poster_path || "" };
  if (rec && rec.type === "tv" && rec.season) { mediaObj.season = rec.season; mediaObj.episode = rec.episode; }
  const media = JSON.stringify(mediaObj).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const base = "https://image.tmdb.org/t/p";
  const art = item.poster_path
    ? `<img src="${base}/w342${item.poster_path}" srcset="${base}/w185${item.poster_path} 185w, ${base}/w342${item.poster_path} 342w, ${base}/w500${item.poster_path} 500w" sizes="(max-width: 820px) 31vw, 15vw" alt="" loading="lazy" decoding="async">`
    : `<span class="poster-fallback" style="--from:${colorStart};--to:${colorEnd}"><span>${escapeHtml(title)}</span></span>`;
  return `<article class="media-card">
      <button class="poster" type="button" data-media="${media}" aria-label="Regarder ${escapeHtml(title)}">
        ${art}
        ${type === "tv" && !rec ? '<span class="poster-type">Série</span>' : ""}
        ${rec && rec.type === "tv" && rec.season ? `<span class="resume-tag">S${rec.season} · E${rec.episode}</span>` : ""}
        <span class="poster-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m8 5 11 7-11 7z"></path></svg></span>
        ${rec ? '<span class="resume-bar" aria-hidden="true"><i></i></span>' : ""}
      </button>
      <button class="fav-btn${PM.favs.has(mediaObj) ? " is-on" : ""}" type="button" data-fav="${media}" aria-pressed="${PM.favs.has(mediaObj)}" aria-label="${PM.favs.has(mediaObj) ? "Retirer de ma liste" : "Ajouter à ma liste"}">${HEART}</button>
      ${rec ? `<button class="resume-x" type="button" data-resume-remove="${media}" aria-label="Retirer de l’historique">×</button>` : ""}
      <div class="card-meta"><span class="card-title">${escapeHtml(title)}</span><span class="card-year">${escapeHtml(getYear(item))}</span></div>
    </article>`;
}

// Résultats de recherche : une grille.
function renderGrid(items) {
  const count = document.getElementById("catalogue-count");
  if (!items.length) {
    catalogue.innerHTML = `<p class="empty-state">${state.query ? "Aucun résultat pour cette recherche. Essayez un autre titre." : "Aucun titre à afficher pour le moment."}</p>`;
    if (count) count.textContent = "";
    return;
  }
  if (count) count.textContent = `${items.length} titre${items.length > 1 ? "s" : ""}`;
  catalogue.innerHTML = `<div class="poster-grid">${items.map((i) => cardHtml(i)).join("")}</div>`;
}

const ARROW_PREV = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
const ARROW_NEXT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';

// Accueil et onglets : des rangées d'affiches qui défilent sur le côté.
function renderRows(rows) {
  const visible = rows.filter((row) => row.items.length);
  if (!visible.length) {
    renderGrid([]);
    return;
  }
  const rowHtml = (row) => {
    const items = row.ranked ? row.items.slice(0, 10) : row.items;
    const cards = row.ranked
      ? items.map((item, index) => `<div class="rank-card"><span class="rank-num" aria-hidden="true">${index + 1}</span>${cardHtml(item)}</div>`).join("")
      : items.map((item) => cardHtml(item, row.resume ? { resume: item._rec } : {})).join("");
    return `<section class="row${row.ranked ? " row-ranked" : ""}${row.resume ? " row-resume" : ""}" aria-label="${escapeHtml(row.title)}">
    <h2 class="row-title">${escapeHtml(row.title)}</h2>
    <div class="row-viewport">
      <button class="row-arrow row-arrow-prev" type="button" data-dir="prev" aria-label="Précédent">${ARROW_PREV}</button>
      <div class="row-track">${cards}</div>
      <button class="row-arrow row-arrow-next" type="button" data-dir="next" aria-label="Suivant">${ARROW_NEXT}</button>
    </div>
  </section>`;
  };
  catalogue.innerHTML = visible.map(rowHtml).join("");
  window.requestAnimationFrame(() => catalogue.querySelectorAll(".row-track").forEach(updateRowEdges));
}

function setActiveView(view) {
  document.querySelectorAll(".nav-link.is-active, .tab.is-active").forEach((node) => node.classList.remove("is-active"));
  document.querySelectorAll(`.nav-link[data-view="${view}"], .tab[data-view="${view}"]`).forEach((node) => node.classList.add("is-active"));
}

function updateRowEdges(track) {
  const viewport = track.parentElement;
  viewport.classList.toggle("at-start", track.scrollLeft < 8);
  viewport.classList.toggle("at-end", track.scrollLeft + track.clientWidth >= track.scrollWidth - 8);
}

// Choisit jusqu'à 8 titres avec une grande image pour faire défiler la bannière.
function pickHeroList(items) {
  const withArt = items.filter((item) => item.backdrop_path && item.overview).slice(0, 8);
  if (withArt.length) return withArt;
  const loose = items.filter((item) => item.backdrop_path).slice(0, 8);
  return loose.length ? loose : items.slice(0, 1);
}

function stopHeroTimer() {
  window.clearInterval(heroTimer);
  heroTimer = null;
}

function startHeroTimer() {
  stopHeroTimer();
  if (state.heroList.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  heroTimer = window.setInterval(() => {
    if (document.hidden) return;
    showHero((state.heroIndex + 1) % state.heroList.length);
  }, HERO_DELAY);
}

function renderHeroDots() {
  const dots = document.getElementById("billboard-dots");
  if (!dots) return;
  dots.hidden = state.heroList.length < 2;
  dots.innerHTML = state.heroList.map((item, index) =>
    `<button type="button" class="hero-dot${index === state.heroIndex ? " is-active" : ""}" data-index="${index}" aria-label="Afficher ${escapeHtml(getMediaTitle(item))}"></button>`
  ).join("");
}

function setBillboard(items) {
  if (!billboard) return;
  stopHeroTimer();
  if (!items || !items.length) {
    billboard.hidden = true;
    state.featured = null;
    state.featuredItem = null;
    state.heroList = [];
    return;
  }
  state.heroList = items;
  billboard.hidden = false;
  showHero(0, true);
  startHeroTimer();
}

function showHero(index, first = false) {
  const item = state.heroList[index];
  if (!item) return;
  state.heroIndex = index;
  const title = getMediaTitle(item);
  const type = getMediaType(item);
  const rating = formatRating(item);
  const year = getYear(item);
  const genres = getGenres(item);
  state.featured = { id: item.id, title, type, poster: item.poster_path || "" };
  state.featuredItem = item;

  billboard.style.setProperty("--from", item.colors ? item.colors[0] : "#2b2b2b");
  billboard.style.setProperty("--to", item.colors ? item.colors[1] : "#141414");
  document.getElementById("billboard-kind").textContent = type === "tv" ? "Série" : "Film";
  document.getElementById("billboard-title").textContent = title;
  document.getElementById("billboard-overview").textContent = item.overview
    || (type === "tv" ? "Une série à découvrir sur PRINCE MOVIE." : "Un film à découvrir sur PRINCE MOVIE.");
  document.getElementById("billboard-meta").innerHTML = [
    year !== "—" ? `<span class="meta-year">${escapeHtml(year)}</span>` : "",
    rating ? `<span class="meta-badge">★ ${rating}</span>` : "",
    `<span class="meta-badge">${type === "tv" ? "Série" : "Film"}</span>`
  ].join("");
  const genreLine = document.getElementById("billboard-genres");
  genreLine.textContent = genres.join(" • ");
  genreLine.hidden = !genres.length;
  document.getElementById("billboard-play").hidden = false;
  renderHeroDots();

  // Fondu enchaîné : la nouvelle image arrive par-dessus, puis l'ancienne est retirée.
  const mediaBox = document.getElementById("billboard-media");
  if (!item.backdrop_path) {
    mediaBox.replaceChildren();
    return;
  }
  const image = new Image();
  image.alt = "";
  image.decoding = "async";
  image.addEventListener("load", () => {
    if (state.heroIndex !== index) return;
    image.classList.add("is-current");
    const previous = [...mediaBox.querySelectorAll("img")].filter((node) => node !== image);
    window.setTimeout(() => previous.forEach((node) => node.remove()), first ? 0 : 900);
  });
  image.src = `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`;
  mediaBox.append(image);
}

// Fenêtre « Plus d'infos »
function openInfo() {
  const item = state.featuredItem;
  const dialog = document.getElementById("info-dialog");
  if (!item || !dialog || typeof dialog.showModal !== "function") return;
  const type = getMediaType(item);
  const rating = formatRating(item);
  const year = getYear(item);
  const genres = getGenres(item);
  document.getElementById("info-title").textContent = getMediaTitle(item);
  document.getElementById("info-meta").innerHTML = [
    year !== "—" ? `<span class="meta-year">${escapeHtml(year)}</span>` : "",
    rating ? `<span class="meta-badge">★ ${rating}</span>` : "",
    `<span class="meta-badge">${type === "tv" ? "Série" : "Film"}</span>`
  ].join("");
  document.getElementById("info-genres").textContent = genres.join(" • ");
  document.getElementById("info-overview").textContent = item.overview || "Pas de résumé disponible pour ce titre.";
  const art = document.getElementById("info-media");
  art.replaceChildren();
  art.style.setProperty("--from", item.colors ? item.colors[0] : "#2b2b2b");
  art.style.setProperty("--to", item.colors ? item.colors[1] : "#141414");
  if (item.backdrop_path) {
    const image = new Image();
    image.alt = "";
    image.src = `https://image.tmdb.org/t/p/w780${item.backdrop_path}`;
    art.append(image);
  }
  stopHeroTimer();
  dialog.showModal();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function updateHeading() {
  const heading = document.querySelector(".catalogue-heading");
  const title = document.getElementById("section-title");
  const count = document.getElementById("catalogue-count");
  if (count) count.textContent = "";
  heading.hidden = !state.query;
  if (state.query) title.textContent = `Résultats pour « ${state.query} »`;
}

// Le bandeau du haut devient plein dès qu'on défile, ou quand il n'y a pas de bandeau (recherche).
function updateTopbar() {
  if (!topbar || document.body.dataset.page === "player") return;
  const plain = !billboard || billboard.hidden;
  topbar.classList.toggle("is-solid", plain || window.scrollY > 30);
}

// Rangées personnelles de l'accueil : reprise de lecture et ma liste.
function personalRows() {
  const rows = [];
  const rec = PM.recent.list();
  if (rec.length) rows.push({ title: "Reprendre la lecture", resume: true, items: rec.map((r) => ({ ...favToItem(r), _rec: r })) });
  const fav = PM.favs.list();
  if (fav.length) rows.push({ title: "Ma liste", items: fav.map(favToItem) });
  return rows;
}

function showList() {
  const items = PM.favs.list().map(favToItem);
  const heading = document.querySelector(".catalogue-heading");
  heading.hidden = false;
  document.getElementById("section-title").textContent = PM.tr("Ma liste");
  document.getElementById("catalogue-count").textContent = items.length ? `${items.length} titre${items.length > 1 ? "s" : ""}` : "";
  if (items.length) catalogue.innerHTML = `<div class="poster-grid">${items.map((i) => cardHtml(i)).join("")}</div>`;
  else catalogue.innerHTML = `<p class="empty-state">${PM.tr("Vous n’avez encore aucun favori.")} Touchez le cœur d’une affiche pour l’ajouter ici.</p>`;
  setBillboard(null);
  document.querySelector("main").classList.add("is-plain");
  updateTopbar();
}

function showContent(rows) {
  const searching = Boolean(state.query);
  const heroItems = (rows[0] && rows[0].items) || [];
  if (searching) renderGrid(heroItems);
  else renderRows(state.view === "home" ? [...personalRows(), ...rows] : rows);
  setBillboard(searching ? null : pickHeroList(heroItems));
  document.querySelector("main").classList.toggle("is-plain", searching || !state.featured);
  updateTopbar();
}

async function loadView() {
  const currentRequest = ++state.requestId;
  updateHeading();
  setStatus("");
  if (state.view === "list" && !state.query) { showList(); return; }
  setLoading();
  if (!hasApiKey()) {
    showContent(getDemoRows(state.view, state.query));
    setStatus("Catalogue de démonstration : ajoutez votre clé TMDB dans config.js pour afficher les titres en direct.");
    return;
  }
  try {
    const rows = await fetchCatalogue(state.view, state.query, currentRequest);
    if (rows) showContent(rows);
  } catch (error) {
    if (currentRequest !== state.requestId) return;
    showContent(getDemoRows(state.view, state.query));
    setStatus(`Impossible de charger le catalogue en direct (${error.message}). Affichage de la sélection de démonstration.`);
  }
}

function getConfiguredServers() {
  playerRuntime.invalidServerCount = 0;
  const configuredServers = getConfig().STREAM_SERVERS;
  // Une source peut être une simple URL (modèle /embed/movie/ID) ou un objet
  // { name, url, movie, tv, lang } avec ses propres modèles de chemin.
  return (Array.isArray(configuredServers) ? configuredServers : []).reduce((servers, value) => {
    const entry = typeof value === "string" ? { url: value } : value;
    const rawUrl = entry && typeof entry.url === "string" ? entry.url.trim() : "";
    if (!/^https?:\/\//i.test(rawUrl)) {
      playerRuntime.invalidServerCount += 1;
      return servers;
    }
    try {
      const url = new URL(rawUrl);
      servers.push({
        url: url.href.replace(/\/+$/, ""),
        name: typeof entry.name === "string" ? entry.name : "",
        movie: typeof entry.movie === "string" ? entry.movie : "",
        tv: typeof entry.tv === "string" ? entry.tv : "",
        lang: entry.lang !== false,
        sandbox: entry.sandbox !== false,
        check: typeof entry.check === "string" ? entry.check : ""
      });
    } catch {
      playerRuntime.invalidServerCount += 1;
    }
    return servers;
  }, []);
}

function initializeSourceSelector() {
  playerRuntime.servers = getConfiguredServers();
  setSelectOptions(nodeSelector, playerRuntime.servers.map((server, index) => ({
    value: index,
    label: server.name ? `Source ${index + 1} · ${server.name}` : `Source ${index + 1}`
  })), "Aucune source disponible");

  if (playerRuntime.servers.length) {
    const stored = readPlayerState().source;
    const savedSource = Number(stored !== undefined ? stored : PM.settings.get().source);
    if (Number.isInteger(savedSource) && playerRuntime.servers[savedSource]) {
      playerRuntime.currentIndex = savedSource;
    }
    nodeSelector.value = String(playerRuntime.currentIndex);
  }
  nodeSelector.addEventListener("change", () => {
    const selectedIndex = Number(nodeSelector.value);
    if (!Number.isInteger(selectedIndex) || !playerRuntime.servers[selectedIndex]) return;
    playerRuntime.currentIndex = selectedIndex;
    savePlayerState({ source: selectedIndex });
    loadTarget();
  });
}

function updatePlayerStatus(message, failed = false) {
  const status = document.getElementById("source-status");
  status.classList.toggle("is-error", failed);
  document.getElementById("source-status-text").textContent = message;
  document.getElementById("source-note").textContent = message;
}

function showPlayerMessage(title, detail, failed = false) {
  playerMessage.hidden = false;
  playerMessage.querySelector(".cinema-title").textContent = title;
  document.getElementById("player-detail").textContent = detail;
  playerMessage.classList.toggle("is-error", failed);
  document.querySelector(".loader-bars").hidden = failed;
}

function chargerFluxMedia(type, id, saison = 1, episode = 1) {
  if (type === "tv" && (
    !playerRuntime.availableSeasons.includes(Number(saison))
    || !playerRuntime.availableEpisodes.includes(Number(episode))
  )) {
    updatePlayerStatus("Saison ou épisode indisponible", true);
    showPlayerMessage("Épisode indisponible", "Choisissez une saison et un épisode dans les listes disponibles.", true);
    return;
  }
  playerRuntime.currentResource = { type, id, saison, episode };
  if (type === "tv") savePlayerState({ season: Number(saison), episode: Number(episode) });
  recordRecent();

  if (!playerRuntime.servers.length) {
    playerFrame.removeAttribute("src");
    playerFrame.hidden = true;
    updatePlayerStatus("Aucune source configurée", true);
    showPlayerMessage(
      playerRuntime.invalidServerCount ? "URL de source invalide" : "Aucune source disponible",
      playerRuntime.invalidServerCount
        ? "Vérifiez les adresses de CONFIG.STREAM_SERVERS dans config.js : chaque URL doit commencer par http:// ou https://."
        : "Ajoutez vos URL de lecture dans CONFIG.STREAM_SERVERS de config.js pour activer le lecteur.",
      true
    );
    return;
  }

  loadTarget();
}

// Enregistre le titre dans « Reprendre la lecture » (avec saison et épisode pour une série).
function recordRecent() {
  const r = playerRuntime.currentResource;
  if (!r || !playerMeta.id) return;
  const rec = { id: Number(playerMeta.id), type: playerMeta.type, title: playerMeta.title, poster: playerMeta.poster };
  if (r.type === "tv") { rec.season = Number(r.saison); rec.episode = Number(r.episode); }
  PM.recent.add(rec);
}
function noteMeta(info) {
  if (info && info.poster_path && !playerMeta.poster) { playerMeta.poster = info.poster_path; recordRecent(); syncFavButton(); }
}
function syncFavButton() {
  const b = document.getElementById("fav-toggle");
  if (!b || !playerMeta.id) return;
  const on = PM.favs.has(playerMeta);
  b.classList.toggle("is-on", on);
  b.setAttribute("aria-pressed", String(on));
  b.querySelector("span").textContent = PM.tr(on ? "Retirer de ma liste" : "Ajouter à ma liste");
}

function loadTarget() {
  playerMessage.hidden = true;
  const resource = playerRuntime.currentResource;
  const server = playerRuntime.servers[playerRuntime.currentIndex];
  if (!resource || !server) return;

  const base = new URL(server.url);
  const serverPath = base.pathname.replace(/\/+$/, "");
  const template = resource.type === "movie"
    ? (server.movie || "/embed/movie/{id}")
    : (server.tv || "/embed/tv/{id}/{season}/{episode}");
  const path = template
    .replace("{id}", encodeURIComponent(resource.id))
    .replace("{season}", encodeURIComponent(resource.saison))
    .replace("{episode}", encodeURIComponent(resource.episode));
  const target = new URL(`${base.origin}${serverPath}${path}`);
  target.hash = "";

  // Paramètre de sous-titres (ignoré par les sources déjà en français comme Frembed)
  const subLang = langSelector ? langSelector.value : (getConfig().DEFAULT_SUB_LANG || "");
  if (subLang && server.lang) target.searchParams.set("ds_lang", subLang);

  // Le sandbox est toujours actif : il bloque les pop-ups et redirections publicitaires des lecteurs.
  // (Une source peut y déroger avec sandbox: false dans config.js si elle refuse de démarrer.)
  if (server.sandbox) {
    playerFrame.setAttribute("sandbox", PLAYER_SANDBOX);
  } else {
    playerFrame.removeAttribute("sandbox");
  }
  playerFrame.setAttribute("allow", PLAYER_ALLOW);
  playerFrame.setAttribute("allowfullscreen", "");
  playerFrame.setAttribute("loading", "lazy");
  playerFrame.src = target.href;
  playerFrame.hidden = false;
  playerRuntime.startedAt = Date.now();
  refreshNextButton();
  scheduleNextUp();
  updatePlayerStatus(`Chargement de la source ${playerRuntime.currentIndex + 1} sur ${playerRuntime.servers.length}…`);
  checkAvailability(server, resource);
}

// Pour les sources qui proposent une API de disponibilité (ex. Vidzy), prévient si le titre n'existe pas.
// Si l'API n'est pas accessible depuis le navigateur (CORS), on ignore silencieusement.
async function checkAvailability(server, resource) {
  if (!server.check) return;
  try {
    const response = await fetch(server.check.replace("{id}", encodeURIComponent(resource.id)), {
      headers: { Accept: "application/json" }
    });
    if (!response.ok) return;
    const data = await response.json();
    if (playerRuntime.currentResource !== resource || playerRuntime.servers[playerRuntime.currentIndex] !== server) return;
    if (data && data.available === false) {
      updatePlayerStatus("Titre indisponible sur cette source · essayez une autre source", true);
    }
  } catch {
    /* API non accessible : on laisse le lecteur gérer */
  }
}

function openPlayer(media) {
  const url = new URL("player.html", window.location.href);
  url.searchParams.set("id", media.id);
  url.searchParams.set("type", media.type);
  url.searchParams.set("title", media.title);
  if (media.poster) url.searchParams.set("poster", media.poster);
  if (media.type === "tv" && media.season) { url.searchParams.set("season", media.season); url.searchParams.set("episode", media.episode); }
  saveHomeState();
  window.location.assign(url.href);
}

async function dismissSplashScreen(instant = false) {
  const splash = document.getElementById("splash-screen");
  if (splash && instant) {
    splash.setAttribute("aria-hidden", "true");
    splash.hidden = true;
  } else if (splash) {
    splash.setAttribute("aria-hidden", "true");
    splash.classList.add("is-hidden");
    await new Promise((resolve) => {
      let timeoutId;
      const finish = () => {
        window.clearTimeout(timeoutId);
        splash.removeEventListener("transitionend", handleTransitionEnd);
        resolve();
      };
      const handleTransitionEnd = (event) => {
        if (event.target === splash && event.propertyName === "opacity") finish();
      };
      splash.addEventListener("transitionend", handleTransitionEnd);
      timeoutId = window.setTimeout(finish, 600);
    });
    splash.hidden = true;
  }
  document.querySelectorAll("[data-app-content]").forEach((element) => {
    element.removeAttribute("inert");
    element.removeAttribute("aria-hidden");
  });
  document.body.classList.add("is-ready");
  try { sessionStorage.setItem(SPLASH_SEEN_KEY, "1"); } catch { /* ignoré */ }
}

async function initHomePage() {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  let splashSeen = false;
  try { splashSeen = sessionStorage.getItem(SPLASH_SEEN_KEY) === "1"; } catch { /* ignoré */ }

  // Retrouve l'onglet, la recherche et la position où l'on était (retour du lecteur, rotation, rechargement).
  const saved = readSession(HOME_STATE_KEY);
  let restoreScroll = 0;
  if (saved) {
    if (["home", "movie", "tv", "list"].includes(saved.view)) state.view = saved.view;
    if (typeof saved.query === "string") state.query = saved.query;
    restoreScroll = Number(saved.scroll) || 0;
    setActiveView(state.view);
    searchInput.value = state.query;
    clearSearchButton.hidden = !state.query;
  }

  if (new URLSearchParams(location.search).get("view") === "list") {
    state.view = "list"; state.query = ""; restoreScroll = 0;
    setActiveView("list");
    history.replaceState(null, "", "index.html");
  }

  document.querySelectorAll(".nav-link[data-view], .tab[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveView(button.dataset.view);
      state.view = button.dataset.view;
      window.scrollTo({ top: 0 });
      state.query = "";
      searchInput.value = "";
      clearSearchButton.hidden = true;
      saveHomeState();
      loadView();
    });
  });

  document.querySelector('.tab[data-action="search"]')?.addEventListener("click", () => {
    window.scrollTo({ top: 0 });
    searchInput.focus();
  });

  const searchForm = document.querySelector(".search-form");
  searchForm.addEventListener("submit", (event) => event.preventDefault());
  searchForm.addEventListener("click", (event) => {
    if (event.target !== searchInput) searchInput.focus();
  });
  let searchTimer;
  searchInput.addEventListener("input", () => {
    state.query = searchInput.value.trim();
    clearSearchButton.hidden = !state.query;
    saveHomeState();
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(loadView, 280);
  });
  clearSearchButton.addEventListener("click", () => {
    searchInput.value = "";
    state.query = "";
    clearSearchButton.hidden = true;
    saveHomeState();
    loadView();
    searchInput.focus();
  });
  document.getElementById("billboard-info").addEventListener("click", openInfo);
  const infoDialog = document.getElementById("info-dialog");
  document.getElementById("info-close").addEventListener("click", () => infoDialog.close());
  document.getElementById("info-play").addEventListener("click", () => {
    if (state.featured) openPlayer(state.featured);
  });
  infoDialog.addEventListener("click", (event) => {
    if (event.target === infoDialog) infoDialog.close();
  });
  infoDialog.addEventListener("close", startHeroTimer);
  document.getElementById("billboard-dots").addEventListener("click", (event) => {
    const dot = event.target.closest(".hero-dot");
    if (!dot) return;
    showHero(Number(dot.dataset.index));
    startHeroTimer();
  });
  document.getElementById("billboard-play").addEventListener("click", () => {
    if (state.featured) openPlayer(state.featured);
  });
  catalogue.addEventListener("click", (event) => {
    const arrow = event.target.closest(".row-arrow");
    if (arrow) {
      const track = arrow.parentElement.querySelector(".row-track");
      track.scrollBy({ left: (arrow.dataset.dir === "prev" ? -1 : 1) * track.clientWidth * 0.85, behavior: "smooth" });
      return;
    }
    const fav = event.target.closest("[data-fav]");
    if (fav) {
      const m = JSON.parse(fav.dataset.fav);
      const on = PM.favs.toggle(m);
      fav.classList.toggle("is-on", on);
      fav.setAttribute("aria-pressed", String(on));
      if (state.view === "list" && !state.query) showList();
      else if (!state.query && state.view === "home") refreshPersonalRows();
      return;
    }
    const rm = event.target.closest("[data-resume-remove]");
    if (rm) {
      PM.recent.remove(JSON.parse(rm.dataset.resumeRemove));
      rm.closest(".media-card").remove();
      refreshPersonalRows(true);
      return;
    }
    const card = event.target.closest("[data-media]");
    if (card) openPlayer(JSON.parse(card.dataset.media));
  });

  // Cache la flèche inutile au début ou à la fin de chaque rangée.
  catalogue.addEventListener("scroll", (event) => {
    if (event.target.classList && event.target.classList.contains("row-track")) updateRowEdges(event.target);
  }, { capture: true, passive: true });
  window.addEventListener("scroll", updateTopbar, { passive: true });

  let scrollTimer;
  window.addEventListener("scroll", () => {
    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(saveHomeState, 150);
  }, { passive: true });
  window.addEventListener("pagehide", saveHomeState);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") saveHomeState();
  });

  const minimumSplashDuration = new Promise((resolve) => window.setTimeout(resolve, splashSeen ? 0 : 1400));
  try {
    await loadView();
  } finally {
    await minimumSplashDuration;
    await dismissSplashScreen(splashSeen);
    if (restoreScroll > 0) window.scrollTo(0, restoreScroll);
    updateTopbar();
    homeStateReady = true;
  }
}

// Met à jour les rangées « Reprendre » / « Ma liste » sans recharger tout le catalogue.
function refreshPersonalRows() {
  if (state.view !== "home" || state.query) return;
  catalogue.querySelectorAll(".row").forEach((row) => {
    const t = row.getAttribute("aria-label");
    if (t === PM.tr("Ma liste") || t === PM.tr("Reprendre la lecture")) row.remove();
  });
  const rows = personalRows();
  if (!rows.length) return;
  const tmp = document.createElement("div");
  const keep = catalogue.innerHTML;
  catalogue.innerHTML = "";
  renderRows(rows);
  tmp.innerHTML = catalogue.innerHTML;
  catalogue.innerHTML = tmp.innerHTML + keep;
  window.requestAnimationFrame(() => catalogue.querySelectorAll(".row-track").forEach(updateRowEdges));
}

// Plein écran : API native (Android, ordinateur) ou, à défaut (iPhone…), plein écran simulé qui remplit l'écran.
function initFullscreenButton() {
  const button = document.getElementById("fullscreen-button");
  const exitButton = document.getElementById("fullscreen-exit");
  const box = document.querySelector(".cinema-frame");
  if (!button || !box) return;
  const label = button.querySelector("span");
  const nativeElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;
  const isActive = () => Boolean(nativeElement()) || box.classList.contains("is-pseudo-fullscreen");

  function refresh() {
    const active = isActive();
    button.setAttribute("aria-pressed", String(active));
    label.textContent = active ? "Quitter le plein écran" : "Plein écran";
    exitButton.hidden = !active;
    document.body.classList.toggle("has-fullscreen", active);
  }

  async function enter() {
    const request = box.requestFullscreen || box.webkitRequestFullscreen;
    if (request) {
      try {
        await request.call(box);
        try { await screen.orientation?.lock?.("landscape"); } catch { /* non pris en charge */ }
        refresh();
        return;
      } catch { /* on bascule sur le plein écran simulé */ }
    }
    box.classList.add("is-pseudo-fullscreen");
    refresh();
  }

  async function exit() {
    if (nativeElement()) {
      try { await (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch { /* ignoré */ }
      try { screen.orientation?.unlock?.(); } catch { /* ignoré */ }
    }
    box.classList.remove("is-pseudo-fullscreen");
    refresh();
  }

  button.addEventListener("click", () => (isActive() ? exit() : enter()));
  exitButton.addEventListener("click", exit);
  document.addEventListener("fullscreenchange", refresh);
  document.addEventListener("webkitfullscreenchange", refresh);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && box.classList.contains("is-pseudo-fullscreen")) exit();
  });
}

function initBackButton() {
  const backButton = document.querySelector(".back-button");
  if (!backButton) return;
  backButton.addEventListener("click", (event) => {
    try {
      const referrer = document.referrer ? new URL(document.referrer) : null;
      const comesFromCatalogue = referrer
        && referrer.origin === window.location.origin
        && /(\/|index\.html)$/.test(referrer.pathname);
      if (comesFromCatalogue && window.history.length > 1) {
        event.preventDefault();
        window.history.back();
      }
    } catch { /* on laisse le lien normal */ }
  });
}

function initPlayerPage() {
  initBackButton();
  initFullscreenButton();
  playerFrame.setAttribute("sandbox", PLAYER_SANDBOX);
  playerFrame.setAttribute("allow", PLAYER_ALLOW);
  playerFrame.setAttribute("allowfullscreen", "");
  playerFrame.setAttribute("loading", "lazy");
  initializeSourceSelector();
  nextButton?.addEventListener("click", playNext);
  document.getElementById("next-up-go")?.addEventListener("click", playNext);
  document.getElementById("next-up-later")?.addEventListener("click", hideNextUp);

  if (langSelector) {
    const pref = PM.settings.get().subLang;
    const savedLang = localStorage.getItem("prince:lang");
    const defaultLang = pref ? (pref === "off" ? "" : pref) : (savedLang !== null ? savedLang : (PM.lang || getConfig().DEFAULT_SUB_LANG || "fr"));
    if ([...langSelector.options].some((option) => option.value === defaultLang)) langSelector.value = defaultLang;
    langSelector.addEventListener("change", () => {
      localStorage.setItem("prince:lang", langSelector.value);
      PM.settings.set({ subLang: langSelector.value || "off" });
      if (playerRuntime.currentResource) loadTarget();
    });
  }

  // Les lecteurs externes n'envoient pas "prince:ready" : on se base sur la fin du chargement de l'iframe.
  playerFrame.addEventListener("load", () => {
    if (!playerFrame.getAttribute("src")) return;
    playerMessage.hidden = true;
    updatePlayerStatus(`Source ${playerRuntime.currentIndex + 1} prête`);
  });

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const type = params.get("type");
  const title = params.get("title") || "Lecture";
  const validId = /^\d+$/.test(id || "");
  const validType = type === "movie" || type === "tv";

  Object.assign(playerMeta, { id: validId ? id : "", type: validType ? type : "", title, poster: /^\/[\w.-]+$/.test(params.get("poster") || "") ? params.get("poster") : "" });
  if (type === "tv" && /^\d+$/.test(params.get("season") || "") && /^\d+$/.test(params.get("episode") || "")) {
    savePlayerState({ season: Number(params.get("season")), episode: Number(params.get("episode")) });
  }
  document.getElementById("fav-toggle")?.addEventListener("click", () => {
    PM.favs.toggle({ id: Number(playerMeta.id), type: playerMeta.type, title: playerMeta.title, poster: playerMeta.poster });
    syncFavButton();
  });
  syncFavButton();
  document.title = `${title} — PRINCE MOVIE`;
  document.getElementById("player-title").textContent = title;
  document.getElementById("player-subtitle").textContent = validType && type === "tv" ? "Série" : "Film";
  episodeControls.hidden = type !== "tv";
  if (!validId || !validType) {
    updatePlayerStatus("Titre introuvable", true);
    showPlayerMessage("Impossible de lancer ce titre", "Revenez à l’accueil et sélectionnez un titre du catalogue.", true);
    return;
  }

  if (!playerRuntime.servers.length) {
    updatePlayerStatus("Aucune source configurée", true);
    showPlayerMessage(
      playerRuntime.invalidServerCount ? "URL de source invalide" : "Aucune source disponible",
      playerRuntime.invalidServerCount
        ? "Vérifiez les adresses de CONFIG.STREAM_SERVERS dans config.js : chaque URL doit commencer par http:// ou https://."
        : "Ajoutez vos URL de lecture dans CONFIG.STREAM_SERVERS de config.js pour activer le lecteur.",
      true
    );
    return;
  }

  window.addEventListener("message", (event) => {
    if (event.source !== playerFrame.contentWindow) return;
    const server = playerRuntime.servers[playerRuntime.currentIndex];
    if (!server || event.origin !== new URL(server.url).origin) return;
    if (event.data !== "prince:ready" && event.data?.type !== "prince:ready") return;
    playerMessage.hidden = true;
    updatePlayerStatus(`Lecture confirmée · source ${playerRuntime.currentIndex + 1}`);
  });

  if (type === "tv") {
    seasonSelect.addEventListener("change", () => {
      loadSeasonEpisodes(id, Number(seasonSelect.value), false);
    });
    loadEpisodeButton.addEventListener("click", () => {
      chargerFluxMedia(type, id, Number(seasonSelect.value), Number(episodeSelect.value));
    });
    loadTvSeasons(id);
  } else {
    chargerFluxMedia(type, id);
    loadMovieExtras(id);
  }
}

function setSelectOptions(select, options, placeholder) {
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

async function loadTvSeasons(id) {
  seasonSelect.disabled = true;
  episodeSelect.disabled = true;
  loadEpisodeButton.disabled = true;
  playerRuntime.availableSeasons = [];
  playerRuntime.availableEpisodes = [];
  setSelectOptions(seasonSelect, [], "Chargement…");
  setSelectOptions(episodeSelect, [], "Chargement…");
  updatePlayerStatus("Chargement des saisons disponibles…");
  showPlayerMessage("Chargement des saisons", "Vérification des saisons de cette série…");

  try {
    const show = await fetchTmdb(`/tv/${encodeURIComponent(id)}?language=${PM.tmdbLang()}`);
    noteMeta(show);
    const seasons = (show.seasons || []).filter((season) =>
      Number.isInteger(season.season_number)
      && season.season_number >= 0
      && season.episode_count > 0
    );
    if (!seasons.length) {
      throw new Error("TMDB ne signale aucune saison disponible pour cette série.");
    }

    playerRuntime.availableSeasons = seasons.map((season) => season.season_number);
    setSelectOptions(seasonSelect, seasons.map((season) => ({
      value: season.season_number,
      label: season.name || `Saison ${season.season_number}`
    })), "Aucune saison disponible");
    const savedSeason = Number(readPlayerState().season);
    seasonSelect.value = String(
      playerRuntime.availableSeasons.includes(savedSeason) ? savedSeason
        : seasons.some((season) => season.season_number === 1) ? 1
        : seasons[0].season_number
    );
    await loadSeasonEpisodes(id, Number(seasonSelect.value), true);
  } catch (error) {
    updatePlayerStatus("Impossible de charger les saisons", true);
    showPlayerMessage("Saisons indisponibles", error.message, true);
    setSelectOptions(seasonSelect, [], "Saisons indisponibles");
    setSelectOptions(episodeSelect, [], "Épisodes indisponibles");
    loadEpisodeButton.disabled = true;
  }
}

async function loadSeasonEpisodes(id, seasonNumber, autoplay) {
  const requestId = ++playerRuntime.selectionRequestId;
  playerRuntime.availableEpisodes = [];
  episodeSelect.disabled = true;
  loadEpisodeButton.disabled = true;
  setSelectOptions(episodeSelect, [], "Chargement…");
  updatePlayerStatus(`Chargement des épisodes de la saison ${seasonNumber}…`);
  showPlayerMessage("Chargement des épisodes", `Vérification des épisodes disponibles de la saison ${seasonNumber}…`);

  try {
    const data = await fetchTmdb(`/tv/${encodeURIComponent(id)}/season/${encodeURIComponent(seasonNumber)}?language=${PM.tmdbLang()}`);
    if (requestId !== playerRuntime.selectionRequestId) return;
    const today = new Date().toISOString().slice(0, 10);
    const episodes = (data.episodes || []).filter((episode) =>
      Number.isInteger(episode.episode_number)
      && episode.episode_number > 0
      && (!episode.air_date || episode.air_date <= today)
    );
    playerRuntime.availableEpisodes = episodes.map((episode) => episode.episode_number);
    episodes.forEach((episode) => { playerRuntime.runtimes[`${seasonNumber}-${episode.episode_number}`] = episode.runtime; });
    setSelectOptions(episodeSelect, episodes.map((episode) => ({
      value: episode.episode_number,
      label: `Épisode ${episode.episode_number}${episode.name ? ` · ${episode.name}` : ""}`
    })), "Aucun épisode disponible");

    if (!episodes.length) {
      updatePlayerStatus("Aucun épisode diffusé pour cette saison", true);
      showPlayerMessage("Aucun épisode disponible", "Cette saison ne contient pas encore d’épisode diffusé.", true);
      return;
    }

    const savedPlayer = readPlayerState();
    const restoredEpisode = savedPlayer.season === seasonNumber && playerRuntime.availableEpisodes.includes(Number(savedPlayer.episode))
      ? Number(savedPlayer.episode)
      : episodes[0].episode_number;
    episodeSelect.value = String(restoredEpisode);
    loadEpisodeButton.disabled = false;
    if (autoplay) {
      chargerFluxMedia("tv", id, seasonNumber, Number(episodeSelect.value));
    } else {
      updatePlayerStatus(`Saison ${seasonNumber} · ${episodes.length} épisode(s) disponible(s)`);
      showPlayerMessage("Choisissez un épisode", "Sélectionnez un épisode disponible, puis lancez la lecture.");
    }
  } catch (error) {
    if (requestId !== playerRuntime.selectionRequestId) return;
    setSelectOptions(episodeSelect, [], "Épisodes indisponibles");
    updatePlayerStatus("Impossible de charger les épisodes", true);
    showPlayerMessage("Épisodes indisponibles", error.message, true);
    loadEpisodeButton.disabled = true;
  }
}


// ---------- Suite : épisode suivant (série) ou film suivant (film) ----------
const nextButton = document.getElementById("next-button");
const nextUpBox = document.getElementById("next-up");
let nextTimer = null;
let nextMovie = null;

function hideNextUp() { if (nextUpBox) nextUpBox.hidden = true; }

function findNextEpisode() {
  const r = playerRuntime.currentResource;
  if (!r || r.type !== "tv") return null;
  const nextEp = playerRuntime.availableEpisodes.find((n) => n > Number(r.episode));
  if (nextEp) return { season: Number(r.saison), episode: nextEp };
  const nextSeason = playerRuntime.availableSeasons.filter((n) => n > Number(r.saison)).sort((a, b) => a - b)[0];
  return nextSeason !== undefined ? { season: nextSeason, episode: null } : null;
}

function hasNext() {
  const r = playerRuntime.currentResource;
  return Boolean(r && (r.type === "tv" ? findNextEpisode() : nextMovie));
}

function refreshNextButton() {
  if (!nextButton) return;
  const r = playerRuntime.currentResource;
  nextButton.hidden = !hasNext();
  const label = nextButton.querySelector("span");
  if (label && r) label.textContent = PM.tr(r.type === "tv" ? "Épisode suivant" : "Film suivant");
}

async function loadMovieExtras(id) {
  try {
    const [info, reco] = await Promise.all([
      fetchTmdb(`/movie/${encodeURIComponent(id)}?language=${PM.tmdbLang()}`),
      fetchTmdb(`/movie/${encodeURIComponent(id)}/recommendations?language=${PM.tmdbLang()}`)
    ]);
    playerRuntime.movieRuntime = Number(info.runtime) || 0;
    noteMeta(info);
    const pick = (reco.results || []).find((m) => m.poster_path);
    nextMovie = pick ? { id: pick.id, title: getMediaTitle(pick), type: "movie" } : null;
    refreshNextButton();
    scheduleNextUp();
  } catch { /* pas de suggestion */ }
}

function scheduleNextUp() {
  window.clearTimeout(nextTimer);
  hideNextUp();
  const r = playerRuntime.currentResource;
  if (!r || !hasNext() || PM.settings.get().autoNext === false) return;
  const minutes = r.type === "tv"
    ? (playerRuntime.runtimes[`${r.saison}-${r.episode}`] || 42)
    : (playerRuntime.movieRuntime || 100);
  // Les lecteurs externes ne disent pas quand la vidéo se termine : on propose la suite
  // peu avant la fin prévue (durée TMDB). Le bouton « suivant » reste disponible à tout moment.
  const delay = Math.max(1000, (minutes - 3) * 60000 - (Date.now() - playerRuntime.startedAt));
  nextTimer = window.setTimeout(showNextUp, delay);
}

function showNextUp() {
  if (!nextUpBox || !hasNext()) return;
  const r = playerRuntime.currentResource;
  document.getElementById("next-up-title").textContent = r.type === "tv" ? PM.tr("Regarder l’épisode suivant") : PM.tr("Regarder le film suivant");
  nextUpBox.hidden = false;
}

async function playNext() {
  hideNextUp();
  const r = playerRuntime.currentResource;
  if (!r) return;
  if (r.type === "movie") {
    if (nextMovie) openPlayer(nextMovie);
    return;
  }
  const next = findNextEpisode();
  if (!next) return;
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (next.episode) {
    episodeSelect.value = String(next.episode);
    chargerFluxMedia("tv", r.id, next.season, next.episode);
  } else {
    seasonSelect.value = String(next.season);
    await loadSeasonEpisodes(r.id, next.season, true);
  }
}

// Démarrage : il faut être connecté, avoir choisi sa langue et son profil.
(async () => {
  if (!(await PM.requireLogin())) return;
  PM.mountUserMenu();
  if (document.body.dataset.page === "player") initPlayerPage();
  else initHomePage();
})();

