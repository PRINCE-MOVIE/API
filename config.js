// config.js
const CONFIG = {
  TMDB_KEY: "e407cf410cc9b42d9c439efe3f9bd2ff", // Clé API OK
  // Langue par défaut des sous-titres demandés aux lecteurs (code ISO 639-1)
  DEFAULT_SUB_LANG: "fr",
  STREAM_SERVERS: [
    "https://cinesrc.st",
    "https://vidsrc.sh",
    "https://vidsrc.to",
    "https://vidsrc.me",
    "https://vidsrc.in",
    // Source 6 : Frembed (films et séries en français VF / VOSTFR).
    // Si le domaine change (il change souvent), modifie seulement "url" ci-dessous.
    {
      name: "Frembed (français)",
      url: "https://frembed.bar",
      movie: "/embed/movie/{id}",
      tv: "/embed/serie/{id}?sa={season}&epi={episode}",
      lang: false,
      // false = ne jamais utiliser le sandbox anti-pub pour cette source (Frembed reste blanc avec).
      sandbox: false
    }
  ]
};
