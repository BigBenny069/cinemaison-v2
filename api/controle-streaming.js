// Équivalent générique de controle-prime.js (laissé tel quel pour Prime,
// système validé) -- pour Netflix/Disney+/toute plateforme future.
// Écrit dans l'onglet CONTROLE_<PLATEFORME> (ex. CONTROLE_NETFLIX,
// CONTROLE_DISNEY), dispatch par body.plateforme. Même principe deux
// temps que Prime : écriture du brouillon (rien dans Films), puis
// action="apply" qui déclenche la simulation + mail de validation côté
// Apps Script -- l'écriture réelle dans Films ne se déclenche que sur
// un vrai clic humain sur "VALIDER ET APPLIQUER" dans ce mail.
//
// ⚠️ Le pendant Apps Script (onglets CONTROLE_NETFLIX/CONTROLE_DISNEY,
// actions "lancerVerificationControleStreaming" / "appliquerControle
// Streaming" dans 09_WEBHOOK.gs) n'existe pas encore -- c'est la
// PROCHAINE étape. En attendant, l'écriture du brouillon fonctionne
// déjà (utile pour valider que les collecteurs envoient bien des
// données), mais action="apply" échouera proprement (502) tant que ce
// pendant n'est pas construit.
import { google } from "googleapis";

const PLATEFORMES_AUTORISEES = ["NETFLIX", "DISNEY"];

function nomOngletControle(plateforme) {
  return "CONTROLE_" + plateforme;
}

// Même bloc de colonnes que CONTROLE_PRIME (N:T), pour que le futur
// pendant Apps Script puisse réutiliser la même logique de lecture
// générique (indexEntetesPrimeV110_-like) sur les 3 plateformes.
const ENTETE = [
  "IDFilm", "Message", "JoursRestants",
  "DateRetraitDetectee", "ControleLe", "StatutControle",
  "StatutDetecte",
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

function formaterHorodatageISO(date) {
  const p = (n) => String(n).padStart(2, "0");
  return (
    date.getFullYear() + "-" + p(date.getMonth() + 1) + "-" + p(date.getDate()) +
    " " + p(date.getHours()) + ":" + p(date.getMinutes()) + ":" + p(date.getSeconds())
  );
}

/**
 * Construit une ligne N:T à partir d'un résultat envoyé par un
 * collecteur (netflix.js, disney.js...). Même format de champs pour
 * toutes les plateformes : { idFilm, statutControle: "DATE_DETECTEE"|
 * "AUCUNE_ALERTE", joursRestants?, message?, statutDetecte? }.
 */
function construireLigne(resultat, controleLe, maintenant) {
  const idFilm = String(resultat.idFilm || "").trim();
  if (!idFilm) return null;

  const statutDetecte = String(resultat.statutDetecte || "").trim();

  if (resultat.statutControle === "DATE_DETECTEE") {
    const jours = Number(resultat.joursRestants);
    if (!Number.isFinite(jours) || jours < 0 || jours > 60) {
      return [
        idFilm,
        "Valeur joursRestants invalide reçue du collecteur (" + resultat.joursRestants + ")",
        "", "", controleLe, "AUCUNE_ALERTE", statutDetecte,
      ];
    }

    const dateRetrait = new Date(maintenant);
    dateRetrait.setDate(dateRetrait.getDate() + Math.round(jours));

    return [
      idFilm,
      resultat.message || "",
      jours,
      formaterDateISO(dateRetrait),
      controleLe,
      "DATE_DETECTEE",
      statutDetecte,
    ];
  }

  return [
    idFilm,
    String(resultat.message || "Aucune alerte de départ détectée"),
    "", "", controleLe, "AUCUNE_ALERTE", statutDetecte,
  ];
}

async function traiterEcriture(req, res) {
  const { password, plateforme, resultats } = req.body || {};

  if (password !== process.env.ADD_FILM_PASSWORD) {
    return res.status(401).json({ error: "Mot de passe invalide" });
  }
  if (!PLATEFORMES_AUTORISEES.includes(plateforme)) {
    return res.status(400).json({ error: "plateforme doit être l'une de : " + PLATEFORMES_AUTORISEES.join(", ") });
  }
  if (!Array.isArray(resultats) || resultats.length === 0) {
    return res.status(400).json({ error: "resultats doit être un tableau non vide" });
  }

  const maintenant = new Date();
  const controleLe = formaterHorodatageISO(maintenant);

  const lignes = resultats
    .map((r) => construireLigne(r, controleLe, maintenant))
    .filter(Boolean);

  if (lignes.length === 0) {
    return res.status(400).json({ error: "Aucune ligne valide à écrire (idFilm manquant partout ?)" });
  }

  const ongletControle = nomOngletControle(plateforme);

  try {
    const sheets = await getSheetsClient();
    const sheetId = process.env.GOOGLE_SHEET_ID;

    await assurerOngletControle_(sheets, sheetId, ongletControle);

    await sheets.spreadsheets.values.clear({
      spreadsheetId: sheetId,
      range: ongletControle + "!N1:T2000",
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: ongletControle + "!N1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [ENTETE, ...lignes] },
    });

    return res.status(200).json({ ok: true, plateforme, lignesEcrites: lignes.length, controleLe });
  } catch (e) {
    console.error("[controle-streaming][write] Erreur écriture Sheet :", e.message);
    return res.status(500).json({ error: "Erreur écriture Google Sheet", details: e.message });
  }
}

/**
 * Crée l'onglet CONTROLE_<PLATEFORME> s'il n'existe pas encore --
 * jamais nécessaire pour Prime (onglet créé à la main historiquement),
 * mais Netflix/Disney partent de zéro.
 */
async function assurerOngletControle_(sheets, sheetId, nomOnglet) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const existe = (meta.data.sheets || []).some((s) => s.properties.title === nomOnglet);
  if (existe) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: { requests: [{ addSheet: { properties: { title: nomOnglet } } }] },
  });
}

async function traiterApplication(req, res) {
  const { password, plateforme } = req.body || {};
  if (password !== process.env.ADD_FILM_PASSWORD) {
    return res.status(401).json({ error: "Mot de passe invalide" });
  }
  if (!PLATEFORMES_AUTORISEES.includes(plateforme)) {
    return res.status(400).json({ error: "plateforme doit être l'une de : " + PLATEFORMES_AUTORISEES.join(", ") });
  }

  const url = process.env.ENRICH_WEBHOOK_URL;
  const secret = process.env.ENRICH_WEBHOOK_SECRET;
  if (!url || !secret) {
    return res.status(500).json({ error: "ENRICH_WEBHOOK_URL/SECRET non configurés côté Vercel" });
  }

  try {
    const reponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, action: "appliquerControleStreaming", plateforme }),
    });
    const corps = await reponse.json().catch(() => ({}));
    if (!reponse.ok || !corps.ok) {
      return res.status(502).json({ error: "Le webhook Apps Script a échoué (pendant Apps Script pas encore construit pour cette plateforme ?)", details: corps });
    }
    return res.status(200).json({ ok: true, resume: corps.resume });
  } catch (e) {
    console.error("[controle-streaming][apply] Erreur :", e.message);
    return res.status(500).json({ error: "Erreur d'appel au webhook", details: e.message });
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const corps = req.body || {};
  if (corps.action === "apply") return traiterApplication(req, res);
  return traiterEcriture(req, res);
}
