// api/search-tmdb.js
//
// Nouvelle route à ajouter dans ton projet Vercel, dans le dossier /api à
// côté de tes autres routes existantes (add-film.js, update-film.js,
// delete-film.js, get-films.js). Elle interroge TMDb en direct pour la
// recherche à l'écriture dans "Ajouter" (autocomplete titre/année/affiche).
//
// PRÉREQUIS À FAIRE TOI-MÊME AVANT DE DÉPLOYER :
// 1. Vérifie que la variable d'environnement TMDB_API_KEY existe déjà dans
//    Vercel (Project Settings > Environment Variables) — c'est très
//    probablement la même clé que ton script Apps Script d'enrichissement
//    utilise déjà côté TMDb, mais elle doit être ajoutée séparément côté
//    Vercel puisque Apps Script et Vercel ne partagent pas leurs variables.
//    Si tu ne l'as pas encore, crée une clé gratuite sur
//    https://www.themoviedb.org/settings/api puis ajoute-la sous le nom
//    exact TMDB_API_KEY dans Vercel, puis redéploie.
// 2. Dépose ce fichier tel quel dans api/search-tmdb.js sur GitHub.
// 3. Vercel redéploiera automatiquement (comme pour App.tsx).
//
// Cette route ne modifie jamais le Sheet — elle ne fait que relayer une
// recherche TMDb en lecture seule, aucun mot de passe n'est donc requis
// (contrairement à add-film/update-film/delete-film).

export default async function handler(req, res) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "TMDB_API_KEY manquante côté serveur" });
  }

  const q = (req.query.q || "").toString().trim();
  if (q.length < 2) {
    return res.status(200).json({ results: [] });
  }

  try {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=fr-FR&query=${encodeURIComponent(q)}&include_adult=false`;
    const tmdbRes = await fetch(url);
    if (!tmdbRes.ok) {
      return res.status(502).json({ error: `TMDb a répondu ${tmdbRes.status}` });
    }
    const data = await tmdbRes.json();
    const results = (data.results || []).slice(0, 8).map((r) => ({
      titre: r.title,
      annee: r.release_date ? r.release_date.slice(0, 4) : null,
      affiche: r.poster_path ? `https://image.tmdb.org/t/p/w92${r.poster_path}` : null,
      tmdbId: r.id,
    }));
    return res.status(200).json({ results });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Erreur de recherche TMDb" });
  }
}
