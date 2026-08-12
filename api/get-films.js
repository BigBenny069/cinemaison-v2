import { google } from "googleapis";

// Colonnes qu'on expose au front pour l'instant (sous-ensemble des 53
// colonnes du Sheet — on élargira au fil du développement des écrans).
const EXPOSED_COLUMNS = [
  "ID", "Titre", "Annee", "Plateforme", "Duree", "DateDisponibilite", "Type",
  "Genre", "GenrePrincipal", "Benoit", "Romy", "À deux", "En famille", "Vu",
  "Affiche", "NoteTMDb", "Casting", "Réalisateur", "Synopsis",
  "NoteLetterboxd", "VotesLetterboxd", "URLLetterboxd", "DateDisponibiliteAuto",
  "URLBandeAnnonce",
];

async function getSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return google.sheets({ version: "v4", auth });
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const sheets = await getSheetsClient();
    const sheetId = process.env.GOOGLE_SHEET_ID;

    // On lit toute la feuille "Films" (en-têtes + lignes)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Films!A1:ZZ",
    });

    const rows = response.data.values || [];
    if (rows.length < 2) return res.status(200).json([]);

    const headers = rows[0];
    const columnIndexes = EXPOSED_COLUMNS.map((col) => headers.indexOf(col));

    const films = rows.slice(1).map((row) => {
      const film = {};
      EXPOSED_COLUMNS.forEach((col, i) => {
        const idx = columnIndexes[i];
        film[toCamelCase(col)] = idx >= 0 ? row[idx] || null : null;
      });
      return film;
    }).filter((f) => f.titre); // ignore les lignes vides

    // Cache léger côté CDN Vercel (5 min) — les données changent au
    // rythme du Mode Vacances quotidien, pas besoin de temps réel strict
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    return res.status(200).json(films);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Impossible de lire le Google Sheet", details: e.message });
  }
}

function toCamelCase(header) {
  const map = {
    ID: "id", Titre: "titre", Annee: "annee", Plateforme: "plateforme",
    Duree: "duree", DateDisponibilite: "dateManuelle", Type: "type",
    Genre: "genre", GenrePrincipal: "genrePrincipal", Benoit: "benoit",
    Romy: "romy", "À deux": "aDeux", "En famille": "enFamille", Vu: "vu",
    Affiche: "affiche", NoteTMDb: "noteTMDb", Casting: "casting",
    Réalisateur: "realisateur", Synopsis: "synopsis",
    NoteLetterboxd: "noteLetterboxd", VotesLetterboxd: "votesLetterboxd",
    URLLetterboxd: "urlLetterboxd", DateDisponibiliteAuto: "dateAuto",
    URLBandeAnnonce: "urlBandeAnnonce",
  };
  return map[header] || header;
}
