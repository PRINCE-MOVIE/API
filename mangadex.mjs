// api/mangadex.mjs — PRINCE MOVIE
// Petit relais vers MangaDex. Son API n'autorise pas les appels directs depuis un autre site
// (pas d'en-têtes CORS) : le navigateur appelle donc /api/mangadex sur TON site, et c'est ce
// fichier qui interroge MangaDex côté serveur.
//   /api/mangadex?path=/manga&limit=24…   -> données JSON (liste, fiche, chapitres, pages)
//   /api/mangadex?img=https://…           -> image (couverture ou page), en secours seulement

const API = "https://api.mangadex.org";
const USER_AGENT = "PrinceMovie/1.0";
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const ALLOWED_PATHS = [
  /^\/manga$/,
  new RegExp(`^/manga/${UUID}$`, "i"),
  new RegExp(`^/manga/${UUID}/feed$`, "i"),
  new RegExp(`^/at-home/server/${UUID}$`, "i")
];
const IMAGE_HOST = /^(uploads\.mangadex\.org|([a-z0-9-]+\.)+mangadex\.network)$/i;
// Contenu tout public uniquement, quoi que demande le navigateur.
const SAFE_RATINGS = ["safe", "suggestive"];

function fail(res, status, detail) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.send(JSON.stringify({ result: "error", errors: [{ detail }] }));
}

async function relayImage(raw, res) {
  let target;
  try { target = new URL(raw); } catch { return fail(res, 400, "Adresse d’image invalide."); }
  if (target.protocol !== "https:" || !IMAGE_HOST.test(target.hostname)) {
    return fail(res, 400, "Image non autorisée.");
  }
  const upstream = await fetch(target, { headers: { "User-Agent": USER_AGENT } });
  if (!upstream.ok) return res.status(upstream.status).end();
  const type = upstream.headers.get("content-type") || "";
  if (!type.startsWith("image/")) return fail(res, 415, "Ce n’est pas une image.");
  const body = Buffer.from(await upstream.arrayBuffer());
  res.setHeader("Content-Type", type);
  res.setHeader("Cache-Control", target.hostname === "uploads.mangadex.org"
    ? "public, max-age=86400, s-maxage=86400"
    : "public, max-age=3600");
  res.status(200).send(body);
}

export default async function handler(req, res) {
  if (req.method !== "GET") return fail(res, 405, "Méthode non autorisée.");
  try {
    const incoming = new URL(req.url, "http://localhost");
    const img = incoming.searchParams.get("img");
    if (img) return await relayImage(img, res);

    const path = incoming.searchParams.get("path") || "";
    if (!ALLOWED_PATHS.some((rule) => rule.test(path))) return fail(res, 400, "Chemin non autorisé.");

    const url = new URL(API + path);
    incoming.searchParams.forEach((value, key) => {
      if (key !== "path" && key !== "contentRating[]") url.searchParams.append(key, value);
    });
    if (path === "/manga" || path.endsWith("/feed")) {
      SAFE_RATINGS.forEach((rating) => url.searchParams.append("contentRating[]", rating));
    }

    const upstream = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } });
    const text = await upstream.text();

    // Une fiche classée érotique ou pornographique n'est jamais renvoyée.
    if (upstream.ok && /^\/manga\/[0-9a-f-]{36}$/i.test(path)) {
      try {
        const rating = JSON.parse(text).data.attributes.contentRating;
        if (rating && !SAFE_RATINGS.includes(rating)) return fail(res, 404, "Contenu non disponible.");
      } catch { /* réponse inattendue : on la transmet telle quelle */ }
    }

    const retryAfter = upstream.headers.get("retry-after");
    if (retryAfter) res.setHeader("Retry-After", retryAfter);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    // Le cache évite de redemander les mêmes listes à MangaDex (limite d'environ 5 requêtes par seconde).
    res.setHeader("Cache-Control", upstream.ok && !path.startsWith("/at-home")
      ? "public, max-age=60, s-maxage=300, stale-while-revalidate=900"
      : "no-store");
    res.status(upstream.status).send(text);
  } catch (error) {
    fail(res, 502, "MangaDex est injoignable pour le moment.");
  }
}
