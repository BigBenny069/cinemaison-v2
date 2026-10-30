// api/titres-tmdb.js — CinéMaison V2 (30/10/2026)
//
// Lecture seule : renvoie les différents titres d'un film sur TMDb (anglais,
// original, titres alternatifs en écriture latine). Utilisé par
// scripts/resoudre-letterboxd.js pour deviner la page Letterboxd, qui porte
// presque toujours le titre international (anglais).
// GET /api/titres-tmdb?id=27324&type=movie  ->  { titres: ["Pulse", ...] }
// Aucun mot de passe (ne modifie rien, comme search-tmdb.js).

const NON_LATIN = /[Ͱ-᷿⺀-꓏가-퟿豈-﫿]/;
const CACHE = new Map();

export default async function handler(req, res) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "TMDB_API_KEY manquante côté serveur" });

  const id = String(req.query.id || "").replace(/\D/g, "");
  const serie = String(req.query.type || "").toLowerCase() === "tv";
  if (!id) return res.status(400).json({ error: "id manquant" });

  const cle = (serie ? "tv:" : "movie:") + id;
  if (CACHE.has(cle)) return res.status(200).json({ titres: CACHE.get(cle) });

  const base = "https://api.themoviedb.org/3/" + (serie ? "tv" : "movie") + "/" + id;
  const titres = [];
  const ajouter = (t) => {
    const v = String(t || "").trim();
    if (v && !NON_LATIN.test(v) && !titres.some((x) => x.toLowerCase() === v.toLowerCase())) titres.push(v);
  };
  try {
    const [en, alt] = await Promise.all([
      fetch(base + "?api_key=" + apiKey + "&language=en-US").then((r) => (r.ok ? r.json() : null)),
      fetch(base + "/alternative_titles?api_key=" + apiKey).then((r) => (r.ok ? r.json() : null)),
    ]);
    if (en) {
      ajouter(serie ? en.name : en.title);
      ajouter(serie ? en.original_name : en.original_title);
    }
    const liste = (alt && (alt.titles || alt.results)) || [];
    // Pays anglophones d'abord : ce sont eux que Letterboxd reprend le plus.
    for (const pays of ["US", "GB", "CA", "AU"]) {
      liste.filter((x) => x.iso_3166_1 === pays).forEach((x) => ajouter(x.title));
    }
    const resultat = titres.slice(0, 6);
    if (CACHE.size > 500) CACHE.clear();
    if (resultat.length) CACHE.set(cle, resultat);
    return res.status(200).json({ titres: resultat });
  } catch (e) {
    return res.status(502).json({ error: "TMDb injoignable" });
  }
}
