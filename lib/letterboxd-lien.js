// lib/letterboxd-lien.js — CinéMaison V2 (28/10/2026)
//
// Ajout d'un film à partir d'un lien Letterboxd partagé (ex. https://boxd.it/RTVm).
// Fonction portée depuis CinéRadar (même principe, adapté à CinéMaison).
//
// Ce fichier contient :
//  - des fonctions PURES (sans réseau, testées dans tests/letterboxd-lien.test.js),
//    utilisées côté serveur ET côté application :
//      extractLink, isAllowedUrl, parseFilmPath, titleFromSlug, parseFilmPage,
//      looksLikeLetterboxdLink, normaliserTexte, pickBestTmdbMatch ;
//  - resoudreLienLetterboxd(), la seule fonction qui fait des requêtes réseau,
//    appelée par api/add-film.js (action "resoudreLetterboxd", protégée par le
//    mot de passe) -- pas de nouvelle route : Vercel Hobby est limité à 12
//    fonctions.
//
// Sécurité : seuls boxd.it et letterboxd.com (en https) sont autorisés. Le
// serveur ne suit JAMAIS une redirection vers un autre site (chaque étape est
// revérifiée).

const ALLOWED_HOSTS = new Set(["boxd.it", "www.boxd.it", "letterboxd.com", "www.letterboxd.com"]);

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const MAX_HOPS = 4;
const TIMEOUT_MS = 8000;

// ─────────────────────────────────────────────────────────────
// Fonctions pures
// ─────────────────────────────────────────────────────────────

