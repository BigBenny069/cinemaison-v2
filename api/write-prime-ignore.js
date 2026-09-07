import { ajouterIgnore } from "./_prime-ignores.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { password, titre, type } = req.body || {};

  if (password !== process.env.ADD_FILM_PASSWORD) {
    return res.status(401).json({ error: "Mot de passe invalide" });
  }
  if (!titre || (type !== "SUGGESTION" && type !== "AMBIGUITE")) {
    return res.status(400).json({ error: "titre et type (SUGGESTION|AMBIGUITE) requis" });
  }

  try {
    await ajouterIgnore(titre, type);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[write-prime-ignore] Erreur :", e.message);
    return res.status(500).json({ error: "Erreur écriture", details: e.message });
  }
}
