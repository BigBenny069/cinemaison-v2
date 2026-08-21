import { google } from "googleapis";

const SHEET_RANGE = "Films!A1:ZZ";

async function getSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

// Convertit un index de colonne (0 = A) en lettre(s) de colonne Sheets —
// même helper que dans update-film.js.
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

// api/bulk-retry-trailers.js
//
// Vide EtatEnrichissement + StatutEnrichissement pour TOUTES les fiches
// dont URLBandeAnnonce est vide — même mécanisme que le bouton "Redemander
// une vérification" de la fiche détail (update-film.js), mais appliqué en
// masse en un seul appel plutôt que fiche par fiche. Le script Apps Script
// d'enrichissement (05_ENRICHISSEMENT.gs) reprendra ces fiches à son
// prochain cycle et tentera de récupérer une bande-annonce, sans toucher
// à l'affiche/synopsis/casting déjà récupérés.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { password } = req.body || {};
  if (password !== process.env.ADD_FILM_PASSWORD) {
    return res.status(401).json({ error: "Mot de passe incorrect" });
  }

  try {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: SHEET_RANGE });
    const rows = response.data.values || [];
    const headers = rows[0] || [];

    const trailerCol = headers.indexOf("URLBandeAnnonce");
    const etatCol = headers.indexOf("EtatEnrichissement");
    const statutCol = headers.indexOf("StatutEnrichissement");

    if (trailerCol === -1 || etatCol === -1 || statutCol === -1) {
      return res.status(500).json({ error: "Colonnes URLBandeAnnonce/EtatEnrichissement/StatutEnrichissement introuvables dans le Sheet" });
    }

    const etatLetter = columnLetter(etatCol);
    const statutLetter = columnLetter(statutCol);

    const data = [];
    let concerned = 0;
    rows.forEach((row, i) => {
      if (i === 0) return; // en-tête
      const hasTrailer = (row[trailerCol] || "").trim() !== "";
      if (hasTrailer) return;
      const sheetRow = i + 1;
      const etatDejaVide = (row[etatCol] || "").trim() === "";
      const statutDejaVide = (row[statutCol] || "").trim() === "";
      if (etatDejaVide && statutDejaVide) return; // déjà en attente de reprise, rien à faire
      concerned += 1;
      data.push({ range: `Films!${etatLetter}${sheetRow}`, values: [[""]] });
      data.push({ range: `Films!${statutLetter}${sheetRow}`, values: [[""]] });
    });

    if (data.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: { valueInputOption: "USER_ENTERED", data },
      });
    }

    return res.status(200).json({ concerned });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Impossible de relancer les fiches", details: e.message });
  }
}
