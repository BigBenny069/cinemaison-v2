import { google } from "googleapis";

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
};

// Les 4 tags "À voir" sont exclusifs entre eux (décision validée) : en
// activer un désactive automatiquement les 3 autres, y compris si le
// front oublie de le faire.
const TAG_FIELDS = ["benoit", "romy", "aDeux", "enFamille"];

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

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "PATCH") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { password, id, fields } = req.body || {};

  if (password !== process.env.ADD_FILM_PASSWORD) {
    return res.status(401).json({ error: "Mot de passe incorrect" });
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

    return res.status(200).json({ id, updated: Object.keys(finalFields) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Impossible de modifier la fiche", details: e.message });
  }
}
