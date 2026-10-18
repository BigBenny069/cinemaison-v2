import { google } from "googleapis";
import { lireLetterboxd } from "../lib/letterboxd.js";

// Colonnes qu'on expose au front pour l'instant (sous-ensemble des 53
// colonnes du Sheet — on élargira au fil du développement des écrans).
// Exporté (12/09/2026, point 6) pour le test de cohérence avec
// HEADER_TO_CAMEL -- voir tests-get-films.js.
export const EXPOSED_COLUMNS = [
  "ID", "Titre", "Annee", "Plateforme", "Duree", "DateDisponibilite", "Type",
  "StatutAcces", "TypeConfirme",
  "Genre", "GenrePrincipal", "Benoit", "Romy", "À deux", "En famille", "Vu",
  "Affiche", "NoteTMDb", "Casting", "Réalisateur", "Synopsis",
  "NoteLetterboxd", "VotesLetterboxd", "URLLetterboxd", "DateDisponibiliteAuto",
  "URLBandeAnnonce", "TMDbID", "IMDbID", "CanalContentId", "URLPlateforme",
  "TitreOriginal",
];

// V1.1 (08/09/2026) : mode léger (?leger=1) utilisé par prime.js, qui
// n'a besoin que de ces 5 champs pour faire correspondre un titre Prime
// à un ID CinéMaison. Renvoyer Synopsis/Casting/Affiche pour chacune des
// 1000+ fiches à chaque scraping Prime alourdissait beaucoup la réponse
// pour rien -- probable facteur aggravant des coupures réseau (ECONNRESET)
// rencontrées le 08/09/2026 sur une connexion moins stable.
// MODIFIÉ (24/09/2026) -- "Type" ajouté : nécessaire pour que les
// collecteurs puissent repérer une fiche existante mal étiquetée
// Film/Série (comparaison avec le contenu réel de la page -- voir
// estSerie dans prime.js/netflix.js/disney.js). Un seul champ texte
// de plus, coût négligeable sur le volume déjà transmis en mode léger.
// MODIFIÉ (27/09/2026) -- "TypeConfirme" ajouté : un mail "Type
// possiblement incohérent" peut se tromper (détection en défaut, pas
// la fiche -- ex. "Surveillant!"/"Nine Perfect Strangers", confirmées
// séries à la main par Ben). "Confirmer le Type actuel" (voir
// api/confirm.js, page=confirmerTypeActuel) pose ce drapeau sans
// changer Type -- les collecteurs sautent alors la comparaison pour
// cette fiche, au lieu de re-signaler le même faux positif à chaque run.
const EXPOSED_COLUMNS_LEGER = ["ID", "Titre", "Annee", "Plateforme", "Duree", "Type", "TypeConfirme"];

