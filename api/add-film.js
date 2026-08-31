import { google } from "googleapis";

const SHEET_RANGE = "Films!A1:ZZ";

async function getSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  const auth = new google.auth.GoogleAuth({
    credentials,
    // Ici on a besoin d'écrire, contrairement à get-films.js qui ne fait que lire
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

// Trouve le prochain ID séquentiel de la forme FILM0001, FILM0002...
// Les anciens ID hexadécimaux (imports en masse) sont ignorés pour ce calcul,
// on ne s'en sert jamais pour générer un nouvel ID.
function nextSequentialId(existingIds) {
  let max = 0;
  existingIds.forEach((id) => {
    const m = String(id || "").match(/^FILM(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return `FILM${String(max + 1).padStart(4, "0")}`;
}

export default async function handler(req, res) {
  // --- CORS pour cineradar-nu.vercel.app ---
  // Posés tout en haut, avant toute autre logique, pour qu'ils soient
  // présents sur TOUTES les réponses de cette fonction (succès et erreur).
  res.setHeader("Access-Control-Allow-Origin", "https://cineradar-nu.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Requête de pré-vérification du navigateur (CORS preflight) — doit
  // recevoir un 200 immédiat, avant la vérification de méthode POST
  // habituelle, sinon le navigateur bloque la vraie requête qui suit.
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  // --- fin CORS ---

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
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // On relit toute la feuille pour connaître l'ordre exact des colonnes
    // et la colonne ID complète (afin de calculer le prochain ID libre).
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: SHEET_RANGE });
    const rows = response.data.values || [];
    const headers = rows[0] || [];

    const idCol = headers.indexOf("ID");
    const existingIds = rows.slice(1).map((r) => r[idCol]);
    const newId = nextSequentialId(existingIds);

    // On construit une ligne de la même largeur que l'en-tête, en ne
    // remplissant que les champs saisis ici. Tout le reste (affiche,
    // synopsis, casting, notes...) reste vide pour l'enrichissement
    // automatique ultérieur.
    const newRow = new Array(headers.length).fill("");
    const champsIgnores = [];

    const setField = (headerName, value) => {
      const idx = headers.indexOf(headerName);
      if (idx >= 0) {
        newRow[idx] = value;
      } else {
        // NOUVEAU : au lieu d'échouer silencieusement, on note le nom de
        // colonne recherché pour le voir dans les journaux Vercel — ça
        // permet de détecter immédiatement un écart entre le nom de champ
        // envoyé côté client (CinéMaison ou CinéRadar) et le nom exact de
        // la colonne dans la ligne d'en-tête du Sheet.
        champsIgnores.push(headerName);
      }
    };

    setField("ID", newId);
    setField("Titre", titre);
    setField("Annee", annee);
    setField("Plateforme", plateforme);
    setField("Type", type);
    if (dateManuelle) setField("DateDisponibilite", dateManuelle);
    if (urlLetterboxd) setField("URLLetterboxd", urlLetterboxd);

    if (champsIgnores.length > 0) {
      // console.error (pas .warn) pour que ça remonte bien dans l'onglet
      // "Logs" de Vercel même si le niveau de verbosité est filtré.
      console.error(
        "[add-film] Colonne(s) introuvable(s) dans l'en-tête du Sheet, champ(s) ignoré(s) :",
        champsIgnores.join(", "),
        "— en-têtes disponibles :",
        headers.join(", ")
      );
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Films!A1",
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [newRow] },
    });

    return res.status(200).json({
      id: newId,
      titre,
      annee,
      plateforme,
      type,
      // Remonté dans la réponse aussi, pas seulement les logs — utile pour
      // que CinéRadar (ou tout autre appelant) voie immédiatement si un de
      // ses champs n'a pas pu être écrit, sans avoir à consulter les logs.
      champsIgnores: champsIgnores.length > 0 ? champsIgnores : undefined,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Impossible d'ajouter le film au Google Sheet", details: e.message });
  }
}
