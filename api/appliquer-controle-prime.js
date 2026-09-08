// Appelé par le bouton de api/controle-prime-confirm.js après un vrai
// clic humain. Ne touche jamais Google Sheets directement -- relaie
// vers le webhook Apps Script (même URL/secret déjà utilisés par
// notifierWebhookReenrichissement dans update-film.js), qui lance
// appliquerResultatsPrimeOfficiel() pour de vrai côté Apps Script.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { password } = req.body || {};
  if (password !== process.env.ADD_FILM_PASSWORD) {
    return res.status(401).json({ error: "Mot de passe invalide" });
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
      body: JSON.stringify({ secret: secret, action: "appliquerControlePrime" }),
    });
    const corps = await reponse.json().catch(() => ({}));
    if (!reponse.ok || !corps.ok) {
      return res.status(502).json({ error: "Le webhook Apps Script a échoué", details: corps });
    }
    return res.status(200).json({ ok: true, resume: corps.resume });
  } catch (e) {
    console.error("[appliquer-controle-prime] Erreur :", e.message);
    return res.status(500).json({ error: "Erreur d'appel au webhook", details: e.message });
  }
}
