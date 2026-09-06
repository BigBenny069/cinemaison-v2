import { google } from "googleapis";

// Doit rester identique à PRIME_CONTROLE_FEUILLE_V110 dans
// 11_CONTROLE_PRIME_OFFICIEL.gs (script validé, ne pas modifier ce
// nom sans modifier les deux côtés).
const CONTROLE_SHEET_NAME = "CONTROLE_PRIME";

// Colonnes N à S -- même bloc que celui lu par chargerContextePrimeV110_
// (qui lit 10 colonnes à partir de N, mais seules ces 6 sont utilisées
// par le script Apps Script).
const ENTETE = [
  "IDFilm", "MessagePrime", "JoursRestants",
  "DateRetraitDetectee", "ControleLe", "StatutControle",
];

async function getSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

function formaterDateISO(date) {
  return date.toISOString().slice(0, 10);
}

// "YYYY-MM-DD HH:mm:ss" -- reconnu par convertirDateControlePrimeV111_
// côté Apps Script (accepte aussi le format français, mais on reste
// sur l'ISO ici, aussi accepté et sans ambiguïté).
function formaterHorodatageISO(date) {
  const p = (n) => String(n).padStart(2, "0");
  return (
    date.getFullYear() + "-" + p(date.getMonth() + 1) + "-" + p(date.getDate()) +
    " " + p(date.getHours()) + ":" + p(date.getMinutes()) + ":" + p(date.getSeconds())
  );
}

/**
 * Construit une ligne N:S à partir d'un résultat envoyé par prime.js.
 * IMPORTANT : 11_CONTROLE_PRIME_OFFICIEL.gs valide strictement les
 * lignes DATE_DETECTEE avec la regex /Quitte\s+Prime\s+Video\s+dans\s+
 * (\d+)\s+jours?/i -- toujours des JOURS ENTIERS, jamais d'heures ni de
 * minutes, et JoursRestants doit correspondre exactement au nombre dans
 * le message. On arrondit donc ici le joursRestants (potentiellement
 * décimal, ex: 35 heures = 1.46) au jour entier le plus proche.
 */
function construireLigne(resultat, controleLe, maintenant) {
  const idFilm = String(resultat.idFilm || "").trim();
  if (!idFilm) return null;

  if (resultat.statutControle === "DATE_DETECTEE") {
    const jours = Math.round(Number(resultat.joursRestants));
    if (!Number.isFinite(jours) || jours < 0 || jours > 60) {
      // Valeur incohérente reçue -- on écrit quand même une ligne, en
      // AUCUNE_ALERTE plutôt que de faire échouer tout le lot pour une
      // seule fiche douteuse (elle sera simplement ignorée sans effet
      // côté Apps Script, jamais une suppression de date existante).
      return [
        idFilm,
        "Valeur joursRestants invalide reçue de prime.js (" + resultat.joursRestants + ")",
        "", "", controleLe, "AUCUNE_ALERTE",
      ];
    }

    const dateRetrait = new Date(maintenant);
    dateRetrait.setDate(dateRetrait.getDate() + jours);

    return [
      idFilm,
      "Quitte Prime Video dans " + jours + (jours === 1 ? " jour" : " jours"),
      jours,
      formaterDateISO(dateRetrait),
      controleLe,
      "DATE_DETECTEE",
    ];
  }

  return [
    idFilm,
    String(resultat.messagePrime || "Aucune alerte de départ détectée"),
    "", "", controleLe, "AUCUNE_ALERTE",
  ];
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { password, resultats } = req.body || {};

  if (password !== process.env.ADD_FILM_PASSWORD) {
    return res.status(401).json({ error: "Mot de passe invalide" });
  }
  if (!Array.isArray(resultats) || resultats.length === 0) {
    return res.status(400).json({ error: "resultats doit être un tableau non vide" });
  }

  // Un seul horodatage pour tout le lot, fixé côté serveur (pas depuis
  // le PC de Ben) pour ne dépendre d'aucune horloge locale.
  const maintenant = new Date();
  const controleLe = formaterHorodatageISO(maintenant);

  const lignes = resultats
    .map((r) => construireLigne(r, controleLe, maintenant))
    .filter(Boolean);

  if (lignes.length === 0) {
    return res.status(400).json({ error: "Aucune ligne valide à écrire (idFilm manquant partout ?)" });
  }

  try {
    const sheets = await getSheetsClient();
    const sheetId = process.env.GOOGLE_SHEET_ID;

    // Efface une large plage avant de réécrire, pour ne jamais laisser
    // traîner des lignes d'une exécution précédente si ce lot-ci est
    // plus court (ex : le prochain run scrape moins de fiches).
    await sheets.spreadsheets.values.clear({
      spreadsheetId: sheetId,
      range: CONTROLE_SHEET_NAME + "!N1:S2000",
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: CONTROLE_SHEET_NAME + "!N1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [ENTETE, ...lignes] },
    });

    return res.status(200).json({
      ok: true,
      lignesEcrites: lignes.length,
      controleLe,
    });
  } catch (e) {
    console.error("[write-controle-prime] Erreur écriture Sheet :", e.message);
    return res.status(500).json({
      error: "Erreur écriture Google Sheet",
      details: e.message,
    });
  }
}
