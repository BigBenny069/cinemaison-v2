// Fusionné (06/09/2026, correctif limite Vercel Hobby 12 fonctions) --
// avant : get-prime-ignores.js (GET) + write-prime-ignore.js (POST)
// séparés. Même fichier, dispatch par méthode HTTP.
import { listerIgnores, ajouterIgnore } from "../lib/prime-ignores.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const ignores = await listerIgnores();
      return res.status(200).json(ignores);
    } catch (e) {
      console.error("[prime-ignores][GET] Erreur :", e.message);
      return res.status(500).json({ error: "Erreur lecture", details: e.message });
    }
  }

  if (req.method === "POST") {
    const { password, titre, type, idCible } = req.body || {};

    if (password !== process.env.ADD_FILM_PASSWORD) {
      return res.status(401).json({ error: "Mot de passe invalide" });
    }
    if (!titre || (type !== "SUGGESTION" && type !== "AMBIGUITE" && type !== "ALIAS")) {
      return res.status(400).json({ error: "titre et type (SUGGESTION|AMBIGUITE|ALIAS) requis" });
    }
    if (type === "ALIAS" && !idCible) {
      return res.status(400).json({ error: "idCible requis pour le type ALIAS" });
    }

    try {
      await ajouterIgnore(titre, type, idCible);
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error("[prime-ignores][POST] Erreur :", e.message);
      return res.status(500).json({ error: "Erreur écriture", details: e.message });
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}
