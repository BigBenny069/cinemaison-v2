// api/search-tmdb.js
//
// MODIFIÉ (26/10/2026) -- (1) recherche élargie : si le titre exact ne donne
// rien, essaie des titres plus courts (sans "#1", après un tiret ou deux-
// points...) ; (2) accepte aussi un identifiant ou un lien TMDb / IMDb collé
// à la place du titre ; (3) renvoie requeteUtilisee quand la recherche a été
// élargie, pour que l'app le dise.
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

// Mémoire pendant la vie de l'instance : évite de redemander le même film
// à TMDb à chaque lettre tapée.
const CACHE_REALISATEUR = new Map();

async function lireRealisateur(id, estSerie, apiKey) {
  const cle = (estSerie ? "tv" : "movie") + ":" + id;
  if (CACHE_REALISATEUR.has(cle)) return CACHE_REALISATEUR.get(cle);
  try {
    const url = estSerie
      ? `https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}&language=fr-FR`
      : `https://api.themoviedb.org/3/movie/${id}/credits?api_key=${apiKey}&language=fr-FR`;
    const rep = await fetch(url);
    if (!rep.ok) return null;
    const d = await rep.json();
    const noms = estSerie
      ? (d.created_by || []).map((p) => p.name)
      : (d.crew || []).filter((p) => p.job === "Director").map((p) => p.name);
    const texte = noms.filter(Boolean).slice(0, 2).join(", ") || null;
    if (CACHE_REALISATEUR.size > 500) CACHE_REALISATEUR.clear();
    CACHE_REALISATEUR.set(cle, texte);
    return texte;
  } catch (e) {
    return null;
  }
}

// Caractères d'écritures non latines (grec, cyrillique, arabe, hébreu, thaï,
// chinois/japonais/coréen...). Les accents et la ponctuation typographique
// (’ – …) ne comptent pas.
const NON_LATIN = /[\u0370-\u1DFF\u2E80-\uA4CF\uAC00-\uD7FF\uF900-\uFAFF]/;

/** Titre anglais d'un film/série (TMDb en-US), ou null si indisponible. */
async function lireTitreAnglais(id, estSerie, apiKey) {
  try {
    const url = `https://api.themoviedb.org/3/${estSerie ? "tv" : "movie"}/${id}?api_key=${apiKey}&language=en-US`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const d = await r.json();
    return (estSerie ? d.name : d.title) || null;
  } catch {
    return null;
  }
}

// NOUVEAU (26/10/2026) -- recherche élargie. Cas réel (FILM1393) : le titre
// de la plateforme Shadowz, "Les Dossiers Paranormaux - #1 La Femme à la
// Bouche Fendue", ne remontait rien sur TMDb (qui l'appelle autrement) ;
// Ben devait chercher le nom TMDb pour pouvoir ajouter le film.

/** Variantes plus courtes d'un titre de plateforme, de la plus probable à la
 *  moins probable (sans doublon, sans la requête d'origine). */
function genererVariantes(q) {
  const base = String(q || "").trim();
  const vus = new Set([base.toLowerCase()]);
  const sortie = [];
  const ajouter = (t) => {
    const v = String(t || "")
      .replace(/#\s*\d+/g, " ")                 // "#1"
      .replace(/\[[^\]]*\]|\([^)]*\)/g, " ")    // [Director's Cut], (2021)
      .replace(/\s+/g, " ")
      .replace(/^[\s\-–—:·.,]+|[\s\-–—:·.,]+$/g, "")
      .trim();
    if (v.length < 3 || vus.has(v.toLowerCase())) return;
    vus.add(v.toLowerCase());
    sortie.push(v);
  };
  // 1. même titre sans "#1", sans crochets/parenthèses
  ajouter(base);
  // 2. morceaux séparés par " - ", " – ", " : " (le plus long d'abord pour la
  //    fin, car le vrai titre du film vient souvent après la série/collection)
  const morceaux = base.split(/\s+[-–—]\s+|\s*:\s+/).map((m) => m.trim()).filter(Boolean);
  if (morceaux.length > 1) {
    ajouter(morceaux[morceaux.length - 1]);
    ajouter(morceaux[0]);
    morceaux.slice(1, -1).forEach(ajouter);
  }
  return sortie.slice(0, 4);
}

