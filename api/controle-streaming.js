// Fusion (25/10/2026, point B de l'audit) -- cet unique fichier remplace
// api/controle-prime.js ET l'ancien api/controle-streaming.js, pour
// libérer 1 des 12 fonctions de la limite Vercel Hobby.
//
// Aiguillage :
//  - pas de "plateforme" dans la requête, ou plateforme = "PRIME" ->
//    code Prime historique (lib/controle-prime-handler.js, copié tel quel,
//    onglet CONTROLE_PRIME) ;
//  - toute autre plateforme (NETFLIX, DISNEY...) -> code générique
//    (lib/controle-streaming-handler.js, onglet CONTROLE_<PLATEFORME>).
//
// L'ancienne adresse /api/controle-prime reste valable grâce à la
// redirection du fichier vercel.json (prime.js n'a donc rien à changer).
import handlerPrime from "../lib/controle-prime-handler.js";
import handlerGenerique from "../lib/controle-streaming-handler.js";

export default async function handler(req, res) {
  const plateforme = (req.body || {}).plateforme;
  if (!plateforme || plateforme === "PRIME") return handlerPrime(req, res);
  return handlerGenerique(req, res);
}
