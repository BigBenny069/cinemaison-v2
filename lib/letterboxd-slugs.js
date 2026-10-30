// lib/letterboxd-slugs.js — CinéMaison V2 (30/10/2026)
//
// Fabrique la liste des adresses Letterboxd /film/{slug}/ à essayer pour un
// film, à partir de TOUS ses titres connus (français, original, anglais,
// titres alternatifs TMDb).
//
// Pourquoi : Letterboxd nomme ses pages avec le titre international (souvent
// anglais). Avant, on n'essayait que le titre de la plateforme (français) et
// le titre original -- ça échouait pour « Kaïro » (original en japonais, page
// « pulse-2001 »), « Le Couperet » (« the-ax »), etc. Et l'année de TMDb
// diffère parfois d'un an de celle de Letterboxd.

/** Même algorithme que slugLetterboxd_ (03_LETTERBOXD.gs). */
export function slugifier(texte) {
  return String(texte || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * @param {string[]} titres  titres connus, du plus fiable au moins fiable
 * @param {number|string} annee
 * @returns {{titre:string, url:string}[]}  candidats sans doublon, dans l'ordre
 */
export function candidatsLetterboxd(titres, annee) {
  const an = Number(annee) || 0;
  const vus = new Set();
  const sortie = [];
  const ajouter = (titre, slug, suffixe) => {
    const s = suffixe ? slug + "-" + suffixe : slug;
    if (!slug || vus.has(s)) return;
    vus.add(s);
    sortie.push({ titre, url: "https://letterboxd.com/film/" + s + "/" });
  };
  const slugsVus = new Set();
  for (const titre of titres) {
    const slug = slugifier(titre);
    if (!slug || slugsVus.has(slug)) continue;
    slugsVus.add(slug);
    ajouter(titre, slug, "");
    if (an) {
      ajouter(titre, slug, String(an));
      ajouter(titre, slug, String(an - 1));
      ajouter(titre, slug, String(an + 1));
    }
  }
  return sortie;
}
