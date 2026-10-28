// lib/explorer-outils.js — CinéMaison V2 (29/10/2026)
//
// Petites fonctions PURES de l'écran Explorer (testées dans
// tests/explorer-outils.test.js) :
//  - poidsCeSoir : plus un film part bientôt, plus il a de chances d'être proposé ;
//  - tirerPondere : tirage au hasard tenant compte de ces poids ;
//  - vuesNettoyer : relit les "recherches enregistrées" stockées sur le
//    téléphone en écartant tout ce qui est abîmé ou inattendu.

// Jours restants avant le départ (ou null) -> poids de tirage.
export function poidsCeSoir(joursRestants) {
  if (joursRestants == null || joursRestants < 0) return 1;
  if (joursRestants <= 14) return 3;
  if (joursRestants <= 30) return 2;
  return 1;
}

// Tire un élément au hasard, proportionnellement à son poids.
// `exclus` : ids déjà proposés ; une fois tous proposés, on repart de zéro.
export function tirerPondere(items, getPoids, getId, exclus = [], rnd = Math.random) {
  if (!items || items.length === 0) return null;
  let pool = items.filter((it) => !exclus.includes(getId(it)));
  if (pool.length === 0) pool = items;
  const total = pool.reduce((s, it) => s + Math.max(0, getPoids(it)), 0);
  if (total <= 0) return pool[Math.floor(rnd() * pool.length)];
  let r = rnd() * total;
  for (const it of pool) {
    r -= Math.max(0, getPoids(it));
    if (r < 0) return it;
  }
  return pool[pool.length - 1];
}

export const VUES_MAX = 12;

// Texte JSON lu dans localStorage -> liste propre de recherches enregistrées.
export function vuesNettoyer(brut) {
  let arr;
  try { arr = typeof brut === "string" ? JSON.parse(brut) : brut; } catch { return []; }
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((v) => v && typeof v.nom === "string" && v.nom.trim() && v.filtres && typeof v.filtres === "object")
    .map((v) => ({ nom: v.nom.trim().slice(0, 30), filtres: v.filtres }))
    .slice(0, VUES_MAX);
}

// Ajoute (ou remplace, même nom sans tenir compte de la casse) une recherche.
export function vuesAjouter(vues, nom, filtres) {
  const n = String(nom || "").trim().slice(0, 30);
  if (!n) return vues;
  const sans = vues.filter((v) => v.nom.toLowerCase() !== n.toLowerCase());
  return [{ nom: n, filtres }, ...sans].slice(0, VUES_MAX);
}
