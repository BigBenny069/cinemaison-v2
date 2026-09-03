// Résolution et lecture d'une fiche Letterboxd, exécutée directement
// depuis Vercel (Node), PAS depuis Apps Script.
//
// Contexte (CinéMaison V2, 03/09/2026) : quand chercherLetterboxd_
// (03_LETTERBOXD.gs) tourne via un déclencheur Apps Script (webhook
// immédiat ou cycle horaire), les requêtes vers Letterboxd échouent de
// façon reproductible — y compris après plusieurs tentatives espacées
// de plusieurs secondes — alors que la même URL, appelée depuis
// l'éditeur Apps Script (exécution manuelle) ou depuis n'importe quel
// autre poste, réussit systématiquement. Hypothèse retenue : les
// déclencheurs Google Apps Script tournent sur un pool d'adresses IP
// partagé entre tous les projets, plus facilement repéré et limité par
// la protection anti-robot de Letterboxd. Vercel utilise une
// infrastructure réseau différente, a priori non concernée par ce
// blocage.
//
// Ce module porte fidèlement la logique de 03_LETTERBOXD.gs
// (lirePageLetterboxd_, analyserPageLetterboxd_, extraireNoteLetterboxd_,
// extraireVotesLetterboxd_) en JavaScript/Node, pour être appelé
// directement depuis add-film.js et update-film.js — sans dépendre du
// tout d'Apps Script pour cette étape précise.

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function headersLetterboxd() {
  return {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7",
    "Cache-Control": "no-cache",
  };
}

// Reconnaît une URL Letterboxd exploitable : fiche déjà résolue
// (/film/...) ou lien de redirection connu (/tmdb/... ou /imdb/...).
// Même définition que estUrlLetterboxdManuelleAcceptableV452_ côté
// Apps Script.
export function estUrlLetterboxdExploitable(url) {
  return /letterboxd\.com\/(film|tmdb|imdb)\//i.test(String(url || ""));
}

// Résout UNE redirection (/tmdb/... ou /imdb/...) en lisant l'en-tête
// Location, sans suivre automatiquement — même raisonnement que
// resoudreRedirectionLetterboxdManuelleV454_ côté Apps Script : on
// veut ensuite refaire une requête DIRECTE vers l'URL résolue, avec nos
// propres en-têtes garantis, plutôt que de compter sur le suivi
// automatique d'un client HTTP.
async function resoudreRedirection(url) {
  const reponse = await fetch(url, {
    method: "GET",
    redirect: "manual",
    headers: headersLetterboxd(),
  });
  const code = reponse.status;
  const estRedirection = code >= 300 && code < 400;
  if (!estRedirection) {
    return null;
  }
  const location = reponse.headers.get("location");
  if (!location) {
    return null;
  }
  if (/^https?:\/\//i.test(location)) {
    return location;
  }
  return "https://letterboxd.com" + (location.startsWith("/") ? location : "/" + location);
}

// Isole le bloc <script type="application/ld+json"> du film lui-même
// (@type Movie ou TVSeries, avec aggregateRating) — même logique que
// extraireDonneesStructureesFilmLetterboxd_ côté Apps Script.
function extraireDonneesStructurees(html) {
  const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const donnees = JSON.parse(match[1]);
      const objets = Array.isArray(donnees) ? donnees : [donnees];
      for (const objet of objets) {
        const type = objet && objet["@type"];
        if (objet && (type === "Movie" || type === "TVSeries") && objet.aggregateRating) {
          return objet;
        }
      }
    } catch {
      continue;
    }
  }
  return null;
}

function extraireNote(html) {
  const structure = extraireDonneesStructurees(html);
  if (structure && structure.aggregateRating && structure.aggregateRating.ratingValue != null) {
    const n = Number(String(structure.aggregateRating.ratingValue).replace(",", "."));
    if (Number.isFinite(n)) return n;
  }
  // Repli : balise <meta name="twitter:data2" content="4.24 out of 5">,
  // présente sur les pages Letterboxd même quand le JSON-LD est absent
  // (constat du 03/09/2026 sur "Your Name.").
  const meta = html.match(
    /<meta[^>]+name=["']twitter:data2["'][^>]+content=["']([0-9]+(?:\.[0-9]+)?)\s*out of 5["']/i
  );
  if (meta) return Number(meta[1]);
  const libre = html.match(/"ratingValue"\s*:\s*"?([0-9]+(?:\.[0-9]+)?)"?/i);
  if (libre) return Number(libre[1]);
  return null;
}

function extraireVotes(html) {
  const structure = extraireDonneesStructurees(html);
  if (structure && structure.aggregateRating && structure.aggregateRating.ratingCount != null) {
    const n = Number(String(structure.aggregateRating.ratingCount).replace(/[,\s]/g, ""));
    if (Number.isFinite(n)) return n;
  }
  const libre = html.match(/"ratingCount"\s*:\s*"?([0-9,.\s]+)"?/i);
  if (libre) {
    const n = Number(libre[1].replace(/[,\s]/g, ""));
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function extraireUrlCanonique(html, urlDemandee) {
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  if (canonical && /letterboxd\.com\/film\//i.test(canonical[1])) return canonical[1];
  const ogUrl = html.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i);
  if (ogUrl && /letterboxd\.com\/film\//i.test(ogUrl[1])) return ogUrl[1];
  return urlDemandee;
}

/**
 * Point d'entrée principal. Retourne toujours un objet — jamais
 * d'exception non attrapée — pour que l'appelant puisse continuer
 * normalement (sans note/votes) en cas d'échec, exactement comme le
 * ferait le chemin Apps Script existant.
 *
 * Succès : { ok: true, url, note, votes }
 * Échec  : { ok: false, reason }
 */
export async function lireLetterboxd(urlDepart) {
  if (!estUrlLetterboxdExploitable(urlDepart)) {
    return { ok: false, reason: "URL non reconnue comme une fiche Letterboxd" };
  }

  let urlAUtiliser = urlDepart;
  if (/letterboxd\.com\/(tmdb|imdb)\//i.test(urlDepart)) {
    try {
      const resolue = await resoudreRedirection(urlDepart);
      if (resolue) urlAUtiliser = resolue;
    } catch {
      // Pas grave : on retente juste avec l'URL de départ ci-dessous
      // (fetch() suit les redirections par défaut).
    }
  }

  let reponse;
  try {
    reponse = await fetch(urlAUtiliser, {
      method: "GET",
      redirect: "follow",
      headers: headersLetterboxd(),
    });
  } catch (e) {
    return { ok: false, reason: "Erreur réseau : " + e.message };
  }

  if (!reponse.ok) {
    return { ok: false, reason: "HTTP " + reponse.status };
  }

  const html = await reponse.text();
  const urlCanonique = extraireUrlCanonique(html, urlAUtiliser);
  const pageValide = /letterboxd/i.test(html) && /\/film\//i.test(urlCanonique);
  if (!pageValide) {
    return { ok: false, reason: "Page reçue mais non reconnue comme une fiche film valide" };
  }

  const note = extraireNote(html);
  const votes = extraireVotes(html);

  return {
    ok: true,
    url: urlCanonique,
    note: note != null ? note : "PAS DE NOTE",
    votes: votes != null ? votes : "PAS DE VOTE",
  };
}
