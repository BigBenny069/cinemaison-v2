// Équivalent générique de prime-ignores.js (laissé tel quel pour Prime),
// pour Netflix/Disney+/toute plateforme future -- dispatch par méthode
// HTTP, filtrage par ?plateforme= en GET, plateforme dans le corps en POST.
import { listerIgnores, ajouterIgnore } from "../lib/streaming-ignores.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { plateforme } = req.query || {};
    try {
      const ignores = await listerIgnores(plateforme);
      return res.status(200).json(ignores);
    } catch (e) {
      console.error("[streaming-ignores][GET] Erreur :", e.message);
      return res.status(500).json({ error: "Erreur lecture", details: e.message });
    }
  }

  if (req.method === "POST") {
    const { password, titre, plateforme, type, idCible } = req.body || {};

    if (password !== process.env.ADD_FILM_PASSWORD) {
      return res.status(401).json({ error: "Mot de passe invalide" });
    }
    if (!titre || !plateforme || (type !== "SUGGESTION" && type !== "AMBIGUITE" && type !== "ALIAS")) {
      return res.status(400).json({ error: "titre, plateforme et type (SUGGESTION|AMBIGUITE|ALIAS) requis" });
    }
    if (type === "ALIAS" && !idCible) {
      return res.status(400).json({ error: "idCible requis pour le type ALIAS" });
    }

    try {
      await ajouterIgnore(titre, plateforme, type, idCible);
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error("[streaming-ignores][POST] Erreur :", e.message);
      return res.status(500).json({ error: "Erreur écriture", details: e.message });
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}
