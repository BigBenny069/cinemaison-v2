// lib/suggestions.js -- suggestions quotidiennes ("Pour toi"), CinéMaison V2
// Créé le 19/10/2026.
//
// Module appelé par api/get-films.js (Vercel Hobby plafonne à 12 fonctions et
// le projet est déjà au maximum : on ne crée donc PAS de nouvelle fonction).
//
//   GET  /api/get-films?suggestions=1[&enrichir=mail]
//        -> { items, parPlateforme, aujourdhui, aEnrichir }
//        Cherche aussi quelques notes Letterboxd manquantes (les titres du
//        mail d'abord) et les mémorise dans l'onglet SUGGESTIONS.
//
//   GET  /api/get-films?s=lien&a=AJ|PI|NA&k=<cle>&p=<plateforme>&t=<signature>
//        -> page de confirmation (RIEN n'est fait au simple chargement : les
//           antivirus / lecteurs de mail ouvrent parfois les liens seuls).
//   POST (même adresse) -> exécute l'action après clic sur "Valider".
//
// Variable d'environnement Vercel à créer :
//   SUGGESTIONS_LINK_SECRET  (même valeur que la ligne SuggestionsSecretLiens
//                             de l'onglet CONFIG)

import crypto from "crypto";
import { lireLetterboxd } from "./letterboxd.js";
import addFilm from "../api/add-film.js";

const FEUILLE = "SUGGESTIONS";
const FEUILLE_RETOURS = "SUGGESTIONS_RETOURS";

const ACTIONS = {
  AJ: { verdict: "AJOUTE", libelle: "Ajouter à CinéMaison" },
  PI: { verdict: "PAS_INTERESSE", libelle: "Pas intéressé" },
  NA: { verdict: "N_AIME_PAS", libelle: "N'aime pas" },
};

/* ------------------------------ outils ------------------------------ */

function aujourdhuiParis() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" }); // AAAA-MM-JJ
}

function isoDate(v) {
  const s = String(v || "").trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return "";
}

function lettreColonne(i) {
  let n = i + 1, t = "";
  while (n > 0) { const m = (n - 1) % 26; t = String.fromCharCode(65 + m) + t; n = Math.floor((n - 1) / 26); }
  return t;
}

function echapper(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function signature(action, cle, plateforme, secret) {
  return crypto.createHmac("sha256", secret).update(`${action}|${cle}|${plateforme}`).digest("hex").slice(0, 20);
}

function signatureValide(action, cle, plateforme, recue, secret) {
  const attendue = Buffer.from(signature(action, cle, plateforme, secret));
  const fournie = Buffer.from(String(recue || ""));
  return attendue.length === fournie.length && crypto.timingSafeEqual(attendue, fournie);
}

async function lireOnglets(sheets, sheetId) {
  const rep = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: sheetId,
    ranges: [`${FEUILLE}!A1:Z`, `${FEUILLE_RETOURS}!A1:F`, "CONFIG!A1:C"],
  });
  const [sug, ret, conf] = (rep.data.valueRanges || []).map((v) => v.values || []);
  const entetes = (sug && sug[0]) || [];
  const lignes = (sug || []).slice(1).map((r, n) => {
    const o = { _ligne: n + 2 };
    entetes.forEach((h, i) => { o[h] = r[i] !== undefined ? r[i] : ""; });
    o.PremiereVue = isoDate(o.PremiereVue);
    return o;
  }).filter((o) => o.Titre);
  const retours = new Set((ret || []).slice(1).map((r) => String(r[0] || "")));
  let parPlateforme = 10;
  (conf || []).forEach((r) => {
    if (String(r[0]).trim() === "SuggestionsParPlateforme") parPlateforme = parseInt(r[1], 10) || 10;
  });
  return { entetes, lignes, retours, parPlateforme };
}

