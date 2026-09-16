import { google } from "googleapis";
import { lireLetterboxd, estUrlLetterboxdExploitable } from "../lib/letterboxd.js";
import { declencherWorkflowLetterboxdV1_ } from "../lib/github-actions.js";
import { appelerWebhookAvecReessai } from "../lib/webhook.js";

const SHEET_RANGE = "Films!A1:ZZ";

// Même correspondance que toCamelCase() dans get-films.js, mais inversée :
// on reçoit du front des clés camelCase et on doit retrouver l'en-tête
// exact du Sheet pour écrire au bon endroit.
const CAMEL_TO_HEADER = {
  titre: "Titre", annee: "Annee", plateforme: "Plateforme", duree: "Duree",
  dateManuelle: "DateDisponibilite", type: "Type", genre: "Genre",
  genrePrincipal: "GenrePrincipal", benoit: "Benoit", romy: "Romy",
  aDeux: "À deux", enFamille: "En famille", vu: "Vu", affiche: "Affiche",
  noteTMDb: "NoteTMDb", casting: "Casting", realisateur: "Réalisateur",
  synopsis: "Synopsis", noteLetterboxd: "NoteLetterboxd",
  votesLetterboxd: "VotesLetterboxd", urlLetterboxd: "URLLetterboxd",
  dateAuto: "DateDisponibiliteAuto",
  tmdbId: "TMDbID", imdbId: "IMDbID",
  urlPlateforme: "URLPlateforme",
  // Ajoutés pour "Redemander une vérification" (remplace Mode Vacances) :
  // vider ces deux champs fait sortir la fiche du lot "complet" au sens
  // du script d'enrichissement (05_ENRICHISSEMENT.gs), qui la reprend
  // automatiquement au cycle suivant sans effacer l'affiche/synopsis déjà
  // récupérés entre-temps.
  etatEnrichissement: "EtatEnrichissement",
  statutEnrichissement: "StatutEnrichissement",
};

// Les 4 tags "À voir" sont exclusifs entre eux (décision validée) : en
// activer un désactive automatiquement les 3 autres, y compris si le
// front oublie de le faire.
const TAG_FIELDS = ["benoit", "romy", "aDeux", "enFamille"];

// Modifier l'un de ces champs (ou vider EtatEnrichissement/
// StatutEnrichissement via "Redemander une vérification") doit relancer
// l'enrichissement IMMÉDIATEMENT plutôt que d'attendre le prochain cycle
// programmé toutes les 5 minutes — sinon une modification faite depuis
// l'app à 22h ne se voit reprise que si un cycle tourne effectivement,
// sans garantie de délai, et jamais si le Sheet n'a par ailleurs aucune
// autre activité. Voir 08_WEBHOOK.gs côté Apps Script.
const CHAMPS_DECLENCHANT_REENRICHISSEMENT = [
  "titre", "annee", "urlLetterboxd", "etatEnrichissement", "statutEnrichissement",
];

async function getSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

