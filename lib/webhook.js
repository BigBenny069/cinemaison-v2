// lib/webhook.js — CinéMaison V2
//
// Appel du webhook Apps Script avec réessai automatique -- corrige
// l'erreur "Le webhook Apps Script a échoué" constatée le 14/09/2026
// sur "VALIDER ET APPLIQUER" (contrôle Disney+) : jusqu'ici, un seul
// essai était tenté depuis Vercel vers Apps Script, sans aucune
// tolérance aux ratés ponctuels (déjà observés côté collecteurs Node
// la veille -- réponses d'erreur Google Drive/404 transitoires).
// Même principe que lib-webhook.js (Collecteurs_NODE), adapté en ESM
// pour tourner côté Vercel.

/**
 * @param {string} url - URL du webhook (ENRICH_WEBHOOK_URL)
 * @param {object} corps - objet envoyé tel quel en JSON (avec le secret dedans)
 * @param {object} [options]
 * @param {number} [options.tentatives] - nombre total de tentatives (défaut 3)
 * @param {number} [options.delaiMs] - pause entre deux tentatives (défaut 2000)
 * @returns {Promise<{ ok: boolean, corps?: object, error?: string, tentative: number }>}
 */
export async function appelerWebhookAvecReessai(url, corps, options) {
  const tentatives = (options && options.tentatives) || 3;
  const delaiMs = (options && options.delaiMs) || 2000;

  let derniereErreur = null;

  for (let essai = 1; essai <= tentatives; essai++) {
    try {
      const reponse = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      const texte = await reponse.text();
      let json;
      try {
        json = texte ? JSON.parse(texte) : {};
      } catch (e) {
        json = {};
      }

      if (reponse.ok && json.ok !== false) {
        return { ok: true, corps: json, tentative: essai };
      }
      derniereErreur = "HTTP " + reponse.status + " : " + (json.error || texte.slice(0, 200) || "réponse vide");
    } catch (e) {
      derniereErreur = e.message;
    }

    if (essai < tentatives) {
      await new Promise((resolve) => setTimeout(resolve, delaiMs));
    }
  }

  return { ok: false, error: derniereErreur, tentative: tentatives };
}
