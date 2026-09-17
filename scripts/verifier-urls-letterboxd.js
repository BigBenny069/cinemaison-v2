// scripts/verifier-urls-letterboxd.js — CinéMaison
//
// NOUVEAU (16/09/2026) — audit ponctuel (déclenchement manuel
// uniquement, pas de cron) des URL Letterboxd DÉJÀ résolues (celles en
// "/film/...", pas celles encore en "/tmdb/" ou "/imdb/" -- celles-là
// ont déjà leur propre mécanisme via resoudre-letterboxd.js). But :
// repérer les fiches où l'URL enregistrée ne correspond plus au bon
// film -- découvert le 16/09/2026 sur "Les Seigneurs de Dogtown", dont
// l'URL pointait vers la page Letterboxd de "Canines".
//
// Réutilise exactement la même logique de correspondance titre/année
// que resoudre-letterboxd.js (pageCorrespond_ etc., dupliquée ici à
// l'identique plutôt que factorisée -- même choix que le reste du
// projet entre scripts GitHub Actions) : tout ce qui est signalé ici
// est une fiche qui NE PASSERAIT PLUS ce contrôle si elle était résolue
// aujourd'hui.
//
// Ne corrige RIEN automatiquement -- envoie la liste par mail (via
// api/rapport-verification-letterboxd.js -> webhook Apps Script) pour
// vérification et correction manuelle. Volontairement prudent : une
// correspondance ratée par erreur (faux positif) ne doit jamais écraser
// une bonne URL toute seule.
//
// Peut prendre plusieurs dizaines de minutes sur l'ensemble du
// catalogue (une requête Letterboxd par fiche déjà résolue, avec la
// même pause anti-blocage que resoudre-letterboxd.js) -- normal, c'est
// un contrôle de fond, pas un script à lancer souvent.

const API_BASE = "https://cinemaison-v2.vercel.app";
const MOT_DE_PASSE = process.env.CINEMAISON_PASSWORD || "";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const PAUSE_ENTRE_FILMS_MS = 1500;

/** Même algorithme que slugifier_ (resoudre-letterboxd.js / slugLetterboxd_ dans 03_LETTERBOXD.gs). */
function normaliserTexte_(texte) {
  return String(texte || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function chargerFilmsResolus_() {
  const reponse = await fetch(API_BASE + "/api/get-films");
  if (!reponse.ok) throw new Error("HTTP " + reponse.status + " en récupérant api/get-films");
  const films = await reponse.json();
  return films.filter(function (f) {
    return /letterboxd\.com\/film\//i.test(f.urlLetterboxd || "") && f.titre;
  });
}

/** Même patterns que extraireTitrePage_ (resoudre-letterboxd.js / 03_LETTERBOXD.gs). */
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

/** Même patterns que extraireAnneePage_ (resoudre-letterboxd.js / 03_LETTERBOXD.gs). */
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

/** Même logique que pageCorrespond_ (resoudre-letterboxd.js) -- inversée :
 * ici on part de la page DÉJÀ enregistrée, pas d'un candidat qu'on teste. */
function pageCorrespond_(titrePage, anneePage, titreAttendu, anneeAttendue) {
  const cible = normaliserTexte_(titreAttendu);
  const page = normaliserTexte_(titrePage);
  if (!cible || !page) return false;
  const titreCompatible = page === cible || page.includes(cible) || cible.includes(page);
  if (!titreCompatible) return false;
  if (anneeAttendue && anneePage) {
    if (Math.abs(Number(anneeAttendue) - Number(anneePage)) > 1) return false;
  }
  return true;
}

/** Même regex que extraireTmdbId (lib/letterboxd.js), qui l'utilise
 * déjà pour retrouver le lien "TMDB" présent en bas de toute fiche
 * Letterboxd normale ("More at IMDb TMDB"). Comparer des ID plutôt que
 * des titres élimine le principal défaut de la méthode précédente :
 * Letterboxd affiche presque toujours le titre en langue originale
 * (souvent l'anglais), donc comparer au titre français stocké en
 * Sheet produisait énormément de faux positifs même pour des URL
 * parfaitement correctes ("La Liste de Schindler" vs "Schindler's
 * List"). Un ID TMDb, lui, ne dépend d'aucune langue. */
function extraireTmdbIdPage_(html) {
  const m = html.match(/themoviedb\.org\/(movie|tv)\/(\d+)/i);
  return m ? m[2] : null;
}

async function verifierUneFiche_(film) {
  try {
    const reponse = await fetch(film.urlLetterboxd, { headers: { "User-Agent": USER_AGENT } });
    if (!reponse.ok) {
      // Page introuvable (404, etc.) -- suspect aussi, l'URL ne mène
      // plus nulle part.
      return { suspecte: true, titrePage: "(page inaccessible, HTTP " + reponse.status + ")", anneePage: "" };
    }
    const html = await reponse.text();
    const titrePage = extraireTitrePage_(html);
    const anneePage = extraireAnneePage_(html);
    const tmdbIdPage = extraireTmdbIdPage_(html);

    // MODIFIÉ (17/09/2026) : priorité à la comparaison d'ID TMDb quand
    // les deux valeurs sont disponibles (fiche avec un TMDbID déjà
    // renseigné en Sheet, ET page Letterboxd normale avec son lien TMDB
    // visible) -- bien plus fiable qu'une comparaison de titres, et ça
    // règle net la plupart des faux positifs restants après le premier
    // correctif (repli titreOriginal). Le repli par titre reste utilisé
    // quand l'un des deux ID manque (fiche sans TMDbID renseigné, ou
    // page Letterboxd sans lien TMDB visible).
    if (film.tmdbId && tmdbIdPage) {
      const ok = String(film.tmdbId) === String(tmdbIdPage);
      return { suspecte: !ok, titrePage: titrePage, anneePage: anneePage };
    }

    // Repli : comparaison de titre (titre puis titreOriginal) --
    // correctif du 16/09/2026, cf. note plus bas.
    let ok = pageCorrespond_(titrePage, anneePage, film.titre, film.annee);
    if (!ok && film.titreOriginal && normaliserTexte_(film.titreOriginal) !== normaliserTexte_(film.titre)) {
      ok = pageCorrespond_(titrePage, anneePage, film.titreOriginal, film.annee);
    }
    return { suspecte: !ok, titrePage: titrePage, anneePage: anneePage };
  } catch (e) {
    // Erreur réseau ponctuelle -- on ne signale pas comme suspecte pour
    // éviter les faux positifs liés à un simple raté de connexion,
    // juste tracé dans les logs du run.
    console.log("   (erreur réseau, ignorée : " + e.message + ")");
    return { suspecte: false, erreurReseau: true };
  }
}

async function envoyerRapport_(suspects, totalVerifies) {
  // MODIFIÉ (16/09/2026) : passe désormais par update-film.js (mode
  // rapportVerificationLetterboxd) plutôt qu'une route séparée --
  // corrige un dépassement de la limite de 12 fonctions serverless du
  // plan Vercel Hobby, constaté au déploiement.
  const reponse = await fetch(API_BASE + "/api/update-film", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      password: MOT_DE_PASSE,
      rapportVerificationLetterboxd: { suspects: suspects, totalVerifies: totalVerifies },
    }),
  });
  const corps = await reponse.json().catch(function () { return {}; });
  if (!reponse.ok) throw new Error("HTTP " + reponse.status + " : " + (corps.error || "erreur inconnue"));
  return corps;
}

