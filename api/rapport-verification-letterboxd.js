// api/rapport-verification-letterboxd.js — CinéMaison V2
//
// Nouvelle route (16/09/2026), appelée par
// scripts/verifier-urls-letterboxd.js (GitHub Actions, déclenchement
// manuel) une fois l'audit terminé. Ne touche jamais au Sheet elle-même
// -- elle relaie juste la liste des fiches suspectes vers le webhook
// Apps Script (ENRICH_WEBHOOK_URL/SECRET, déjà configurés côté Vercel
// pour l'enrichissement) qui compose et envoie le mail récapitulatif
// (voir traiterRapportVerificationLetterboxdV1_ dans 09_WEBHOOK.gs).
//
// Contrairement à notifierWebhookReenrichissement (add-film.js/
// update-film.js), cet appel PEUT se permettre des réessais -- pas de
// contrainte de délai de réponse à l'app ici, et on préfère rater un
// peu de temps plutôt que de perdre le rapport si Apps Script répond
// mal une fois. D'où l'utilisation de appelerWebhookAvecReessai
// (lib/webhook.js), déjà utilisée ailleurs pour la même raison.

import { appelerWebhookAvecReessai } from "../lib/webhook.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { password, suspects, totalVerifies } = req.body || {};

  if (password !== process.env.ADD_FILM_PASSWORD) {
    return res.status(401).json({ error: "Mot de passe incorrect" });
  }

  if (!Array.isArray(suspects)) {
    return res.status(400).json({ error: "suspects doit être un tableau (vide si aucune anomalie)" });
  }

  const url = process.env.ENRICH_WEBHOOK_URL;
  const secret = process.env.ENRICH_WEBHOOK_SECRET;
  if (!url || !secret) {
    return res.status(500).json({ error: "ENRICH_WEBHOOK_URL/SECRET non configurés côté Vercel" });
  }

  const resultat = await appelerWebhookAvecReessai(url, {
    secret,
    action: "rapportVerificationLetterboxd",
    suspects,
    totalVerifies: Number(totalVerifies) || suspects.length,
  });

  if (!resultat.ok) {
    return res.status(502).json({ error: "Échec de l'envoi vers Apps Script", details: resultat.error });
  }

  return res.status(200).json({ ok: true, detail: resultat.corps });
}
