// scripts/resoudre-letterboxd.js — CinéMaison
//
// V2 (16/09/2026) — changement de méthode complet.
//
// La V1 (15/09/2026) suivait le lien Letterboxd /tmdb/ID/ ou /imdb/ttID/
// déjà enregistré sur la fiche. Testée en conditions réelles le
// 16/09/2026 : 0 réussite sur 5, même depuis GitHub Actions -- preuve
// que ce n'est PAS une question d'infrastructure (Vercel/Apps
// Script/GitHub Actions), mais bien le lien /tmdb/ et /imdb/
// lui-même qui est spécifiquement et fortement surveillé par
// Letterboxd, sur toutes les infrastructures -- probablement parce que
// c'est exactement le type de lien utilisé par les outils externes
// pour cataloguer en masse (confirmé par un fil de discussion externe
// sur un outil tiers, "Kometa", rencontrant le même blocage).
//
// Nouvelle méthode (V2) : reproduit fidèlement
// rechercherLetterboxdViaSlug_ (03_LETTERBOXD.gs), déjà utilisée par
// la "recherche automatique" Apps Script et documentée comme fiable
// (contrairement au chemin par lien /tmdb/) -- deviner directement
// l'URL /film/{titre-normalisé}/ (et /film/{titre-normalisé}-{année}/
// en repli) à partir du titre, sans jamais passer par un lien de
// redirection. Une requête vers une page de film normale, exactement
// comme un visiteur qui tape le nom -- pas vers un endpoint de
// résolution d'ID.
//
// Ne récupère toujours PAS la note/les votes ici -- une fois l'URL
// réécrite en /film/..., le mécanisme Apps Script existant
// (03_LETTERBOXD.gs) s'en charge tout seul au prochain passage.

import { candidatsLetterboxd } from "../lib/letterboxd-slugs.js";

const API_BASE = "https://cinemaison-v2.vercel.app";
const MOT_DE_PASSE = process.env.CINEMAISON_PASSWORD || "";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const PAUSE_ENTRE_FILMS_MS = 1500;
const PAUSE_ENTRE_CANDIDATS_MS = 300;

/** Même algorithme que slugLetterboxd_ (03_LETTERBOXD.gs). */
function slugifier_(texte) {
  return String(texte || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Pour comparer deux titres sans être sensible aux tirets/espaces. */
function normaliserTexte_(texte) {
  return slugifier_(texte).replace(/-/g, " ").trim();
}

async function chargerFilmsAResoudre_() {
  const reponse = await fetch(API_BASE + "/api/get-films");
  if (!reponse.ok) throw new Error("HTTP " + reponse.status + " en récupérant api/get-films");
  const films = await reponse.json();
  return films.filter(function (f) {
    return /letterboxd\.com\/(tmdb|imdb)\//i.test(f.urlLetterboxd || "");
  });
}

/** Même patterns que extraireTitreLetterboxd_ (03_LETTERBOXD.gs). */
function extraireTitrePage_(html) {
  const patterns = [
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    /"name"\s*:\s*"([^"]+)"/i,
    /<title>([^<]+)<\/title>/i,
  ];
  for (let i = 0; i < patterns.length; i++) {
    const m = html.match(patterns[i]);
    if (m && m[1]) {
      return m[1]
        .replace(/&amp;/g, "&")
        .replace(/&#039;/g, "'")
        .replace(/\s*[([]\d{4}[)\]]\s*/g, " ")
        .replace(/\s*[•\-|]\s*Letterboxd.*$/i, "")
        .replace(/\s+/g, " ")
        .trim();
    }
  }
  return "";
}

/** Même patterns que extraireAnneeLetterboxd_ (03_LETTERBOXD.gs). */
function extraireAnneePage_(html) {
  const patterns = [
    /"datePublished"\s*:\s*"(\d{4})/i,
    /<meta[^>]+property=["']og:title["'][^>]+content=["'][^"']*\((\d{4})\)/i,
    /\/films\/year\/(\d{4})\//i,
  ];
  for (let i = 0; i < patterns.length; i++) {
    const m = html.match(patterns[i]);
    if (m && m[1]) return m[1];
  }
  return "";
}

let requetesBloquees_ = 0;

async function essayerCandidat_(url) {
  try {
    const reponse = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!reponse.ok) {
      if (reponse.status === 403 || reponse.status === 429) requetesBloquees_++;
      return null;
    }
    const html = await reponse.text();
    if (!/letterboxd/i.test(html)) return null;
    return {
      titrePage: extraireTitrePage_(html),
      anneePage: extraireAnneePage_(html),
      urlFinale: reponse.url,
    };
  } catch (e) {
    return null;
  }
}

/** Même logique que pageCorrespondAuFilmLetterboxd_ (03_LETTERBOXD.gs). */
function pageCorrespond_(infos, titre, annee) {
  if (!infos || !infos.titrePage) return false;
  const cible = normaliserTexte_(titre);
  const page = normaliserTexte_(infos.titrePage);
  if (!cible || !page) return false;
  const titreCompatible = page === cible || page.includes(cible) || cible.includes(page);
  if (!titreCompatible) return false;
  if (annee && infos.anneePage) {
    if (Math.abs(Number(annee) - Number(infos.anneePage)) > 1) return false;
  }
  return true;
}

/**
 * Devine l'URL /film/{slug}/ à partir de TOUS les titres connus du film
 * (français, original, anglais et alternatifs TMDb), chacun avec et sans
 * année (année, année-1, année+1). Letterboxd utilise le titre international
 * (souvent anglais) : l'ancienne méthode, limitée au titre français puis au
 * titre original, ratait par exemple « Kaïro » (page « pulse-2001 »).
 */
async function resoudreParSlug_(titre, annee, titreOriginal, titresTmdb) {
  const titres = [titre, titreOriginal].concat(titresTmdb || []).filter(Boolean);
  const candidats = candidatsLetterboxd(titres, annee);
  for (let i = 0; i < candidats.length; i++) {
    const infos = await essayerCandidat_(candidats[i].url);
    if (infos && pageCorrespond_(infos, candidats[i].titre, annee)) {
      return infos.urlFinale;
    }
    if (i < candidats.length - 1) {
      await new Promise(function (r) { setTimeout(r, PAUSE_ENTRE_CANDIDATS_MS); });
    }
  }
  return null;
}

/** Autres titres du film (anglais, alternatifs) via TMDb, [] si indisponible. */
async function lireTitresTmdb_(f) {
  if (!f.tmdbId) return [];
  try {
    const type = /s[ée]rie/i.test(f.type || "") ? "tv" : "movie";
    const r = await fetch(API_BASE + "/api/titres-tmdb?id=" + encodeURIComponent(f.tmdbId) + "&type=" + type);
    if (!r.ok) return [];
    const d = await r.json();
    return Array.isArray(d.titres) ? d.titres : [];
  } catch (e) {
    return [];
  }
}

async function envoyerMisesAJourEnLot_(misesAJour) {
  if (misesAJour.length === 0) return { cellulesEcrites: 0 };
  const updates = misesAJour.map(function (u) {
    return { id: u.id, fields: { urlLetterboxd: u.url } };
  });
  const reponse = await fetch(API_BASE + "/api/update-film", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: MOT_DE_PASSE, updates: updates }),
  });
  const corps = await reponse.json().catch(function () { return {}; });
  if (!reponse.ok) throw new Error("HTTP " + reponse.status + " : " + (corps.error || "erreur inconnue"));
  return corps;
}