async function chargerConfirmations_() {
  try {
    const reponse = await fetch(API_BASE + "/api/update-film?letterboxdConfirmations=1");
    if (!reponse.ok) return new Map();
    const liste = await reponse.json();
    return new Map(liste.map(function (c) { return [c.id, c.urlConfirmee]; }));
  } catch (e) {
    console.log("(impossible de charger les confirmations existantes, ignoré : " + e.message + ")");
    return new Map();
  }
}

async function main() {
  if (!MOT_DE_PASSE) {
    console.log("CINEMAISON_PASSWORD non configuré (secret GitHub Actions manquant) -- arrêt.");
    process.exit(1);
  }

  console.log("Récupération des fiches déjà résolues (api/get-films)...");
  const filmsBruts = await chargerFilmsResolus_();

  // NOUVEAU (17/09/2026) -- ignore les fiches déjà confirmées
  // manuellement comme correctes par Ben (voir api/confirm.js
  // ?page=letterboxdOk), tant que l'URL enregistrée n'a pas changé
  // depuis la confirmation. Économise aussi du temps de scan : ces
  // fiches ne sont même plus revisitées.
  const confirmations = await chargerConfirmations_();
  const films = filmsBruts.filter(function (f) {
    return confirmations.get(f.id) !== f.urlLetterboxd;
  });
  const ignorees = filmsBruts.length - films.length;
  console.log(films.length + " fiche(s) à vérifier" + (ignorees > 0 ? " (" + ignorees + " déjà confirmée(s), ignorée(s))" : "") + ".\n");

  if (films.length === 0) {
    console.log("Rien à vérifier.");
    return;
  }

  const suspects = [];
  let verifiees = 0;

  for (let i = 0; i < films.length; i++) {
    const f = films[i];
    process.stdout.write("[" + (i + 1) + "/" + films.length + "] " + f.titre + " (" + f.annee + ") ... ");
    const resultat = await verifierUneFiche_(f);
    if (!resultat.erreurReseau) verifiees++;
    if (resultat.suspecte) {
      console.log('SUSPECTE -- page trouvée : "' + resultat.titrePage + '" (' + (resultat.anneePage || "?") + ")");
      suspects.push({
        id: f.id,
        titre: f.titre,
        annee: f.annee,
        urlLetterboxd: f.urlLetterboxd,
        affiche: f.affiche || "",
        titrePageTrouvee: resultat.titrePage,
        anneePageTrouvee: resultat.anneePage,
      });
    } else if (!resultat.erreurReseau) {
      console.log("OK");
    }
    await new Promise(function (r) { setTimeout(r, PAUSE_ENTRE_FILMS_MS); });
  }

  console.log("\n" + suspects.length + " fiche(s) suspecte(s) sur " + verifiees + " vérifiée(s).");

  console.log("\nEnvoi du rapport (api/rapport-verification-letterboxd)...");
  const resultat = await envoyerRapport_(suspects, verifiees);
  console.log(resultat.mailEnvoye ? "Mail envoyé." : "Aucune anomalie -- pas de mail envoyé.");
}

main().catch(function (e) {
  console.error("Erreur :", e);
  process.exit(1);
});