/** Reconnaît un identifiant ou un lien TMDb / IMDb collé dans la recherche. */
function lireIdentifiantColle(q) {
  const t = String(q || "").trim();
  let m = t.match(/themoviedb\.org\/(movie|tv)\/(\d{1,9})/i);
  if (m) return { source: "tmdb", id: m[2], type: m[1].toLowerCase() };
  m = t.match(/\b(tt\d{6,10})\b/i);
  if (m) return { source: "imdb", id: m[1].toLowerCase() };
  // Nombre seul : au moins 5 chiffres (sinon "1984" ou "1941", qui sont de
  // vrais titres de films, seraient pris pour un identifiant). Pour un petit
  // identifiant, écrire "tmdb:550".
  m = t.match(/^(?:tmdb\s*[:#]?\s*)(\d{1,9})$/i) || t.match(/^(\d{5,9})$/);
  if (m) return { source: "tmdb", id: m[1], type: null };
  return null;
}

export default async function handler(req, res) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "TMDB_API_KEY manquante côté serveur" });
  }

  const q = (req.query.q || "").toString().trim();
  if (q.length < 2) {
    return res.status(200).json({ results: [] });
  }

  // NOUVEAU (19/09/2026) -- Phase D (Étape 5) du chantier "Séparer
  // Catégorie et Statut dans Type". Avant, cette route ne cherchait
  // JAMAIS que dans /search/movie -- une série était donc TOUJOURS
  // introuvable ici, quelle que soit la catégorie choisie côté app
  // (constaté par Ben le 19/09/2026 : "Stuart Fails to Save the
  // Universe" introuvable alors qu'elle existe bien sur TMDb). Depuis
  // que l'écran Ajouter demande la catégorie EN PREMIER (avant même le
  // titre), l'app sait déjà si c'est une Série au moment de la
  // recherche -- ?type=Série bascule sur /search/tv, tout le reste
  // (Film/Documentaire/Spectacle -- des films au sens TMDb) reste sur
  // /search/movie comme avant.
  const type = (req.query.type || "").toString().trim();
  let estSerie = type === "Série";

  try {
    const cherche = async (texte) => {
      const url = estSerie
        ? `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&language=fr-FR&query=${encodeURIComponent(texte)}&include_adult=false`
        : `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=fr-FR&query=${encodeURIComponent(texte)}&include_adult=false`;
      const rep = await fetch(url);
      if (!rep.ok) throw new Error(`TMDb a répondu ${rep.status}`);
      const d = await rep.json();
      return (d.results || []).slice(0, 8);
    };

    // NOUVEAU (26/10/2026) -- identifiant ou lien TMDb/IMDb collé : on va
    // directement à la fiche, sans passer par le titre.
    let brut = [];
    let requeteUtilisee = q;
    const colle = lireIdentifiantColle(q);
    if (colle) {
      if (colle.type) estSerie = colle.type === "tv";
      let fiche = null;
      if (colle.source === "tmdb") {
        const rep = await fetch(`https://api.themoviedb.org/3/${estSerie ? "tv" : "movie"}/${colle.id}?api_key=${apiKey}&language=fr-FR`);
        if (rep.ok) fiche = await rep.json();
      } else {
        const rep = await fetch(`https://api.themoviedb.org/3/find/${colle.id}?api_key=${apiKey}&language=fr-FR&external_source=imdb_id`);
        if (rep.ok) {
          const d = await rep.json();
          const liste = estSerie ? d.tv_results : d.movie_results;
          fiche = (liste && liste[0]) || null;
        }
      }
      if (fiche && fiche.id) brut = [fiche];
    } else {
      brut = await cherche(q);
      // Rien trouvé : on retente avec des titres plus courts (voir
      // genererVariantes) jusqu'à avoir au moins un résultat.
      if (brut.length === 0) {
        for (const variante of genererVariantes(q)) {
          brut = await cherche(variante);
          if (brut.length > 0) { requeteUtilisee = variante; break; }
        }
      }
    }
    // /search/tv renvoie "name"/"first_air_date" au lieu de
    // "title"/"release_date" (mêmes noms de champs que l'app attend
    // dans les deux cas, une fois passés dans .map ci-dessous).
    // NOUVEAU (18/10/2026) -- ajoute le réalisateur à côté de l'année
    // (demandé par Ben, pour distinguer les films de même titre). La
    // recherche TMDb ne le fournit pas : un appel de détail par résultat,
    // en parallèle. Film -> réalisateur(s) (crédits) ; série -> créateur(s).
    // Un échec sur un résultat n'empêche jamais d'afficher la liste
    // (realisateur = null).
    const realisateurs = await Promise.all(brut.map((r) => lireRealisateur(r.id, estSerie, apiKey)));
    // NOUVEAU (25/10/2026) -- TMDb renvoie le titre ORIGINAL (japonais,
    // coréen, russe...) quand il n'existe pas de titre français. Cas réel :
    // "House of Sayuri" ajouté sous son titre japonais (FILM1388). Pour
    // chaque résultat dont le titre est en caractères non latins, on prend
    // le titre ANGLAIS de TMDb (un appel de détail en en-US) ; s'il échoue
    // ou reste non latin, on garde le titre d'origine.
    const titresAffiches = await Promise.all(brut.map(async (r) => {
      const titre = estSerie ? r.name : r.title;
      if (!NON_LATIN.test(titre || "")) return titre;
      const anglais = await lireTitreAnglais(r.id, estSerie, apiKey);
      return anglais && !NON_LATIN.test(anglais) ? anglais : titre;
    }));
    const results = brut.map((r, i) => ({
      titre: titresAffiches[i],
      annee: (estSerie ? r.first_air_date : r.release_date) ? (estSerie ? r.first_air_date : r.release_date).slice(0, 4) : null,
      affiche: r.poster_path ? `https://image.tmdb.org/t/p/w92${r.poster_path}` : null,
      tmdbId: r.id,
      realisateur: realisateurs[i],
    }));
    return res.status(200).json({ results, requeteUtilisee: requeteUtilisee !== q ? requeteUtilisee : null });
  } catch (e) {
    const msg = e.message || "Erreur de recherche TMDb";
    return res.status(/^TMDb a répondu/.test(msg) ? 502 : 500).json({ error: msg });
  }
}
