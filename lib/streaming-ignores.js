import { google } from "googleapis";

// Onglet dédié : STREAMING_IGNORES, colonnes A:E.
// TitreNormalise | Plateforme | Type (SUGGESTION|AMBIGUITE|ALIAS) | Date | IDCible
// Même principe que PRIME_IGNORES (lib/prime-ignores.js, laissé tel
// quel -- système validé, pas touché) mais avec une colonne Plateforme
// en plus pour servir Netflix, Disney+, et toute plateforme future
// sans dupliquer le fichier à chaque fois.
export const IGNORES_SHEET_NAME = "STREAMING_IGNORES";
const ENTETE = ["TitreNormalise", "Plateforme", "Type", "Date", "IDCible"];

async function getSheetsClient(readonly) {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      readonly
        ? "https://www.googleapis.com/auth/spreadsheets.readonly"
        : "https://www.googleapis.com/auth/spreadsheets",
    ],
  });
  return google.sheets({ version: "v4", auth });
}

// Même normalisation que côté collecteurs (normaliserTitrePourMatch_
// dans prime.js/netflix.js) -- DOIT rester identique partout, sinon un
// titre ignoré ne sera jamais reconnu comme tel au prochain run.
export function normaliserTitre(titre) {
  return String(titre || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function assurerOngletIgnores_(sheets, sheetId) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const existe = (meta.data.sheets || []).some(
    (s) => s.properties.title === IGNORES_SHEET_NAME
  );
  if (existe) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: { requests: [{ addSheet: { properties: { title: IGNORES_SHEET_NAME } } }] },
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: IGNORES_SHEET_NAME + "!A1",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [ENTETE] },
  });
}

/**
 * Retourne le tableau [{ titreNormalise, plateforme, type, idCible }, ...],
 * filtré sur la plateforme demandée si fournie (sinon tout).
 */
export async function listerIgnores(plateforme) {
  const sheets = await getSheetsClient(true);
  const sheetId = process.env.GOOGLE_SHEET_ID;

  let reponse;
  try {
    reponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: IGNORES_SHEET_NAME + "!A2:E",
    });
  } catch {
    return []; // onglet pas encore créé -- rien d'ignoré pour l'instant
  }

  const toutes = (reponse.data.values || [])
    .filter((ligne) => ligne[0])
    .map((ligne) => ({
      titreNormalise: ligne[0],
      plateforme: ligne[1] || "",
      type: ligne[2] || "",
      idCible: ligne[4] || "",
    }));

  if (!plateforme) return toutes;
  return toutes.filter((i) => i.plateforme === plateforme);
}

/**
 * Ajoute une entrée (crée l'onglet si besoin) : type "SUGGESTION" ou
 * "AMBIGUITE" pour un simple silence, type "ALIAS" + idCible pour lier
 * ce titre à une fiche CinéMaison existante (fusion).
 */
export async function ajouterIgnore(titre, plateforme, type, idCible) {
  const sheets = await getSheetsClient(false);
  const sheetId = process.env.GOOGLE_SHEET_ID;

  await assurerOngletIgnores_(sheets, sheetId);

  const titreNormalise = normaliserTitre(titre);
  const dejaLa = await listerIgnores(plateforme);
  if (dejaLa.some((i) => i.titreNormalise === titreNormalise && i.type === type)) {
    return; // déjà enregistré, pas la peine de dupliquer la ligne
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: IGNORES_SHEET_NAME + "!A1",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [[titreNormalise, plateforme || "", type, new Date().toISOString(), idCible || ""]] },
  });
}
