// api/send-to-cineradar.js -- envoi d'un film de CinéMaison vers CinéRadar (21/11/2026)
//
// Bouton « Envoyer vers CinéRadar » de la fiche : pour un film plus disponible,
// envoie titre / année / réalisateur (+ identifiant TMDb et lien Letterboxd s'ils
// existent) à l'API add-movie de CinéRadar. L'appel part d'ici (serveur) : le mot de
// passe CinéRadar reste dans la variable d'environnement CINERADAR_PASSWORD et ne
// passe jamais par le navigateur.
//
// Si la fiche n'a pas de réalisateur mais a un identifiant TMDb, le réalisateur est
// demandé à CinéRadar (/api/search-tmdb?id=..., sans mot de passe).

import { google } from "../lib/google.js";

const CINERADAR = "https://cineradar-nu.vercel.app";

async function getSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return google.sheets({ version: "v4", auth });
}

async function lireFiche(id) {
  const sheets = await getSheetsClient();
  const r = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Films!A1:ZZ",
  });
  const lignes = r.data.values || [];
  const entetes = lignes[0] || [];
  const col = entetes.indexOf("ID");
  const ligne = lignes.find((l, i) => i > 0 && l[col] === id);
  if (!ligne) return null;
  const get = (nom) => {
    const i = entetes.indexOf(nom);
    return i >= 0 ? String(ligne[i] || "").trim() : "";
  };
  return {
    titre: get("Titre"),
    annee: get("Annee"),
    type: get("Type"),
    realisateur: get("Réalisateur"),
    tmdbId: get("TMDbID"),
    urlLetterboxd: get("URLLetterboxd"),
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }
  const { password, id } = req.body || {};
  if (password !== process.env.ADD_FILM_PASSWORD) {
    return res.status(401).json({ error: "Mot de passe incorrect" });
  }
  if (!id) return res.status(400).json({ error: "id obligatoire" });
  if (!process.env.CINERADAR_PASSWORD) {
    return res.status(500).json({ error: "Mot de passe CinéRadar pas encore configuré côté CinéMaison" });
  }

  try {
    const film = await lireFiche(id);
    if (!film) return res.status(404).json({ error: `Aucune fiche avec l'ID ${id}` });

    const annee = Number(String(film.annee).match(/\d{4}/)?.[0]);
    if (!film.titre || !annee) {
      return res.status(422).json({ error: "Titre ou année manquant sur cette fiche" });
    }

    let realisateur = film.realisateur;
    const tmdbId = /^\d+$/.test(film.tmdbId) ? Number(film.tmdbId) : null;
    if (!realisateur && tmdbId) {
      try {
        const r = await fetch(`${CINERADAR}/api/search-tmdb?id=${tmdbId}`);
        if (r.ok) realisateur = String((await r.json()).director || "").trim();
      } catch { /* on retombe sur le message "réalisateur manquant" */ }
    }
    if (!realisateur) {
      return res.status(422).json({ error: "Il manque le réalisateur sur cette fiche" });
    }

    const corps = {
      password: process.env.CINERADAR_PASSWORD,
      title: film.titre,
      year: annee,
      director: realisateur,
    };
    if (tmdbId) corps.confirmedTmdbId = tmdbId;
    if (/^https?:\/\//i.test(film.urlLetterboxd)) corps.letterboxdUrl = film.urlLetterboxd;

    const r = await fetch(`${CINERADAR}/api/add-movie`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corps),
    });
    const data = await r.json().catch(() => ({}));

    if (r.ok) return res.status(200).json({ ok: true });
    if (r.status === 401) return res.status(502).json({ error: "CinéRadar refuse le mot de passe enregistré (à corriger côté CinéMaison)" });
    if (r.status === 429) return res.status(429).json({ error: data.error || "Trop de tentatives, réessaie dans un moment" });
    if (r.status === 400) return res.status(422).json({ error: data.error || "CinéRadar refuse cette fiche (champ manquant)" });
    return res.status(502).json({ error: data.error || "Erreur côté CinéRadar" });
  } catch (e) {
    console.error("[send-to-cineradar]", e.message);
    return res.status(500).json({ error: "Envoi impossible pour le moment" });
  }
}
