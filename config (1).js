// config.js — PRINCE MOVIE
const CONFIG = {
  TMDB_KEY: "e407cf410cc9b42d9c439efe3f9bd2ff", // Clé API TMDB (visible par les visiteurs du site)

  // Administrateurs : seuls ces e-mails voient le nombre d'utilisateurs dans le site.
  ADMIN_EMAILS: ["yolandalabaston@gmail.com"],

  // Comptes en ligne (voir LISEZMOI.md). Laissez vide pour le mode démo local.
  // Collez ici l'objet firebaseConfig de votre projet Firebase.
  FIREBASE: {
    apiKey: "AIzaSyDZkVWTgFCNmMoCyu38m1mUwRAamdG8k80",
    authDomain: "prince-movie.firebaseapp.com",
    projectId: "prince-movie",
    storageBucket: "prince-movie.firebasestorage.app",
    messagingSenderId: "194045849774",
    appId: "1:194045849774:web:7d0024e29e63df45577d3f"
  },

  // Langue par défaut des sous-titres demandés aux lecteurs (code ISO 639-1)
  DEFAULT_SUB_LANG: "fr",

  // Sources de lecture. Une simple URL suffit pour les lecteurs de type /embed/movie/ID.
  // PUBLICITÉS : par défaut le lecteur est « sandboxé » (pop-ups bloqués).
  //   sandbox: false  → la source garde ses publicités (c'est le cas des sources 1, 2, 3, 4, 6 et 7)
  //   (pas de sandbox:false) → publicités bloquées (source 5 : Vidzy uniquement)
  STREAM_SERVERS: [
    { name: "VidSrc SH", url: "https://vidsrc.sh", sandbox: false },
    { name: "VidSrc TO", url: "https://vidsrc.to", sandbox: false },
    { name: "VidSrc ME", url: "https://vidsrc.me", sandbox: false },
    { name: "VidSrc IN", url: "https://vidsrc.in", sandbox: false },
    // Source 5 : Vidzy (films et séries en français VF / VOSTFR, par identifiant TMDB).
    // SANS publicités : on ne met pas sandbox:false ici.
    {
      name: "Vidzy (VF)",
      url: "https://vidzy.org",
      movie: "/movie/{id}",
      tv: "/serie/{id}/{season}/{episode}",
      lang: false,
      check: "https://vidzy.org/api/{id}"
    },
    // Source 6 : source FRANÇAISE (VF). Les domaines de ce type de service changent souvent :
    // si elle ne répond plus, remplacez seulement "url" par l'adresse actuelle du service.
    {
      name: "Frembed (FR)",
      url: "https://frembed.work",
      movie: "/api/film.php?id={id}",
      tv: "/api/serie.php?id={id}&sa={season}&epi={episode}",
      lang: false,
      sandbox: false
    },
    // Source 7 : source ANGLAISE (VO / sous-titres), presque tout le catalogue TMDB.
    {
      name: "VidFast (EN)",
      url: "https://vidfast.vc",
      movie: "/movie/{id}",
      tv: "/tv/{id}/{season}/{episode}",
      lang: false,
      sandbox: false
    }
  ]
};