async function getSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  const auth = new google.auth.GoogleAuth({
    credentials,
    // MODIFIÉ (18/10/2026) : droit d'écriture ajouté UNIQUEMENT pour mémoriser
    // les notes Letterboxd des suggestions (onglet SUGGESTIONS). La lecture
    // des fiches (Films) reste inchangée.
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const sheets = await getSheetsClient();
    const sheetId = process.env.GOOGLE_SHEET_ID;

    // NOUVEAU (18/10/2026) -- suggestions quotidiennes ("Pour toi") :
    // servies par ce même point d'entrée (?suggestions=1) car Vercel Hobby
    // plafonne à 12 fonctions et le projet est déjà au maximum.
    if (req.query.suggestions === "1") {
      const rep = await sheets.spreadsheets.values.batchGet({
        spreadsheetId: sheetId,
        ranges: ["SUGGESTIONS!A1:Z", "SUGGESTIONS_RETOURS!A1:F", "CONFIG!A1:C"],
      });
      const [sug, ret, conf] = (rep.data.valueRanges || []).map((v) => v.values || []);
      // Cartes déjà traitées (pas intéressé / n'aime pas / ajouté) : cachées
      // tout de suite, sans attendre le prochain passage d'Apps Script.
      const traitees = new Set((ret || []).slice(1).map((r) => String(r[0] || "")));
      const entetes = (sug && sug[0]) || [];
      const items = (sug || []).slice(1).map((r, n) => {
        const o = { _ligne: n + 2 };
        entetes.forEach((h, i) => { o[h] = r[i] !== undefined ? r[i] : ""; });
        return o;
      }).filter((o) => o.Titre && !traitees.has(String(o.Cle)));

      // Notes Letterboxd : cherchées ici (Vercel) car Apps Script est bloqué
      // par Letterboxd, puis mémorisées dans l'onglet pour ne pas les relire.
      // Films uniquement (Letterboxd ne gère pas les séries). Quelques fiches
      // par ouverture, les mieux classées d'abord, avec un temps limité.
      const colNote = entetes.indexOf("NoteLetterboxd");
      if (colNote >= 0) {
        const aChercher = items
          .filter((o) => o.Type === "Film" && o.TMDbID && !String(o.NoteLetterboxd || "").trim())
          .sort((a, b) => (parseFloat(b.Score) || 0) - (parseFloat(a.Score) || 0))
          .slice(0, 8);
        if (aChercher.length) {
          const trouvees = [];
          const lecture = Promise.all(aChercher.map(async (o) => {
            try {
              const r = await lireLetterboxd(`https://letterboxd.com/tmdb/${String(o.TMDbID).trim()}/`);
              if (r && r.ok && r.note) { o.NoteLetterboxd = String(r.note); trouvees.push(o); }
            } catch (e) { /* on réessaiera à la prochaine ouverture */ }
          }));
          await Promise.race([lecture, new Promise((ok) => setTimeout(ok, 6500))]);
          if (trouvees.length) {
            const lettre = (i) => { let n = i + 1, t = ""; while (n > 0) { const m = (n - 1) % 26; t = String.fromCharCode(65 + m) + t; n = Math.floor((n - 1) / 26); } return t; };
            try {
              await sheets.spreadsheets.values.batchUpdate({
                spreadsheetId: sheetId,
                requestBody: {
                  valueInputOption: "RAW",
                  // une même fiche peut figurer sur plusieurs plateformes : on remplit toutes ses lignes
                  data: items.filter((o) => trouvees.some((t) => t.Cle === o.Cle)).map((o) => {
                    const t = trouvees.find((x) => x.Cle === o.Cle);
                    o.NoteLetterboxd = t.NoteLetterboxd;
                    return { range: `SUGGESTIONS!${lettre(colNote)}${o._ligne}`, values: [[t.NoteLetterboxd]] };
                  }),
                },
              });
            } catch (e) { console.error("[suggestions] mémorisation des notes impossible :", e.message); }
          }
        }
      }
      let parPlateforme = 10;
      (conf || []).forEach((r) => {
        if (String(r[0]).trim() === "SuggestionsParPlateforme") parPlateforme = parseInt(r[1], 10) || 10;
      });
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ items, parPlateforme });
    }

    // On lit toute la feuille "Films" (en-têtes + lignes)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Films!A1:ZZ",
    });

    const rows = response.data.values || [];
    if (rows.length < 2) return res.status(200).json([]);

    const modeLeger = req.query.leger === "1";
    const colonnes = modeLeger ? EXPOSED_COLUMNS_LEGER : EXPOSED_COLUMNS;

    const headers = rows[0];
    const columnIndexes = colonnes.map((col) => headers.indexOf(col));

    const films = rows.slice(1).map((row) => {
      const film = {};
      colonnes.forEach((col, i) => {
        const idx = columnIndexes[i];
        film[toCamelCase(col)] = idx >= 0 ? row[idx] || null : null;
      });
      return film;
    }).filter((f) => f.titre); // ignore les lignes vides

    // Cache très court côté CDN Vercel (10s) — juste assez pour absorber
    // les rafales de requêtes (plusieurs onglets ouverts en même temps),
    // sans retarder l'apparition d'un ajout/modif récent. Les 5 minutes
    // d'origine causaient un délai perceptible après chaque ajout.
    res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate=30");
    return res.status(200).json(films);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Impossible de lire le Google Sheet", details: e.message });
  }
}

// Exporté (12/09/2026, point 6 du plan de fiabilisation) uniquement
// pour permettre un test automatisé de cohérence avec EXPOSED_COLUMNS
// -- voir tests-get-films.js. N'importe quelle colonne renommée ici
// mais absente d'EXPOSED_COLUMNS ne sera JAMAIS envoyée à l'app, en
// silence (bug réel constaté le 12/09/2026 avec CanalContentId).
export const HEADER_TO_CAMEL = {
  ID: "id", Titre: "titre", Annee: "annee", Plateforme: "plateforme",
  Duree: "duree", DateDisponibilite: "dateManuelle", Type: "type",
  // NOUVEAU (19/09/2026) -- Phase D du chantier "Séparer Catégorie et
  // Statut dans Type" : StatutAcces porte désormais Inclus/VOD/Indispo/
  // Bientôt disponible/Abonnement complémentaire, Type ne garde plus
  // que Film/Série/Documentaire/Spectacle. Peut être vide pour une
  // fiche jamais retouchée depuis la migration (Phase C) -- équivaut
  // alors à "Inclus", à traiter comme tel côté App.jsx plutôt que
  // d'écrire "Inclus" partout rétroactivement.
  StatutAcces: "statutAcces",
  TypeConfirme: "typeConfirme",
  Genre: "genre", GenrePrincipal: "genrePrincipal", Benoit: "benoit",
  Romy: "romy", "À deux": "aDeux", "En famille": "enFamille", Vu: "vu",
  Affiche: "affiche", NoteTMDb: "noteTMDb", Casting: "casting",
  Réalisateur: "realisateur", Synopsis: "synopsis",
  NoteLetterboxd: "noteLetterboxd", VotesLetterboxd: "votesLetterboxd",
  URLLetterboxd: "urlLetterboxd", DateDisponibiliteAuto: "dateAuto",
  TMDbID: "tmdbId", IMDbID: "imdbId",
  CanalContentId: "canalContentId", URLPlateforme: "urlPlateforme",
  TitreOriginal: "titreOriginal",
  URLBandeAnnonce: "urlBandeAnnonce",
};

function toCamelCase(header) {
  return HEADER_TO_CAMEL[header] || header;
}