async function main() {
  if (!MOT_DE_PASSE) {
    console.log("CINEMAISON_PASSWORD non configuré (secret GitHub Actions manquant) -- arrêt.");
    process.exit(1);
  }

  console.log("Récupération des fiches à résoudre (api/get-films)...");
  const films = await chargerFilmsAResoudre_();
  console.log(films.length + " fiche(s) avec un lien Letterboxd non résolu (/tmdb/ ou /imdb/).\n");

  if (films.length === 0) {
    console.log("Rien à faire.");
    return;
  }

  const misesAJour = [];
  const echecs = [];

  for (let i = 0; i < films.length; i++) {
    const f = films[i];
    process.stdout.write("[" + (i + 1) + "/" + films.length + "] " + f.titre + " (" + f.annee + ") ... ");
    try {
      const titresTmdb = await lireTitresTmdb_(f);
      const urlResolue = await resoudreParSlug_(f.titre, f.annee, f.titreOriginal, titresTmdb);
      if (urlResolue) {
        console.log("OK -> " + urlResolue);
        misesAJour.push({ id: f.id, url: urlResolue });
      } else {
        console.log("pas trouvé cette fois (retenté au prochain passage)");
        echecs.push(f.titre);
      }
    } catch (e) {
      console.log("erreur : " + e.message);
      echecs.push(f.titre);
    }
    await new Promise(function (r) { setTimeout(r, PAUSE_ENTRE_FILMS_MS); });
  }

  if (requetesBloquees_ > 0) console.log("\nAttention : " + requetesBloquees_ + " requête(s) refusée(s) par Letterboxd (403/429) -- blocage anti-robot probable, retentera au prochain passage.");
  console.log("\n" + misesAJour.length + " URL(s) résolue(s), " + echecs.length + " échec(s) cette fois.");

  if (misesAJour.length > 0) {
    console.log("\nÉcriture dans le Sheet (api/update-film)...");
    const resultat = await envoyerMisesAJourEnLot_(misesAJour);
    console.log("OK : " + resultat.cellulesEcrites + " cellule(s) mise(s) à jour.");
  }
}

main().catch(function (e) {
  console.error("Erreur :", e);
  process.exit(1);
});
