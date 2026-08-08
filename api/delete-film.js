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

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "DELETE") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { password, id } = req.body || {};

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

    if (rowIndex === -1) {
      return res.status(404).json({ error: `Aucune fiche avec l'ID ${id}` });
    }

    // 2) Retrouver le sheetId interne (numérique) de l'onglet "Films"
    const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: "sheets.properties" });
    const filmsSheet = meta.data.sheets.find((s) => s.properties.title === "Films");
    if (!filmsSheet) {
      return res.status(500).json({ error: "Onglet Films introuvable" });
    }
    const sheetId = filmsSheet.properties.sheetId;

    // 3) Supprimer physiquement la ligne (rowIndex correspond déjà à
    // l'index 0-based dans le tableau "rows", qui inclut l'en-tête —
    // c'est exactement l'index de ligne attendu par l'API pour deleteDimension)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: { sheetId, dimension: "ROWS", startIndex: rowIndex, endIndex: rowIndex + 1 },
          },
        }],
      },
    });

    return res.status(200).json({ id, deleted: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Impossible de supprimer la fiche", details: e.message });
  }
}