async function ajouterRetour(sheets, sheetId, verdict, ligne) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${FEUILLE_RETOURS}!A:F`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[String(ligne.Cle), verdict, aujourdhuiParis(), ligne.Titre || "", ligne.Type || "", ligne.Genres || ""]],
    },
  });
}

/* --------------------------- point d'entrée ------------------------- */

export async function traiterSuggestions(req, res, sheets, sheetId) {
  if (req.query.s === "lien") return traiterLien(req, res, sheets, sheetId);
  if (req.method !== "GET") return res.status(405).json({ error: "Méthode non autorisée" });
  return servirListe(req, res, sheets, sheetId);
}

/* ----------------------------- la liste ----------------------------- */

async function servirListe(req, res, sheets, sheetId) {
  const { entetes, lignes, retours, parPlateforme } = await lireOnglets(sheets, sheetId);
  const items = lignes.filter((o) => !retours.has(String(o.Cle)));

  // Notes Letterboxd : cherchées ici (Vercel) car Apps Script est bloqué par
  // Letterboxd, puis mémorisées dans l'onglet pour ne pas les relire.
  // Films uniquement (Letterboxd ne gère pas les séries). Une poignée par
  // appel, titres du mail d'abord puis les mieux classés, temps limité.
  const colNote = entetes.indexOf("NoteLetterboxd");
  let aEnrichir = 0;
  if (colNote >= 0) {
    const manque = (o) => o.Type === "Film" && o.TMDbID && !String(o.NoteLetterboxd || "").trim();
    const parCle = new Map();
    items.filter(manque).forEach((o) => { if (!parCle.has(o.Cle)) parCle.set(o.Cle, o); });
    const ordre = [...parCle.values()].sort((a, b) => {
      const ma = a.DansMail === "OUI" ? 1 : 0, mb = b.DansMail === "OUI" ? 1 : 0;
      if (ma !== mb) return mb - ma;
      return (parseFloat(b.Score) || 0) - (parseFloat(a.Score) || 0);
    });
    const lot = ordre.slice(0, 8);
    const trouvees = new Map();
    if (lot.length) {
      const lecture = Promise.all(lot.map(async (o) => {
        try {
          const r = await lireLetterboxd(`https://letterboxd.com/tmdb/${String(o.TMDbID).trim()}/`);
          if (r && r.ok && r.note) trouvees.set(o.Cle, String(r.note));
        } catch (e) { /* on réessaiera au prochain appel */ }
      }));
      await Promise.race([lecture, new Promise((ok) => setTimeout(ok, 6500))]);

      if (trouvees.size) {
        const concernees = items.filter((o) => trouvees.has(o.Cle));
        concernees.forEach((o) => { o.NoteLetterboxd = trouvees.get(o.Cle); });
        try {
          await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: sheetId,
            requestBody: {
              valueInputOption: "RAW",
              data: concernees.map((o) => ({
                range: `${FEUILLE}!${lettreColonne(colNote)}${o._ligne}`,
                values: [[o.NoteLetterboxd]],
              })),
            },
          });
        } catch (e) { console.error("[suggestions] mémorisation des notes impossible :", e.message); }
      }
    }
    // Combien de titres DU MAIL attendent encore leur note (pour Apps Script)
    const restants = new Set();
    items.forEach((o) => {
      if (o.DansMail === "OUI" && manque(o) && !trouvees.has(o.Cle)) restants.add(o.Cle);
    });
    aEnrichir = restants.size;
  }

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({
    items: items.map((o) => { const { _ligne, ...reste } = o; return reste; }),
    parPlateforme,
    aujourdhui: aujourdhuiParis(),
    aEnrichir,
  });
}

/* --------------------- liens du mail (confirmation) ------------------ */

