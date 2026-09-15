// scripts/resoudre-letterboxd.js — CinéMaison
//
// Résout les liens Letterboxd bloqués (letterboxd.com/tmdb/ID ou
// /imdb/ttID) vers leur vraie URL (letterboxd.com/film/...).
//
// Conçu pour tourner UNIQUEMENT via GitHub Actions -- découverte du
// 15/09/2026 (confirmée en comparant avec le projet CinéRadar, qui
// fait exactement ce même type de requête sans jamais être bloqué) :
// Letterboxd bloque le trafic venant des infrastructures serverless
// partagées (Google Apps Script, Vercel), mais pas (ou beaucoup moins)
// celui de GitHub Actions. On a déjà tenté de résoudre ce blocage
// depuis Apps Script (03_LETTERBOXD.gs, jusqu'à 4 tentatives) et
// depuis Vercel (lib/letterboxd.js, jusqu'à 3 tentatives) -- les deux
// échouent de façon persistante sur les liens /tmdb/ et /imdb/ malgré
// tout, ce n'est donc pas un problème de nombre de tentatives mais bien
// d'origine réseau.
//
// Volontairement simple : une requête HTTP classique avec un
// User-Agent de navigateur (même technique que CinéRadar), rien de
// plus -- pas de navigateur piloté, pas de session, pas de cookie. Ne
// récupère PAS la note/les votes Letterboxd : une fois l'URL réécrite
// en /film/..., le mécanisme Apps Script existant (03_LETTERBOXD.gs)
// s'en charge tout seul au prochain passage, exactement comme quand
// Ben colle l'URL à la main aujourd'hui.

const API_BASE = "https://cinemaison-v2.vercel.app";
const MOT_DE_PASSE = process.env.CINEMAISON_PASSWORD || "";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const PAUSE_ENTRE_REQUETES_MS = 1500;

async function chargerFilmsAResoudre_() {
  const reponse = await fetch(API_BASE + "/api/get-films");
  if (!reponse.ok) throw new Error("HTTP " + reponse.status + " en récupérant api/get-films");
  const films = await reponse.json();
  return films.filter((f) => /letterboxd\.com\/(tmdb|imdb)\//i.test(f.urlLetterboxd || ""));
}

/**
 * Une requête HTTP classique, avec suivi automatique des redirections
 * -- confirmé par le diagnostic Apps Script du 15/09/2026 (302 propre,
 * Location: /film/...) : la redirection elle-même fonctionne, seul le
 * TRAFIC AUTOMATISÉ GOOGLE/VERCEL se fait bloquer. response.url donne
 * directement l'adresse finale après redirection, sans avoir besoin de
 * lire le contenu de la page.
 */
async function resoudreUrl_(url) {
  const reponse = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    redirect: "follow",
  });
  if (!reponse.ok) return null;
  const urlFinale = reponse.url;
  if (/letterboxd\.com\/film\//i.test(urlFinale)) return urlFinale;
  return null;
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
    process.stdout.write("[" + (i + 1) + "/" + films.length + "] " + f.titre + " (" + f.urlLetterboxd + ") ... ");
    try {
      const urlResolue = await resoudreUrl_(f.urlLetterboxd);
      if (urlResolue) {
        console.log("OK -> " + urlResolue);
        misesAJour.push({ id: f.id, url: urlResolue });
      } else {
        console.log("pas résolu cette fois (retenté au prochain passage)");
        echecs.push(f.titre);
      }
    } catch (e) {
      console.log("erreur : " + e.message);
      echecs.push(f.titre);
    }
    await new Promise(function (r) { setTimeout(r, PAUSE_ENTRE_REQUETES_MS); });
  }

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
