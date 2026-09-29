// api/lancer-rapport-admin.js
//
// Deux boutons dans Réglages (app React) : relancer le contrôle
// doublons + son mail à la demande, et renvoyer le mail "Écarts
// plateformes" sans attendre les déclencheurs automatiques
// (hebdomadaire pour les doublons, quotidien 8h pour les écarts).
// Même principe qu'update-settings.js -- jamais d'écriture directe
// dans le Sheet depuis ici, c'est Apps Script qui fait le travail
// (voir 09_WEBHOOK.gs, actions "lancerControleDoublons" et
// "renvoyerRapportEcarts").
//
// Réutilise les mêmes variables d'environnement Vercel que les autres
// routes qui passent par le webhook Apps Script :
//   ENRICH_WEBHOOK_URL, ENRICH_WEBHOOK_SECRET, ADD_FILM_PASSWORD

import { appelerWebhookAvecReessai } from "../lib/webhook.js";

const ACTIONS = {
  doublons: "lancerControleDoublons",
  ecarts: "renvoyerRapportEcarts",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { password, type } = req.body || {};

  if (password !== process.env.ADD_FILM_PASSWORD) {
    return res.status(401).json({ error: "Mot de passe incorrect" });
  }

  const action = ACTIONS[type];
  if (!action) {
    return res.status(400).json({ error: "type manquant ou inconnu (attendu : \"doublons\" ou \"ecarts\")" });
  }

  const url = process.env.ENRICH_WEBHOOK_URL;
  const secret = process.env.ENRICH_WEBHOOK_SECRET;

  if (!url || !secret) {
    return res.status(500).json({ error: "ENRICH_WEBHOOK_URL/SECRET non configurés sur Vercel" });
  }

  const resultat = await appelerWebhookAvecReessai(url, { secret, action });

  if (!resultat.ok) {
    return res.status(502).json({ error: "Le webhook Apps Script a échoué après " + resultat.tentative + " tentative(s) : " + resultat.error });
  }

  return res.status(200).json({ ok: true, ...resultat.corps });
}
