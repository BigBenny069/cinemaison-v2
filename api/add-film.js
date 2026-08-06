import { google } from "googleapis";

async function getSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { password, titre, annee, plateforme, type, dateManuelle, urlLetterboxd } = req.body || {};

  if (password !== process.env.ADD_FILM_PASSWORD) {
    return res.status(401).json({ error: "Mot de passe incorrect" });
  }
  if (!titre || !annee || !plateforme || !type) {
    return res.status(400).json({ error: "Titre, année, plateforme et type sont obligatoires" });
  }

  try {
    const sheets = await getSheetsClient();
    const sheetId = process.env.GOOGLE_SHEET_ID;

    // Génère un nouvel ID à la suite du dernier FILMxxxx existant
    const idColumn = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Films!A:A",
    });
    const existingIds = (idColumn.data.values || []).flat().filter((v) => /^FILM\d+$/.test(v));
    const maxNum = existingIds.reduce((max, id) => Math.max(max, parseInt(id.replace("FILM", ""), 10)), 0);
    const newId = `FILM${String(maxNum + 1).padStart(4, "0")}`;

    // NOTE : on écrit ici seulement les colonnes saisies manuellement.
    // Les colonnes d'enrichissement (TMDb/Letterboxd) restent vides —
    // c'est le Mode Vacances (Apps Script, tourne toujours côté Sheet)
    // qui les remplira à son prochain passage, exactement comme
    // aujourd'hui avec l'ajout manuel dans AppSheet.
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "Films!A:A",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[newId, titre, annee, plateforme, "", "", "", dateManuelle || "", type, "", "", "", "", "", "", "", "", "", "", "", "", "", urlLetterboxd || ""]],
      },
    });

    return res.status(200).json({ success: true, id: newId });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Impossible d'ajouter le film", details: e.message });
  }
}