// Convertit un index de colonne (0 = A) en lettre(s) de colonne Sheets
function columnLetter(index) {
  let n = index + 1;
  let s = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

// Prévient le webhook Apps Script (08_WEBHOOK.gs) pour un ré-enrichissement
// immédiat (TMDb, etc. — tout ce qui n'est pas Letterboxd, désormais géré
// directement ci-dessous). Ne bloque JAMAIS la réponse à l'app en cas
// d'échec/lenteur : si la variable d'environnement n'est pas configurée,
// ou si l'appel échoue/timeout, on continue normalement — l'écriture
// Sheet a déjà réussi, seule la relance immédiate est manquée (le cycle
// programmé prendra quand même le relais plus tard).
async function notifierWebhookReenrichissement(id) {
  const url = process.env.ENRICH_WEBHOOK_URL;
  const secret = process.env.ENRICH_WEBHOOK_SECRET;
  if (!url || !secret) return { notified: false, reason: "ENRICH_WEBHOOK_URL/SECRET non configurés" };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, id }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await res.json().catch(() => ({}));
    return { notified: true, ok: !!data.ok, detail: data };
  } catch (e) {
    return { notified: false, reason: e.message };
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "PATCH") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { password, id, fields, updates } = req.body || {};

  if (password !== process.env.ADD_FILM_PASSWORD) {
    return res.status(401).json({ error: "Mot de passe incorrect" });
  }

  // Mode rapport (16/09/2026) : { rapportVerificationLetterboxd: { suspects,
  // totalVerifies } } -- fusionné ici plutôt que dans un fichier séparé
  // pour rester sous la limite de 12 fonctions serverless du plan Vercel
  // Hobby (déjà à pleine capacité, voir les autres fusions du même type
  // dans confirm.js). Ne touche jamais au Sheet -- relaie juste vers le
  // webhook Apps Script (traiterRapportVerificationLetterboxdV1_ dans
  // 09_WEBHOOK.gs) qui compose et envoie le mail récapitulatif. Appelé
  // par scripts/verifier-urls-letterboxd.js (GitHub Actions,
  // déclenchement manuel) une fois l'audit terminé.
  if (req.body && req.body.rapportVerificationLetterboxd) {
    const { suspects, totalVerifies } = req.body.rapportVerificationLetterboxd;
    if (!Array.isArray(suspects)) {
      return res.status(400).json({ error: "suspects doit être un tableau (vide si aucune anomalie)" });
    }

    const url = process.env.ENRICH_WEBHOOK_URL;
    const secret = process.env.ENRICH_WEBHOOK_SECRET;
    if (!url || !secret) {
      return res.status(500).json({ error: "ENRICH_WEBHOOK_URL/SECRET non configurés côté Vercel" });
    }

    // Contrairement à notifierWebhookReenrichissement plus bas (qui ne
    // doit jamais ralentir la réponse à l'app), cet appel peut se
    // permettre des réessais -- pas de contrainte de délai ici, et on
    // préfère perdre un peu de temps plutôt que le rapport si Apps
    // Script répond mal une fois.
    const resultatWebhook = await appelerWebhookAvecReessai(url, {
      secret,
      action: "rapportVerificationLetterboxd",
      suspects,
      totalVerifies: Number(totalVerifies) || suspects.length,
    });

    if (!resultatWebhook.ok) {
      return res.status(502).json({ error: "Échec de l'envoi vers Apps Script", details: resultatWebhook.error });
    }
    return res.status(200).json({ ok: true, detail: resultatWebhook.corps });
  }

  // Mode lot (11/09/2026) : { updates: [{ id, fields }, ...] } -- une
  // seule lecture + une seule écriture Sheets pour tout le lot, plutôt
  // qu'un aller-retour par fiche. Utilisé par les collecteurs
  // (prime.js/netflix.js/disney.js) pour écrire URLPlateforme sur
  // toutes les fiches matchées d'un coup (potentiellement 200+ fiches
  // -- un appel par fiche serait beaucoup trop lent et coûteux en
  // quota). Volontairement minimal : pas de résolution Letterboxd, pas
  // de déclenchement de ré-enrichissement -- juste une écriture
  // mécanique de champs simples.
  if (Array.isArray(updates)) {
    if (updates.length === 0) {
      return res.status(400).json({ error: "updates ne peut pas être vide" });
    }
    try {
      const sheets = await getSheetsClient();
      const spreadsheetId = process.env.GOOGLE_SHEET_ID;

      // Première lecture : sert uniquement à connaître l'en-tête (ordre
      // des colonnes). Les colonnes ne bougent jamais en cours
      // d'exécution -- seules les LIGNES peuvent se décaler (suppression
      // d'une fiche ailleurs pendant qu'on traite ce lot) -- donc rien
      // de sensible à récupérer ici.
      const headerResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Films!A1:ZZ1",
      });
      const headers = (headerResponse.data.values || [])[0] || [];
      const idCol = headers.indexOf("ID");
      if (idCol === -1) {
        return res.status(500).json({ error: "Colonne ID introuvable dans l'en-tête du Sheet" });
      }

      // NOUVEAU (16/09/2026) -- ANTI-COLLISION : bug constaté ce jour-là
      // où une écriture en lot (résolution Letterboxd automatique)
      // atterrissait sur la mauvaise ligne -- l'URL d'une fiche écrasant
      // celle de la fiche voisine. Cause identifiée : delete-film.js
      // supprime physiquement une ligne (deleteDimension), ce qui décale
      // toutes les lignes suivantes ; si ça arrive entre le moment où un
      // autre appel a lu les positions des fiches et le moment où il
      // écrit, les numéros de ligne qu'il utilise sont périmés.
      // On ne relit donc plus les positions en tout début de traitement
      // -- on relit UNIQUEMENT la colonne ID, ici, juste avant d'écrire,
      // pour repartir de positions aussi fraîches que possible. Ça ne
      // supprime pas totalement la fenêtre de risque (deux appels réseau
      // Sheets restent nécessaires, lecture puis écriture), mais la
      // réduit au strict minimum permis par l'API Sheets classique.
      const idColLetter = columnLetter(idCol);
      const idResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `Films!${idColLetter}2:${idColLetter}`,
      });
      const idRows = idResponse.data.values || [];

      const ligneParId = new Map();
      idRows.forEach((r, i) => {
        const idLigne = r[0];
        if (idLigne) ligneParId.set(idLigne, i + 2); // +2 -- ligne 1 = en-tête, tableau 0-indexé
      });

      const data = [];
      const ignores = [];
      for (const u of updates) {
        const sheetRow = ligneParId.get(u.id);
        if (!sheetRow) { ignores.push(u.id); continue; }
        for (const [camelKey, value] of Object.entries(u.fields || {})) {
          const header = CAMEL_TO_HEADER[camelKey];
          const colIndex = header ? headers.indexOf(header) : -1;
          if (colIndex === -1) continue;
          const col = columnLetter(colIndex);
          data.push({ range: `Films!${col}${sheetRow}`, values: [[value === true ? "OUI" : value === false ? "" : value]] });
        }
      }

      if (data.length === 0) {
        return res.status(400).json({ error: "Aucune écriture valide dans ce lot", ignores });
      }

      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: { valueInputOption: "USER_ENTERED", data },
      });

      return res.status(200).json({ ok: true, cellulesEcrites: data.length, ignores });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Impossible d'appliquer le lot", details: e.message });
    }
  }

  if (!id || !fields || typeof fields !== "object" || Object.keys(fields).length === 0) {
    return res.status(400).json({ error: "id et au moins un champ à modifier sont obligatoires" });
  }

  try {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: SHEET_RANGE });
    const rows = response.data.values || [];
    const headers = rows[0] || [];
    const idCol = headers.indexOf("ID");

    const rowIndex = rows.findIndex((r, i) => i > 0 && r[idCol] === id);
    if (rowIndex === -1) {
      return res.status(404).json({ error: `Aucune fiche avec l'ID ${id}` });
    }
    const sheetRow = rowIndex + 1; // +1 car les ranges Sheets sont en 1-indexé

    // Si un tag est activé, on désactive les autres dans la même écriture
    const finalFields = { ...fields };
    const activatedTag = TAG_FIELDS.find((t) => finalFields[t] === true);
    if (activatedTag) {
      TAG_FIELDS.forEach((t) => { if (t !== activatedTag) finalFields[t] = false; });
    }

    // NOUVEAU (03/09/2026) : résolution Letterboxd directement ici, sur
    // Vercel, plutôt que de compter uniquement sur Apps Script — voir
    // lib/letterboxd.js pour le contexte complet (déclencheurs Apps Script
    // bloqués de façon reproductible sur les requêtes Letterboxd).
    //
    // Déclenché quand :
    //   - une nouvelle URLLetterboxd est envoyée (édition manuelle), ou
    //   - "Redemander une vérification" est cliqué (EtatEnrichissement/
    //     StatutEnrichissement vidés) ET la fiche a déjà une URL
    //     Letterboxd exploitable en base.
    // Si la lecture échoue, on ne bloque jamais l'écriture des autres
    // champs : le webhook Apps Script (ci-dessous) prend le relais comme
    // avant, aucune régression.
    const urlLetterboxdEnvoyee = typeof finalFields.urlLetterboxd === "string" ? finalFields.urlLetterboxd : null;
    const demandeRelance = Object.prototype.hasOwnProperty.call(finalFields, "etatEnrichissement")
      || Object.prototype.hasOwnProperty.call(finalFields, "statutEnrichissement");

    let urlLetterboxdCandidate = urlLetterboxdEnvoyee;
    if (!urlLetterboxdCandidate && demandeRelance) {
      const urlCol = headers.indexOf("URLLetterboxd");
      if (urlCol >= 0) urlLetterboxdCandidate = rows[rowIndex][urlCol] || "";
    }

    if (urlLetterboxdCandidate && estUrlLetterboxdExploitable(urlLetterboxdCandidate)) {
      try {
        // Borne stricte de temps (11/09/2026) : si Letterboxd traîne ou
        // bloque la requête (constaté sur les liens /tmdb/ -- voir notes
        // dans lib/letterboxd.js), l'ENSEMBLE de cette sauvegarde
        // pouvait dépasser la limite d'exécution de Vercel et échouer
        // intégralement -- y compris les champs qui n'ont rien à voir
        // avec Letterboxd (titre, TMDbID saisi à la main, etc.). Passé
        // ce délai, on abandonne juste cette étape et on continue avec
        // le reste normalement.
        // Régression identifiée le 15/09/2026 : lireLetterboxd() peut
        // légitimement avoir besoin de 3 tentatives (pauses 1s+2s, plus
        // le temps réseau de chacune) pour réussir face à un blocage
        // anti-robot passager -- soit 6 à 9s au pire des cas. La limite
        // de 5000ms posée le 12/09/2026 coupait ce mécanisme avant sa
        // 3e tentative, transformant des succès légitimes (mais lents)
        // en échecs. Remontée à 12s pour laisser le réessai aller au
        // bout -- reste une vraie protection contre un blocage total.
        const delaiMaxMs = 12000;
        const resultat = await Promise.race([
          lireLetterboxd(urlLetterboxdCandidate),
          new Promise((resolve) => setTimeout(() => resolve({ ok: false, reason: "délai dépassé (" + delaiMaxMs + "ms)" }), delaiMaxMs)),
        ]);
        if (resultat.ok) {
          finalFields.urlLetterboxd = resultat.url;
          finalFields.noteLetterboxd = resultat.note;
          finalFields.votesLetterboxd = resultat.votes;
          // N'écrit l'ID TMDb extrait que si le client n'en a pas
          // fourni un dans CETTE sauvegarde, ET que la colonne est
          // encore vide côté Sheet -- sinon la résolution automatique
          // écrasait silencieusement un ID que Ben venait de saisir à
          // la main dans le même formulaire (bug constaté le
          // 11/09/2026 : toute fiche avec une URL Letterboxd déjà
          // renseignée ignorait systématiquement l'ID TMDb tapé à la
          // main, remplacé avant même l'écriture dans le Sheet).
          if (resultat.tmdbId) {
            const tmdbFourniParClient = typeof finalFields.tmdbId === "string" && finalFields.tmdbId.trim();
            const tmdbCol = headers.indexOf("TMDbID");
            const tmdbIdActuel = tmdbCol >= 0 ? (rows[rowIndex][tmdbCol] || "") : "";
            if (!tmdbFourniParClient && !String(tmdbIdActuel).trim()) {
              finalFields.tmdbId = resultat.tmdbId;
            }
          }
          // Si la lecture réussit ici, plus besoin de rester en attente
          // côté Apps Script pour la partie Letterboxd — on le marque
          // résolu pour ne pas repartir en A_VERIFIER_LETTERBOXD au
          // prochain cycle si le reste (TMDb) était déjà bon.
        } else {
          console.error("[update-film] Letterboxd non résolu :", resultat.reason, "| id=", id);
          // Ajout du 15/09/2026 : si la tentative rapide (Vercel) échoue
          // sur un lien /tmdb/ ou /imdb/ -- typiquement un blocage
          // anti-robot, voir lib/letterboxd.js -- on déclenche en
          // secours le workflow GitHub Actions dédié
          // (resoudre-letterboxd.yml), qui a un bien meilleur taux de
          // réussite sur ces liens (trafic non filtré par Letterboxd,
          // confirmé le 15/09/2026 en comparant avec CinéRadar). Sans
          // bloquer la réponse : on ne fait qu'envoyer la demande, sans
          // attendre le résultat.
          declencherWorkflowLetterboxdV1_().catch(() => {});
        }
      } catch (e) {
        console.error("[update-film] Erreur inattendue lors de la lecture Letterboxd :", e.message, "| id=", id);
      }
    }

    // NOUVEAU (16/09/2026) -- ANTI-COLLISION : la résolution Letterboxd
    // ci-dessus peut prendre jusqu'à 12 secondes (délaiMaxMs) -- une
    // fenêtre largement suffisante pour qu'une suppression de fiche
    // ailleurs (delete-film.js, qui décale physiquement les lignes
    // suivantes via deleteDimension) survienne pendant l'attente. Si ça
    // arrive, sheetRow (calculé tout en haut, avant l'attente) ne
    // correspond plus à la bonne fiche -- écrire dessus quand même
    // écraserait les données d'une fiche voisine sans que personne ne
    // le sache (bug réel constaté le 16/09/2026 sur une écriture en
    // lot, même mécanisme). On revérifie donc ici que l'ID est bien
    // toujours celui attendu à cette ligne, juste avant d'écrire pour de
    // vrai -- s'il a bougé, on abandonne proprement plutôt que
    // d'écraser une autre fiche en silence ; l'app peut alors simplement
    // réessayer (elle repartira d'une position à jour).
    const idColLetterVerif = columnLetter(idCol);
    const verifResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `Films!${idColLetterVerif}${sheetRow}`,
    });
    const idActuelALaLigne = (verifResponse.data.values && verifResponse.data.values[0] && verifResponse.data.values[0][0]) || "";
    if (idActuelALaLigne !== id) {
      console.error(
        "[update-film] Anti-collision : position périmée pour id=", id,
        "-- attendu à la ligne", sheetRow, "mais trouvé:", idActuelALaLigne,
        "(probablement une suppression de fiche survenue pendant le traitement)"
      );
      return res.status(409).json({
        error: "La position de la fiche a changé pendant le traitement (probablement une suppression ailleurs) -- réessaie.",
      });
    }

    const data = Object.entries(finalFields).map(([camelKey, value]) => {
      const header = CAMEL_TO_HEADER[camelKey];
      if (!header) return null;
      const colIndex = headers.indexOf(header);
      if (colIndex === -1) return null;
      const col = columnLetter(colIndex);
      return { range: `Films!${col}${sheetRow}`, values: [[value === true ? "OUI" : value === false ? "" : value]] };
    }).filter(Boolean);

    if (data.length === 0) {
      return res.status(400).json({ error: "Aucun des champs envoyés n'est reconnu" });
    }

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: { valueInputOption: "USER_ENTERED", data },
    });

    // Ré-enrichissement immédiat si un champ pertinent a changé — voir
    // notifierWebhookReenrichissement ci-dessus pour le comportement en
    // cas d'échec (n'affecte jamais la réponse renvoyée à l'app). Reste
    // utile même quand Letterboxd vient d'être résolu ci-dessus : c'est
    // ce chemin qui gère TMDb et le reste de l'enrichissement.
    const doitReenrichir = Object.keys(fields).some((k) => CHAMPS_DECLENCHANT_REENRICHISSEMENT.includes(k));
    const webhook = doitReenrichir ? await notifierWebhookReenrichissement(id) : { notified: false, reason: "aucun champ déclencheur modifié" };

    return res.status(200).json({ id, updated: Object.keys(finalFields), webhook });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Impossible de modifier la fiche", details: e.message });
  }
}
