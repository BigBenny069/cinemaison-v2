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
// immédiat. Ne bloque JAMAIS la réponse à l'app en cas d'échec/lenteur :
// si la variable d'environnement n'est pas configurée, ou si l'appel
// échoue/timeout, on continue normalement — l'écriture Sheet a déjà
// réussi, seule la relance immédiate est manquée (le cycle programmé
// prendra quand même le relais plus tard).
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

    // Ré-enrichissement immédiat si un champ pertinent a changé — voir
    // notifierWebhookReenrichissement ci-dessus pour le comportement en
    // cas d'échec (n'affecte jamais la réponse renvoyée à l'app).
    const doitReenrichir = Object.keys(fields).some((k) => CHAMPS_DECLENCHANT_REENRICHISSEMENT.includes(k));
    const webhook = doitReenrichir ? await notifierWebhookReenrichissement(id) : { notified: false, reason: "aucun champ déclencheur modifié" };

    return res.status(200).json({ id, updated: Object.keys(finalFields), webhook });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Impossible de modifier la fiche", details: e.message });
  }
}