// Retrouve le premier lien boxd.it / letterboxd.com dans un texte collé
// (le partage Letterboxd ajoute parfois du texte autour du lien).
export function extractLink(text) {
  const match = String(text || "").match(/(?:https?:\/\/)?(?:www\.)?(?:boxd\.it|letterboxd\.com)\/[^\s"'<>]+/i);
  if (!match) return null;
  let link = match[0].replace(/[.,;:!?)\]]+$/, "");
  if (!/^https?:\/\//i.test(link)) link = `https://${link}`;
  return link.replace(/^http:\/\//i, "https://");
}

export function isAllowedUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ALLOWED_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

// À partir d'une adresse letterboxd.com déjà résolue : identifie la fiche film
// (slug) ou un lien direct /tmdb/{id}. Retourne null pour tout le reste
// (profil, liste, page de recherche...).
export function parseFilmPath(value) {
  try {
    const url = new URL(value);
    const film = url.pathname.match(/\/film\/([a-z0-9][a-z0-9-]*)(?:\/|$)/i);
    if (film) return { slug: film[1].toLowerCase() };
    const tmdb = url.pathname.match(/^\/tmdb\/(\d+)\/?$/);
    if (tmdb) return { tmdbId: Number(tmdb[1]) };
    return null;
  } catch {
    return null;
  }
}

// Letterboxd distingue les homonymes en ajoutant l'année au slug (ex.
// "dune-2021"). Sans ça, on retombe simplement sur le slug en clair.
export function titleFromSlug(slug) {
  let base = String(slug || "");
  let year = null;
  const withYear = base.match(/^(.*)-(\d{4})$/);
  if (withYear) {
    base = withYear[1];
    year = Number(withYear[2]);
  }
  return { title: base.replace(/-/g, " ").trim(), year };
}

function decodeEntities(str) {
  return String(str || "")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(Number(num)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function getMeta(html, property) {
  const a = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`, "i"));
  if (a) return decodeEntities(a[1]);
  const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`, "i"));
  return b ? decodeEntities(b[1]) : null;
}

// Extrait ce qu'on peut d'une fiche film Letterboxd : identifiant TMDb, titre
// et année. Chaque information est facultative : si Letterboxd change sa page,
// on renvoie simplement moins de choses plutôt que de planter.
export function parseFilmPage(html) {
  const source = String(html || "");

  let tmdbId = null;
  const typeMatch = source.match(/data-tmdb-type=["'](\w+)["']/i);
  if (!typeMatch || typeMatch[1].toLowerCase() === "movie") {
    const direct = source.match(/data-tmdb-id=["'](\d+)["']/i) || source.match(/themoviedb\.org\/movie\/(\d+)/i);
    if (direct) tmdbId = Number(direct[1]);
  }

  let title = null;
  let year = null;
  const ogTitle = getMeta(source, "og:title");
  const titleTag = source.match(/<title[^>]*>([^<]*)<\/title>/i);
  for (const candidate of [ogTitle, titleTag ? decodeEntities(titleTag[1]) : null]) {
    if (!candidate) continue;
    const m = candidate.match(/^(.*?)\s*\((\d{4})\)/);
    if (m && m[1].trim()) {
      title = m[1].trim();
      year = Number(m[2]);
      break;
    }
  }

  return { tmdbId, title, year };
}

// Le texte collé ressemble-t-il à un lien Letterboxd (court ou complet) ?
// Filtre rapide côté application avant d'appeler le serveur.
export function looksLikeLetterboxdLink(text) {
  return /(?:^|[\s/])(?:www\.)?(?:boxd\.it|letterboxd\.com)\/\S+/i.test(String(text || ""));
}

// Sans accents ni casse ni ponctuation : pour comparer deux titres.
export function normaliserTexte(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Parmi les résultats de /api/search-tmdb ({ titre, annee, tmdbId... }),
// retrouve le film désigné par un titre et une année Letterboxd. Titre
// identique exigé ; année identique préférée ; à un an près acceptée (la date
// de sortie diffère parfois d'un an entre Letterboxd et TMDb, ex. première en
// festival) seulement s'il n'y a qu'un candidat. Retourne null au moindre
// doute : mieux vaut laisser choisir dans la liste que se tromper de film.
export function pickBestTmdbMatch(results, title, year) {
  const wanted = normaliserTexte(title);
  if (!wanted) return null;
  const sameTitle = (results || []).filter((r) => normaliserTexte(r.titre) === wanted);
  if (sameTitle.length === 0) return null;
  const y = Number(year);
  if (!y) return sameTitle.length === 1 ? sameTitle[0] : null;
  const exact = sameTitle.find((r) => Number(r.annee) === y);
  if (exact) return exact;
  const close = sameTitle.filter((r) => Math.abs(Number(r.annee) - y) <= 1);
  return close.length === 1 ? close[0] : null;
}

// ─────────────────────────────────────────────────────────────
// Partie réseau (serveur uniquement)
// ─────────────────────────────────────────────────────────────

// Suit les redirections à la main pour pouvoir vérifier chaque étape : on ne
// va jamais ailleurs que sur boxd.it / letterboxd.com.
async function fetchAllowed(startUrl, fetchImpl) {
  let url = startUrl;
  for (let hop = 0; hop <= MAX_HOPS; hop++) {
    if (!isAllowedUrl(url)) throw new Error("redirection vers un site non autorisé");
    const res = await fetchImpl(url, {
      redirect: "manual",
      headers: { "User-Agent": USER_AGENT, "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new Error("redirection sans destination");
      url = new URL(location, url).href;
      continue;
    }
    return { res, url };
  }
  throw new Error("trop de redirections");
}

/**
 * Retrouve un film à partir d'un lien Letterboxd collé.
 * Retourne { status, body } (le code HTTP à renvoyer et le JSON) :
 *  200 { slug, letterboxdUrl, tmdbId, title, year, source }  source = "page" | "slug" | "tmdb"
 *  400 aucun lien reconnu · 422 pas une fiche film · 502 lecture impossible.
 * (Le 401 mauvais mot de passe est géré avant, par api/add-film.js.)
 */
export async function resoudreLienLetterboxd(link, fetchImpl = fetch) {
  const extracted = extractLink(link);
  if (!extracted) {
    return { status: 400, body: { error: "Aucun lien Letterboxd reconnu (boxd.it/… ou letterboxd.com/film/…)." } };
  }

  try {
    // 1) Résolution du lien (boxd.it → letterboxd.com/film/…)
    const first = await fetchAllowed(extracted, fetchImpl);
    const parsedPath = parseFilmPath(first.url);
    if (!parsedPath) {
      return { status: 422, body: { error: "Ce lien ne mène pas à une fiche de film Letterboxd." } };
    }

    // Lien direct /tmdb/{id} : l'identifiant est déjà connu, pas besoin de la page.
    if (parsedPath.tmdbId) {
      return {
        status: 200,
        body: {
          slug: null,
          letterboxdUrl: `https://letterboxd.com/tmdb/${parsedPath.tmdbId}/`,
          tmdbId: parsedPath.tmdbId,
          title: null,
          year: null,
          source: "tmdb",
        },
      };
    }

    const slug = parsedPath.slug;
    const filmUrl = `https://letterboxd.com/film/${slug}/`;

    // 2) Lecture de la fiche. La réponse de l'étape 1 est déjà la page du film
    // quand le lien pointait directement dessus (cas courant : boxd.it redirige
    // vers /film/{slug}/) : on la réutilise au lieu de la redemander. Si
    // Letterboxd refuse (blocage, panne...), on retombe sur ce qu'on déduit du
    // slug : l'application proposera alors une recherche à confirmer.
    let page = { tmdbId: null, title: null, year: null };
    let source = "slug";
    try {
      const alreadyOnFilmPage = new URL(first.url).pathname === `/film/${slug}/`;
      const filmRes = alreadyOnFilmPage ? first : await fetchAllowed(filmUrl, fetchImpl);
      if (filmRes.res.status === 200) {
        page = parseFilmPage(await filmRes.res.text());
        if (page.tmdbId || page.title) source = "page";
      }
    } catch {
      // volontairement ignoré : repli sur le slug (voir plus haut)
    }

    const guess = titleFromSlug(slug);
    return {
      status: 200,
      body: {
        slug,
        letterboxdUrl: filmUrl,
        tmdbId: page.tmdbId,
        title: page.title || guess.title,
        year: page.year || guess.year,
        source,
      },
    };
  } catch (e) {
    return { status: 502, body: { error: `Impossible de lire le lien Letterboxd (${e.message}).` } };
  }
}
