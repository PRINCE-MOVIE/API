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
  activeMedia: null
};

const catalogue = document.getElementById("catalogue");
const statusMessage = document.getElementById("status-message");
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
const adblockSelector = document.getElementById("adblock-toggle");

// Bloque pop-ups, redirections et nouvelles fenêtres publicitaires venant des lecteurs.
// (pas de allow-popups ni allow-top-navigation)
const PLAYER_SANDBOX = "allow-scripts allow-same-origin allow-forms allow-presentation";
const PLAYER_ALLOW = "autoplay; fullscreen; picture-in-picture; encrypted-media";
const playerRuntime = {
  servers: [],
  currentIndex: 0,
  invalidServerCount: 0,
  selectionRequestId: 0,
  availableSeasons: [],
  availableEpisodes: [],
  currentResource: null
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
  catalogue.innerHTML = Array.from({ length: 8 }, () => '<div class="skeleton" aria-hidden="true"></div>').join("");
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

async function fetchCatalogue(view, query, requestId) {
  const language = "fr-FR";
  let endpoint;
  if (query) {
    endpoint = `/search/multi?query=${encodeURIComponent(query)}&include_adult=false&language=${language}`;
  } else if (view === "home") {
    endpoint = `/trending/all/week?language=${language}`;
  } else {
    endpoint = `/discover/${view}?sort_by=popularity.desc&include_adult=false&language=${language}`;
  }
  const separator = endpoint.includes("?") ? "&" : "?";
  const response = await fetch(`https://api.themoviedb.org/3${endpoint}${separator}api_key=${encodeURIComponent(getConfig().TMDB_KEY)}`, {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) throw new Error(`TMDB a répondu avec le statut ${response.status}.`);
  const data = await response.json();
  if (requestId !== state.requestId) return null;
  return (data.results || []).filter((item) => item.media_type !== "person");
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

function renderCards(items) {
  if (!items.length) {
    catalogue.innerHTML = `<p class="empty-state">${state.query ? "Aucun résultat pour cette recherche." : "Aucun titre à afficher pour le moment."}</p>`;
    return;
  }
  catalogue.innerHTML = items.map((item, index) => {
    const title = getMediaTitle(item);
    const type = getMediaType(item);
    const colorStart = item.colors ? item.colors[0] : "#30203d";
    const colorEnd = item.colors ? item.colors[1] : "#7f3f64";
    const posterBackground = item.backdrop_path
      ? `linear-gradient(0deg,rgba(8,8,13,.8),transparent 80%),url(https://image.tmdb.org/t/p/w780${item.backdrop_path}) center 35%/cover`
      : `linear-gradient(135deg,${colorStart},${colorEnd})`;
    const media = JSON.stringify({ id: item.id, title, type }).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
    return `<article class="media-card" style="animation-delay:${Math.min(index * 35, 280)}ms">
      <button class="poster" type="button" data-media="${media}" style="--card-bg:${posterBackground}" aria-label="Ouvrir ${escapeHtml(title)} dans le lecteur">
        <span class="poster-wordmark">${escapeHtml(title)}</span>
        <span class="poster-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m8 5 11 7-11 7z"></path></svg></span>
      </button>
      <div class="card-meta"><span class="card-title">${escapeHtml(title)}</span><span class="card-year">${escapeHtml(getYear(item))}</span></div>
      <div class="card-subtitle">${escapeHtml(item.overview || (type === "tv" ? "Série · À découvrir" : "Film · À découvrir"))}</div>
    </article>`;
  }).join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function updateHeading() {
  const eyebrow = document.getElementById("section-eyebrow");
  const title = document.getElementById("section-title");
  const count = document.getElementById("catalogue-count");
  if (state.query) {
    eyebrow.textContent = "RÉSULTATS DE RECHERCHE";
    title.textContent = `Résultats pour « ${state.query} »`;
    count.textContent = "RECHERCHE";
  } else if (state.view === "movie") {
    eyebrow.textContent = "GRAND ÉCRAN";
    title.innerHTML = "Films à l’affiche<span>.</span>";
    count.textContent = "FILMS";
  } else if (state.view === "tv") {
    eyebrow.textContent = "À SUIVRE";
    title.innerHTML = "Séries à découvrir<span>.</span>";
    count.textContent = "SÉRIES";
  } else {
    eyebrow.textContent = "À DÉCOUVRIR";
    title.innerHTML = "Des histoires pour chaque humeur<span>.</span>";
    count.textContent = "SÉLECTION PLAYBOX";
  }
}

async function loadView() {
  const currentRequest = ++state.requestId;
  updateHeading();
  setStatus("");
  setLoading();
  if (!hasApiKey()) {
    renderCards(getDemoItems(state.view, state.query));
    setStatus("Catalogue de démonstration. Ajoutez votre clé TMDB dans config.js pour charger les titres en direct. Toute clé placée ici sera visible par les visiteurs du site.");
    return;
  }
  try {
    const items = await fetchCatalogue(state.view, state.query, currentRequest);
    if (items) renderCards(items);
  } catch (error) {
    if (currentRequest !== state.requestId) return;
    renderCards(getDemoItems(state.view, state.query));
    setStatus(`Impossible de charger le catalogue en direct : ${error.message} Affichage de la sélection de démonstration.`);
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
    nodeSelector.value = "0";
  }
  nodeSelector.addEventListener("change", () => {
    const selectedIndex = Number(nodeSelector.value);
    if (!Number.isInteger(selectedIndex) || !playerRuntime.servers[selectedIndex]) return;
    playerRuntime.currentIndex = selectedIndex;
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

  // Le sandbox bloque les pop-ups publicitaires, mais beaucoup de lecteurs refusent de
  // démarrer dans un iframe sandboxé. Il est donc désactivé par défaut : on l'active avec
  // le menu « Anti-pub », sauf pour les sources marquées sandbox: false dans config.js.
  const useSandbox = server.sandbox && adblockSelector && adblockSelector.value === "on";
  if (useSandbox) {
    playerFrame.setAttribute("sandbox", PLAYER_SANDBOX);
  } else {
    playerFrame.removeAttribute("sandbox");
  }
  playerFrame.setAttribute("allow", PLAYER_ALLOW);
  playerFrame.setAttribute("loading", "lazy");
  playerFrame.src = target.href;
  playerFrame.hidden = false;
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
  window.location.assign(url.href);
}

async function dismissSplashScreen() {
  const splash = document.getElementById("splash-screen");
  if (splash) {
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
}

async function initHomePage() {
  document.querySelectorAll(".nav-link").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelector(".nav-link.is-active")?.classList.remove("is-active");
      button.classList.add("is-active");
      state.view = button.dataset.view;
      state.query = "";
      searchInput.value = "";
      clearSearchButton.hidden = true;
      loadView();
    });
  });

  const searchForm = document.querySelector(".search-form");
  searchForm.addEventListener("submit", (event) => event.preventDefault());
  searchForm.addEventListener("click", (event) => {
    if (window.matchMedia("(max-width: 760px)").matches && event.target !== searchInput) {
      searchInput.focus();
    }
  });
  let searchTimer;
  searchInput.addEventListener("input", () => {
    state.query = searchInput.value.trim();
    clearSearchButton.hidden = !state.query;
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(loadView, 280);
  });
  clearSearchButton.addEventListener("click", () => {
    searchInput.value = "";
    state.query = "";
    clearSearchButton.hidden = true;
    loadView();
    searchInput.focus();
  });
  document.getElementById("explore-button").addEventListener("click", () => {
    document.querySelector(".catalogue-heading").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  catalogue.addEventListener("click", (event) => {
    const card = event.target.closest("[data-media]");
    if (card) openPlayer(JSON.parse(card.dataset.media));
  });

  const minimumSplashDuration = new Promise((resolve) => window.setTimeout(resolve, 1700));
  try {
    await loadView();
  } finally {
    await minimumSplashDuration;
    await dismissSplashScreen();
  }
}

function initPlayerPage() {
  playerFrame.removeAttribute("sandbox");
  playerFrame.setAttribute("allow", PLAYER_ALLOW);
  playerFrame.setAttribute("loading", "lazy");
  initializeSourceSelector();

  if (adblockSelector) {
    adblockSelector.value = localStorage.getItem("playbox:adblock") === "on" ? "on" : "off";
    adblockSelector.addEventListener("change", () => {
      localStorage.setItem("playbox:adblock", adblockSelector.value);
      if (playerRuntime.currentResource) loadTarget();
    });
  }

  if (langSelector) {
    const savedLang = localStorage.getItem("playbox:lang");
    const defaultLang = savedLang !== null ? savedLang : (getConfig().DEFAULT_SUB_LANG || "fr");
    if ([...langSelector.options].some((option) => option.value === defaultLang)) langSelector.value = defaultLang;
    langSelector.addEventListener("change", () => {
      localStorage.setItem("playbox:lang", langSelector.value);
      if (playerRuntime.currentResource) loadTarget();
    });
  }

  // Les lecteurs externes n'envoient pas "playbox:ready" : on se base sur la fin du chargement de l'iframe.
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

  document.title = `${title} — PlayBox`;
  document.getElementById("player-title").textContent = title;
  document.getElementById("player-subtitle").textContent = validType && type === "tv" ? "Série · Lecture en cours" : "Film · Lecture en cours";
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
    if (event.data !== "playbox:ready" && event.data?.type !== "playbox:ready") return;
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
    const show = await fetchTmdb(`/tv/${encodeURIComponent(id)}?language=fr-FR`);
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
    seasonSelect.value = String(seasons.some((season) => season.season_number === 1)
      ? 1
      : seasons[0].season_number);
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
    const data = await fetchTmdb(`/tv/${encodeURIComponent(id)}/season/${encodeURIComponent(seasonNumber)}?language=fr-FR`);
    if (requestId !== playerRuntime.selectionRequestId) return;
    const today = new Date().toISOString().slice(0, 10);
    const episodes = (data.episodes || []).filter((episode) =>
      Number.isInteger(episode.episode_number)
      && episode.episode_number > 0
      && (!episode.air_date || episode.air_date <= today)
    );
    playerRuntime.availableEpisodes = episodes.map((episode) => episode.episode_number);
    setSelectOptions(episodeSelect, episodes.map((episode) => ({
      value: episode.episode_number,
      label: `Épisode ${episode.episode_number}${episode.name ? ` · ${episode.name}` : ""}`
    })), "Aucun épisode disponible");

    if (!episodes.length) {
      updatePlayerStatus("Aucun épisode diffusé pour cette saison", true);
      showPlayerMessage("Aucun épisode disponible", "Cette saison ne contient pas encore d’épisode diffusé.", true);
      return;
    }

    episodeSelect.value = String(episodes[0].episode_number);
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

if (document.body.dataset.page === "player") {
  initPlayerPage();
} else {
  initHomePage();
}
