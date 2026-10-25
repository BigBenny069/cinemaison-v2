// Fusion (25/10/2026, point B de l'audit) -- cet unique fichier remplace
// api/prime-ignores.js ET l'ancien api/streaming-ignores.js, pour
// libérer 1 des 12 fonctions de la limite Vercel Hobby.
//
// Aiguillage :
//  - GET sans ?plateforme= (ou PRIME), POST sans plateforme (ou PRIME) ->
//    code Prime historique (lib/prime-ignores-handler.js, onglet
//    PRIME_IGNORES) ;
//  - toute autre plateforme -> code générique
//    (lib/streaming-ignores-handler.js, onglet STREAMING_IGNORES).
//
// L'ancienne adresse /api/prime-ignores reste valable grâce à la
// redirection du fichier vercel.json (prime.js n'a donc rien à changer).
import handlerPrime from "../lib/prime-ignores-handler.js";
import handlerGenerique from "../lib/streaming-ignores-handler.js";

export default async function handler(req, res) {
  const plateforme = req.method === "GET"
    ? (req.query || {}).plateforme
    : (req.body || {}).plateforme;
  if (!plateforme || plateforme === "PRIME") return handlerPrime(req, res);
  return handlerGenerique(req, res);
}