function pageHtml(titre, corps) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>${echapper(titre)}</title>
<style>
body{margin:0;background:#14110f;color:#f1e9dc;font-family:Georgia,serif;display:flex;min-height:100vh;align-items:center;justify-content:center}
.c{max-width:420px;width:100%;margin:16px;padding:28px 24px;background:#1f1a16;border:1px solid #3a322a;border-radius:16px;text-align:center}
h1{font-size:20px;margin:0 0 10px}p{color:#cbbfae;font-size:15px;line-height:1.4}
button,a.b{display:inline-block;margin-top:14px;padding:12px 28px;border:0;border-radius:24px;background:#e0a03b;color:#14110f;font-size:16px;font-weight:bold;text-decoration:none;cursor:pointer}
.s{font-size:12px;color:#8b7f70}
</style></head><body><div class="c">${corps}</div></body></html>`;
}

function envoyerPage(res, code, titre, corps) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  return res.status(code).send(pageHtml(titre, corps));
}

async function traiterLien(req, res, sheets, sheetId) {
  const secret = process.env.SUGGESTIONS_LINK_SECRET;
  const { a, k, p, t } = req.query;
  const action = ACTIONS[a];

  if (!secret) return envoyerPage(res, 500, "Lien indisponible", "<h1>Lien indisponible</h1><p>La clé secrète n'est pas configurée sur le serveur.</p>");
  if (!action || !k || !p || !signatureValide(a, k, p, t, secret)) {
    return envoyerPage(res, 403, "Lien invalide", "<h1>Lien invalide</h1><p>Ce lien n'est pas valide ou a été modifié.</p>");
  }

  const { lignes, retours } = await lireOnglets(sheets, sheetId);
  const ligne = lignes.find((o) => String(o.Cle) === k && String(o.Plateforme) === p)
    || lignes.find((o) => String(o.Cle) === k);

  if (retours.has(k)) {
    return envoyerPage(res, 200, "Déjà traité", `<h1>Déjà traité</h1><p>${echapper(ligne ? ligne.Titre : "Ce titre")} a déjà reçu une réponse.</p><a class="b" href="/?vue=suggestions">Ouvrir Pour toi</a>`);
  }
  if (!ligne) {
    return envoyerPage(res, 200, "Plus dans la liste", `<h1>Plus dans la liste</h1><p>Cette suggestion n'est plus proposée.</p><a class="b" href="/?vue=suggestions">Ouvrir Pour toi</a>`);
  }

  // GET = simple confirmation. Rien n'est enregistré.
  if (req.method !== "POST") {
    const qs = new URLSearchParams({ s: "lien", a, k, p, t }).toString();
    return envoyerPage(res, 200, action.libelle,
      `<h1>${echapper(action.libelle)} ?</h1>
       <p><b>${echapper(ligne.Titre)}</b> (${echapper(ligne.Annee)}) · ${echapper(ligne.Plateforme)}</p>
       <form method="POST" action="/api/get-films?${echapper(qs)}"><button type="submit">Valider</button></form>
       <p class="s">Tu peux fermer cette page pour annuler.</p>`);
  }

  // POST = exécution
  if (a === "AJ") {
    const faux = {
      method: "POST", headers: {},
      body: {
        password: process.env.ADD_FILM_PASSWORD,
        titre: ligne.Titre, annee: String(ligne.Annee || ""), plateforme: ligne.Plateforme,
        type: ligne.Type || "Film",
      },
    };
    let code = 200, charge = null;
    const fausseRep = { setHeader() {}, status(c) { code = c; return fausseRep; }, json(o) { charge = o; return fausseRep; }, end() { return fausseRep; }, send(o) { charge = o; return fausseRep; } };
    await addFilm(faux, fausseRep);
    if (code >= 400) {
      return envoyerPage(res, 500, "Ajout impossible",
        `<h1>Ajout impossible</h1><p>${echapper((charge && (charge.error || charge.details)) || "Erreur serveur")}</p><a class="b" href="/?vue=suggestions">Ouvrir Pour toi</a>`);
    }
  }
  await ajouterRetour(sheets, sheetId, action.verdict, ligne);

  const message = a === "AJ" ? "ajouté à CinéMaison" : a === "NA" ? "noté : je proposerai moins de ce genre" : "masqué";
  return envoyerPage(res, 200, "Fait",
    `<h1>C'est fait ✓</h1><p><b>${echapper(ligne.Titre)}</b> : ${message}.</p><a class="b" href="/?vue=suggestions">Ouvrir Pour toi</a>`);
}
