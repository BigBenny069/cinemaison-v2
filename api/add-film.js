import { google } from "googleapis";
import { lireLetterboxd } from "../lib/letterboxd.js";
import { declencherWorkflowLetterboxdV1_ } from "../lib/github-actions.js";

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

// NOUVEAU (16/09/2026) : même fonction que update-film.js (duplicata
// volontaire, pas de module partagé pour l'instant) -- prévient le
// webhook Apps Script (09_WEBHOOK.gs) pour un enrichissement TMDb
// immédiat (affiche, casting, réalisateur, synopsis, genre, note) plutôt
// que d'attendre le prochain passage du cycle programmé
// enrichirNouvellesFichesV4 (jusqu'à 5 min). Corrige un comportement
// perturbant constaté par Ben : une fiche fraîchement ajoutée restait
// visiblement "nue" (sans affiche ni infos) pendant plusieurs minutes.
// Ne bloque JAMAIS la réponse à l'app en cas d'échec/lenteur : si la
// variable d'environnement n'est pas configurée, ou si l'appel
// échoue/timeout, on continue normalement -- la fiche a déjà été créée,
// seule la relance immédiate est manquée (le cycle programmé prendra
// quand même le relais plus tard).
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

  const { password, titre, annee, plateforme, type, statutAcces, dateManuelle, urlLetterboxd } = req.body || {};

  if (password !== process.env.ADD_FILM_PASSWORD) {
    return res.status(401).json({ error: "Mot de passe incorrect" });
  }

  if (!titre || !annee || !plateforme || !type) {
    return res.status(400).json({ error: "Titre, année, plateforme et type sont obligatoires" });
  }

  // NOUVEAU (03/09/2026) : si une URL Letterboxd est fournie à la
  // création (typiquement /tmdb/{id}, pré-remplie côté app), on essaie
  // de la résoudre et d'en extraire note/votes tout de suite, ici, sur
  // Vercel — plutôt que de compter sur Apps Script qui, exécuté via un
  // déclencheur, s'est révélé bloqué de façon reproductible sur ce
  // type de requête (voir lib/letterboxd.js pour le contexte complet).
  // En cas d'échec, on ne bloque JAMAIS la création du film : on garde
  // l'URL telle que fournie, et le cycle d'enrichissement Apps Script
  // habituel prendra le relais comme avant (aucune régression).
  let letterboxdUrlFinale = urlLetterboxd || "";
  let letterboxdNote = "";
  let letterboxdVotes = "";
  let tmdbIdExtrait = "";
  if (urlLetterboxd) {
    try {
      // Même correctif que update-film.js (régression identifiée le
      // 15/09/2026) -- voir sa note pour le détail complet.
      const delaiMaxMs = 12000;
      const resultat = await Promise.race([
        lireLetterboxd(urlLetterboxd),
        new Promise((resolve) => setTimeout(() => resolve({ ok: false, reason: "délai dépassé (" + delaiMaxMs + "ms)" }), delaiMaxMs)),
      ]);
      if (resultat.ok) {
        letterboxdUrlFinale = resultat.url;
        letterboxdNote = resultat.note;
        letterboxdVotes = resultat.votes;
        if (resultat.tmdbId) tmdbIdExtrait = resultat.tmdbId;
      } else {
        console.error("[add-film] Letterboxd non résolu à la création :", resultat.reason);
      }
    } catch (e) {
      console.error("[add-film] Erreur inattendue lors de la lecture Letterboxd :", e.message);
    }
  }

  // MODIFIÉ (16/09/2026) : auparavant, le déclenchement du workflow
  // GitHub Actions de secours (résolution par déduction du slug, voir
  // resoudre-letterboxd.js) n'avait lieu QUE si une URL avait été
  // fournie ET que la tentative Vercel ci-dessus avait échoué -- ce qui
  // laissait deux cas sans AUCUNE tentative de résolution à la création :
  // les séries (le lien /tmdb/{id} ne fonctionne officiellement que pour
  // les films, l'app ne pré-remplit donc jamais urlLetterboxd pour une
  // série) et les fiches ajoutées en tapant le titre à la main sans
  // passer par l'autocomplete TMDb (urlLetterboxd reste vide côté app).
  // Dans ces deux cas, Ben devait attendre le cycle programmé ou cliquer
  // "Redemander une vérification" -- pas immédiat comme souhaité. Le
  // déclenchement est donc maintenant inconditionnel dès qu'on n'a pas
  // déjà une résolution réussie en poche : la méthode par déduction du
  // slug (resoudre-letterboxd.js) n'a de toute façon besoin que du titre
  // et de l'année, déjà connus à ce stade, pas d'un TMDbID ni d'une URL
  // pré-remplie.
  if (!letterboxdNote) {
    declencherWorkflowLetterboxdV1_().catch(() => {});
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
    // NOUVEAU (19/09/2026) -- Phase D. Optionnel : à la création, une
    // fiche est presque toujours "Inclus" (laissé vide plutôt que
    // d'écrire "Inclus" partout -- voir get-films.js), sauf cas rare
    // où l'appelant (app ou CinéRadar) sait déjà que ce n'est pas le
    // cas. N'écrit que si explicitement fourni.
    if (statutAcces) setField("StatutAcces", statutAcces);
    if (dateManuelle) setField("DateDisponibilite", dateManuelle);
    if (letterboxdUrlFinale) setField("URLLetterboxd", letterboxdUrlFinale);
    if (letterboxdNote) setField("NoteLetterboxd", letterboxdNote);
    if (letterboxdVotes) setField("VotesLetterboxd", letterboxdVotes);
    // Écrit seulement si la colonne est encore vide côté client (on ne
    // vient jamais écraser un TMDbID déjà saisi à la main) -- ici c'est
    // toujours le cas puisqu'il s'agit d'une création.
    if (tmdbIdExtrait) setField("TMDbID", tmdbIdExtrait);

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

    // NOUVEAU (16/09/2026) : relance immédiate de l'enrichissement TMDb
    // (affiche, casting, réalisateur, synopsis, genre, note) au lieu
    // d'attendre jusqu'à 5 min le prochain passage du cycle programmé
    // enrichirNouvellesFichesV4 -- voir notifierWebhookReenrichissement
    // ci-dessus pour le comportement en cas d'échec (n'affecte jamais la
    // réponse renvoyée à l'app, la fiche est déjà créée à ce stade).
    const webhook = await notifierWebhookReenrichissement(newId);

    return res.status(200).json({
      id: newId,
      titre,
      annee,
      plateforme,
      type,
      letterboxdResolu: !!letterboxdNote,
      // Remonté dans la réponse aussi, pas seulement les logs — utile pour
      // que CinéRadar (ou tout autre appelant) voie immédiatement si un de
      // ses champs n'a pas pu être écrit, sans avoir à consulter les logs.
      champsIgnores: champsIgnores.length > 0 ? champsIgnores : undefined,
      webhook,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Impossible d'ajouter le film au Google Sheet", details: e.message });
  }
}
