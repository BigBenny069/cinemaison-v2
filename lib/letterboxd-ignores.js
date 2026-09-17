import { google } from "googleapis";

// NOUVEAU (17/09/2026) -- même principe que lib/prime-ignores.js :
// onglet dédié pour retenir les décisions manuelles, plutôt que de
// resignaler indéfiniment une fiche que Ben a déjà vérifiée.
//
// Onglet dédié : LETTERBOXD_IGNORES, colonnes A:C.
// ID | URLConfirmee | Date
//
// On stocke l'URL confirmée avec l'ID (pas juste l'ID seul) : si l'URL
// change plus tard sur cette fiche (nouvelle résolution automatique,
// correction manuelle...), l'ancienne confirmation ne s'applique plus
// et la fiche peut être resignalée -- volontaire, pour ne jamais
// masquer une vraie nouvelle erreur sous une ancienne confirmation.
export const IGNORES_SHEET_NAME = "LETTERBOXD_IGNORES";
const ENTETE = ["ID", "URLConfirmee", "Date"];

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

/** Retourne le tableau [{ id, urlConfirmee }, ...]. */
export async function listerConfirmations() {
  const sheets = await getSheetsClient(true);
  const sheetId = process.env.GOOGLE_SHEET_ID;

  let reponse;
  try {
    reponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: IGNORES_SHEET_NAME + "!A2:C",
    });
  } catch {
    return []; // onglet pas encore créé -- rien de confirmé pour l'instant
  }

  return (reponse.data.values || [])
    .filter((ligne) => ligne[0])
    .map((ligne) => ({ id: ligne[0], urlConfirmee: ligne[1] || "" }));
}

/** Enregistre (ou met à jour) la confirmation pour une fiche. */
export async function confirmerUrl(id, url) {
  const sheets = await getSheetsClient(false);
  const sheetId = process.env.GOOGLE_SHEET_ID;

  await assurerOngletIgnores_(sheets, sheetId);

  const existantes = await listerConfirmations();
  const indexExistant = existantes.findIndex((c) => c.id === id);

  if (indexExistant === -1) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: IGNORES_SHEET_NAME + "!A1",
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [[id, url, new Date().toISOString()]] },
    });
  } else {
    // Déjà une ligne pour cet ID (confirmation précédente sur une
    // autre URL, par exemple) -- on la met à jour plutôt que d'en
    // ajouter une deuxième.
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: IGNORES_SHEET_NAME + "!A" + (indexExistant + 2) + ":C" + (indexExistant + 2),
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[id, url, new Date().toISOString()]] },
    });
  }
}
