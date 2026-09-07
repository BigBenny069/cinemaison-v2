import { listerIgnores } from "./_prime-ignores.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const ignores = await listerIgnores();
    return res.status(200).json(ignores);
  } catch (e) {
    console.error("[get-prime-ignores] Erreur :", e.message);
    return res.status(500).json({ error: "Erreur lecture", details: e.message });
  }
}
