// config.js — PRINCE MOVIE
const CONFIG = {
  TMDB_KEY: "e407cf410cc9b42d9c439efe3f9bd2ff", // Clé API TMDB (visible par les visiteurs du site)

  // Langue par défaut des sous-titres demandés aux lecteurs (code ISO 639-1)
  DEFAULT_SUB_LANG: "fr",

  // Sources de lecture. Une simple URL suffit pour les lecteurs de type /embed/movie/ID.
  STREAM_SERVERS: [
    "https://vidsrc.sh",
    "https://vidsrc.to",
    "https://vidsrc.me",
    "https://vidsrc.in",
    // Source 5 : Vidzy (films et séries en français VF / VOSTFR, par identifiant TMDB).
    // "check" interroge Vidzy pour savoir si le titre existe avant de lancer la lecture.
    {
      name: "Vidzy (VF)",
      url: "https://vidzy.org",
      movie: "/movie/{id}",
      tv: "/serie/{id}/{season}/{episode}",
      lang: false,
      check: "https://vidzy.org/api/{id}"
    }
  ]
};
