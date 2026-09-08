import { google } from "googleapis";

// Onglet dédié : PRIME_IGNORES, colonnes A:D.
// TitreNormalise | Type (SUGGESTION|AMBIGUITE|ALIAS) | Date | IDCible
// IDCible n'est utilisé que pour le type ALIAS -- "ce titre Prime
// correspond en fait à cette fiche CinéMaison existante" (cas d'un
// titre écrit différemment sur Prime que dans le Sheet, qui ne matche
// donc jamais automatiquement par titre normalisé).
export const IGNORES_SHEET_NAME = "PRIME_IGNORES";
const ENTETE = ["TitreNormalise", "Type", "Date", "IDCible"];

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

// Même normalisation que côté prime.js (normaliserTitrePourMatch_) --
// DOIT rester identique des deux côtés, sinon un titre ignoré ne sera
// jamais reconnu comme tel au prochain run.
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

/** Retourne le tableau [{ titreNormalise, type, idCible }, ...]. */
export async function listerIgnores() {
  const sheets = await getSheetsClient(true);
  const sheetId = process.env.GOOGLE_SHEET_ID;

  let reponse;
  try {
    reponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: IGNORES_SHEET_NAME + "!A2:D",
    });
  } catch {
    return []; // onglet pas encore créé -- rien d'ignoré pour l'instant
  }

  return (reponse.data.values || [])
    .filter((ligne) => ligne[0])
    .map((ligne) => ({
      titreNormalise: ligne[0],
      type: ligne[1] || "",
      idCible: ligne[3] || "",
    }));
}

/**
 * Ajoute une entrée (crée l'onglet si besoin) : type "SUGGESTION" ou
 * "AMBIGUITE" pour un simple silence, type "ALIAS" + idCible pour lier
 * ce titre Prime à une fiche CinéMaison existante (fusion).
 */
export async function ajouterIgnore(titre, type, idCible) {
  const sheets = await getSheetsClient(false);
  const sheetId = process.env.GOOGLE_SHEET_ID;

  await assurerOngletIgnores_(sheets, sheetId);

  const titreNormalise = normaliserTitre(titre);
  const dejaLa = await listerIgnores();
  if (dejaLa.some((i) => i.titreNormalise === titreNormalise && i.type === type)) {
    return; // déjà enregistré, pas la peine de dupliquer la ligne
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: IGNORES_SHEET_NAME + "!A1",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [[titreNormalise, type, new Date().toISOString(), idCible || ""]] },
  });
}
