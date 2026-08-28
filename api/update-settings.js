// api/update-settings.js
//
// Écrit les réglages du résumé quotidien par email (activation, seuil de
// jours, destinataires) via le webhook Apps Script déjà en place
// (09_WEBHOOK.gs) — jamais d'écriture directe dans le Sheet CONFIG depuis
// ici, pour éviter toute erreur de colonne : c'est Apps Script qui sait
// où et comment écrire (ecrireConfig_), pas ce fichier.
//
// Réutilise les mêmes variables d'environnement Vercel que update-film.js :
//   ENRICH_WEBHOOK_URL, ENRICH_WEBHOOK_SECRET (déjà configurées)
//   ADD_FILM_PASSWORD (même mot de passe que le reste de l'app)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { password, actif, seuilJours, destinataires } = req.body || {};

  if (password !== process.env.ADD_FILM_PASSWORD) {
    return res.status(401).json({ error: "Mot de passe incorrect" });
  }

  const url = process.env.ENRICH_WEBHOOK_URL;
  const secret = process.env.ENRICH_WEBHOOK_SECRET;

  if (!url || !secret) {
    return res.status(500).json({ error: "ENRICH_WEBHOOK_URL/SECRET non configurés sur Vercel" });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const webhookRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret,
        action: "updateDigestSettings",
        actif: !!actif,
        seuilJours: Number(seuilJours) || 7,
        destinataires: String(destinataires || "").trim(),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const data = await webhookRes.json().catch(() => ({}));

    if (!data.ok) {
      return res.status(502).json({ error: data.error || "Le webhook a refusé la mise à jour" });
    }

    return res.status(200).json({ ok: true, ...data });
  } catch (e) {
    return res.status(500).json({ error: "Impossible de joindre le webhook", details: e.message });
  }
}
