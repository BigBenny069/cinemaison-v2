import { google } from "../lib/google.js";
import { avisValide, enregistrerAvis, filmDepuisLigne } from "../lib/avis.js";

const SHEET_RANGE = "Films!A1:ZZ";

// NOUVEAU (25/11/2026) -- lettre de colonne (0 -> A, 26 -> AA), même fonction
// que dans update-film.js.
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

async function getSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "DELETE") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { password, id, avis } = req.body || {};

  if (password !== process.env.ADD_FILM_PASSWORD) {
    return res.status(401).json({ error: "Mot de passe incorrect" });
  }
  if (!id) {
    return res.status(400).json({ error: "id obligatoire" });
  }

  try {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // 1) Retrouver la ligne correspondant à cet ID
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: SHEET_RANGE });
    const rows = response.data.values || [];
    const headers = rows[0] || [];
    const idCol = headers.indexOf("ID");
    const rowIndex = rows.findIndex((r, i) => i > 0 && r[idCol] === id); // 0-indexé, header inclus

    // MODIFIÉ (25/11/2026) -- une fiche déjà absente du Sheet n'est PAS une
    // erreur : le but (qu'elle n'y soit plus) est atteint. Avant, l'app
    // affichait "Aucune fiche avec l'ID ..." quand une fiche déjà supprimée
    // réapparaissait un moment dans la liste (copie en cache) et qu'on la
    // supprimait une 2e fois. Réponse 200, avec dejaAbsente: true.
    if (rowIndex === -1) {
      return res.status(200).json({ id, deleted: false, dejaAbsente: true });
    }

    // 1 bis) NOUVEAU (19/10/2026) -- avis de Ben (1 à 5) donné au moment de
    // supprimer : on le garde, avec les genres/réalisateur/acteurs du film,
    // dans l'onglet AVIS AVANT d'effacer la ligne (sinon ses goûts
    // disparaîtraient avec la fiche). Un échec ici ne bloque pas la suppression.
    let avisEnregistre = false;
    if (avisValide(avis)) {
      try {
        await enregistrerAvis(sheets, spreadsheetId, filmDepuisLigne(headers, rows[rowIndex]), avis, "suppression");
        avisEnregistre = true;
      } catch (e) {
        console.error("[delete-film/avis]", e.message);
      }
    }

    // 2) Retrouver le sheetId interne (numérique) de l'onglet "Films"
    const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: "sheets.properties" });
    const filmsSheet = meta.data.sheets.find((s) => s.properties.title === "Films");
    if (!filmsSheet) {
      return res.status(500).json({ error: "Onglet Films introuvable" });
    }
    const sheetId = filmsSheet.properties.sheetId;

    // 2 bis) NOUVEAU (25/11/2026) -- ANTI-COLLISION : entre la lecture du
    // début et la suppression ci-dessous, une autre suppression (ou toute
    // autre modification qui décale les lignes) peut avoir changé la
    // position de la fiche : supprimer "la ligne n° X" effacerait alors UNE
    // AUTRE fiche. On relit donc UNIQUEMENT la colonne ID, juste avant de
    // supprimer, et on repart de la position fraîche (même principe que
    // update-film.js, correctif du 16/09/2026).
    const idLettre = columnLetter(idCol);
    const idRelus = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `Films!${idLettre}1:${idLettre}`,
    });
    const colonneId = idRelus.data.values || [];
    let ligneFraiche = -1;
    for (let i = 1; i < colonneId.length; i++) {
      if (colonneId[i] && colonneId[i][0] === id) { ligneFraiche = i; break; }
    }
    if (ligneFraiche === -1) {
      // Supprimée entre-temps par un autre appel : rien d'autre à faire.
      return res.status(200).json({ id, deleted: false, dejaAbsente: true, avisEnregistre });
    }

    // 3) Supprimer physiquement la ligne (ligneFraiche = index 0-based dans
    // la colonne ID relue, en-tête inclus -- c'est exactement l'index de
    // ligne attendu par l'API pour deleteDimension)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: { sheetId, dimension: "ROWS", startIndex: ligneFraiche, endIndex: ligneFraiche + 1 },
          },
        }],
      },
    });

    return res.status(200).json({ id, deleted: true, avisEnregistre });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Impossible de supprimer la fiche", details: e.message });
  }
}
