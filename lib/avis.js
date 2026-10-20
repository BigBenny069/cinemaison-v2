// lib/avis.js -- avis de Ben sur ses films (19/10/2026)
//
// 5 niveaux : 1 = J'aime pas, 2 = Neutre, 3 = J'aime bien, 4 = J'adore,
// 5 = J'adore++. Enregistrés dans l'onglet AVIS (créé au besoin). Lu ensuite
// par Apps Script (25_SUGGESTIONS_JUSTWATCH.js) pour affiner les suggestions.
//
// Deux sources : à la SUPPRESSION d'une fiche (le film disparaît du Sheet,
// mais son avis et ses genres/réalisateur/acteurs restent ici), ou depuis le
// bouton "Mon avis" d'une fiche gardée. Un seul avis par film (le dernier
// remplace le précédent).
//
// Module (pas une fonction Vercel) : le plan Hobby est limité à 12 fonctions.

export const ONGLET_AVIS = "AVIS";
export const ENTETES_AVIS = [
  "Cle", "Titre", "Annee", "Type", "Genres", "Realisateur", "Casting", "Avis", "Date", "Origine", "TMDbID",
];

export function avisValide(v) {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}

function normaliserTitre(t) {
  return String(t || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Même format de clé que les suggestions : "movie:123" / "tv:456", sinon titre:année. */
export function cleAvis({ titre, annee, type, tmdbId }) {
  const id = String(tmdbId || "").trim();
  if (id) return (String(type || "").trim() === "Série" ? "tv:" : "movie:") + id;
  return "t:" + normaliserTitre(titre) + ":" + String(annee || "").trim();
}

/** Ligne de l'onglet Films -> objet film (par noms de colonnes). */
export function filmDepuisLigne(entetes, ligne) {
  const get = (nom) => {
    const i = entetes.indexOf(nom);
    return i >= 0 ? String(ligne[i] || "").trim() : "";
  };
  return {
    id: get("ID"),
    titre: get("Titre"),
    annee: get("Annee"),
    type: get("Type"),
    tmdbId: get("TMDbID"),
    genres: get("Genre"),
    realisateur: get("Réalisateur"),
    casting: get("Casting"),
  };
}

/** Cherche la fiche d'un ID dans l'onglet Films. */
export async function trouverFilm(sheets, spreadsheetId, id) {
  const r = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Films!A1:ZZ" });
  const lignes = r.data.values || [];
  const entetes = lignes[0] || [];
  const col = entetes.indexOf("ID");
  const ligne = lignes.find((l, i) => i > 0 && l[col] === id);
  return ligne ? filmDepuisLigne(entetes, ligne) : null;
}

async function assurerOnglet(sheets, spreadsheetId) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: "sheets.properties.title" });
  const existe = (meta.data.sheets || []).some((s) => s.properties.title === ONGLET_AVIS);
  if (existe) return;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ addSheet: { properties: { title: ONGLET_AVIS } } }] },
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${ONGLET_AVIS}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: [ENTETES_AVIS] },
  });
}

/** Enregistre (ou remplace) l'avis d'un film. origine = "suppression" | "fiche". */
export async function enregistrerAvis(sheets, spreadsheetId, film, avis, origine) {
  const note = avisValide(avis);
  if (!note) throw new Error("Avis invalide");
  await assurerOnglet(sheets, spreadsheetId);

  const cle = cleAvis(film);
  const ligne = [
    cle, film.titre || "", film.annee || "", film.type || "", film.genres || "",
    film.realisateur || "", film.casting || "", note,
    new Date().toISOString().slice(0, 10), origine || "", film.tmdbId || "",
  ];

  const lu = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${ONGLET_AVIS}!A1:A` });
  const colonne = lu.data.values || [];
  const i = colonne.findIndex((r, idx) => idx > 0 && String(r[0] || "") === cle);
  if (i >= 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId, range: `${ONGLET_AVIS}!A${i + 1}:K${i + 1}`, valueInputOption: "RAW",
      requestBody: { values: [ligne] },
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId, range: `${ONGLET_AVIS}!A:K`, valueInputOption: "RAW",
      requestBody: { values: [ligne] },
    });
  }
}

/** Avis actuel d'un film (1 à 5) ou null. */
export async function lireAvis(sheets, spreadsheetId, film) {
  let r;
  try {
    r = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${ONGLET_AVIS}!A1:H` });
  } catch (e) {
    return null; // onglet pas encore créé
  }
  const cle = cleAvis(film);
  const ligne = (r.data.values || []).find((l, i) => i > 0 && String(l[0] || "") === cle);
  return ligne ? avisValide(ligne[7]) : null;
}
