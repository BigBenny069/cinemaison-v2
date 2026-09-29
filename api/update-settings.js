// api/update-settings.js
//
// Écrit les réglages du résumé quotidien par email (activation, seuil de
// jours, destinataires) via le webhook Apps Script déjà en place
// (09_WEBHOOK.gs) — jamais d'écriture directe dans le Sheet CONFIG depuis
// ici, pour éviter toute erreur de colonne : c'est Apps Script qui sait
// où et comment écrire (ecrireConfig_), pas ce fichier.
//
// MODIFIÉ (29/09/2026) -- absorbe aussi les deux boutons "Réglages"
// de rapports à la demande (contrôle doublons + renvoi du mail écarts
// plateformes), plutôt que de créer un nouveau fichier api/*.js :
// Vercel (plan Hobby) plafonne à 12 fonctions serverless, déjà
// atteint. Ce fichier suivait déjà EXACTEMENT le même schéma (mot de
// passe + relais webhook Apps Script avec un "action"), donc pas de
// vraie duplication -- juste une branche en plus sur le même point
// d'entrée, distinguée par la présence de `type` dans le corps de la
// requête (absent = comportement digest inchangé).
//
// Réutilise les mêmes variables d'environnement Vercel que update-film.js :
//   ENRICH_WEBHOOK_URL, ENRICH_WEBHOOK_SECRET (déjà configurées)
//   ADD_FILM_PASSWORD (même mot de passe que le reste de l'app)

import { appelerWebhookAvecReessai } from "../lib/webhook.js";

const ACTIONS_RAPPORT = {
  doublons: "lancerControleDoublons",
  ecarts: "renvoyerRapportEcarts",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { password, actif, seuilJours, destinataires, type } = req.body || {};

  if (password !== process.env.ADD_FILM_PASSWORD) {
    return res.status(401).json({ error: "Mot de passe incorrect" });
  }

  const url = process.env.ENRICH_WEBHOOK_URL;
  const secret = process.env.ENRICH_WEBHOOK_SECRET;

  if (!url || !secret) {
    return res.status(500).json({ error: "ENRICH_WEBHOOK_URL/SECRET non configurés sur Vercel" });
  }

  // NOUVEAU (29/09/2026) -- `type` présent = un des deux boutons de
  // rapport à la demande, pas les réglages du digest.
  if (type) {
    const action = ACTIONS_RAPPORT[type];
    if (!action) {
      return res.status(400).json({ error: "type inconnu (attendu : \"doublons\" ou \"ecarts\")" });
    }

    const resultatRapport = await appelerWebhookAvecReessai(url, { secret, action });

    if (!resultatRapport.ok) {
      return res.status(502).json({ error: "Le webhook Apps Script a échoué après " + resultatRapport.tentative + " tentative(s) : " + resultatRapport.error });
    }

    return res.status(200).json({ ok: true, ...resultatRapport.corps });
  }

  const resultat = await appelerWebhookAvecReessai(url, {
    secret,
    action: "updateDigestSettings",
    actif: !!actif,
    seuilJours: Number(seuilJours) || 7,
    destinataires: String(destinataires || "").trim(),
  });

  if (!resultat.ok) {
    return res.status(502).json({ error: "Le webhook Apps Script a échoué après " + resultat.tentative + " tentative(s) : " + resultat.error });
  }

  return res.status(200).json({ ok: true, ...resultat.corps });
}
