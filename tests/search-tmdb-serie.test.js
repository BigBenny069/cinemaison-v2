// Test du repli « film classé série chez TMDb » de api/search-tmdb.js (réseau simulé).
import test from "node:test";
import assert from "node:assert/strict";
import handler from "../api/search-tmdb.js";

function simulerTmdb(reponses) {
  const appels = [];
  globalThis.fetch = async (url) => {
    appels.push(String(url));
    const u = String(url);
    for (const [motif, corps] of reponses) {
      if (u.includes(motif)) return { ok: true, status: 200, json: async () => corps };
    }
    return { ok: true, status: 200, json: async () => ({ results: [] }) };
  };
  return appels;
}
function appeler(query) {
  let code = 0, corps = null;
  const res = { status(c) { code = c; return this; }, json(b) { corps = b; return this; } };
  return handler({ query }, res).then(() => ({ code, corps }));
}

test("film introuvable chez les films mais présent chez les séries : résultat marqué tmdbSerie", async () => {
  process.env.TMDB_API_KEY = "k";
  const appels = simulerTmdb([
    ["search/tv", { results: [{ id: 308112, name: "Mel Brooks: The 99 Year Old Man!", first_air_date: "2026-01-22", poster_path: null }] }],
    ["/tv/308112/", { created_by: [{ name: "Judd Apatow" }] }],
  ]);
  const { code, corps } = await appeler({ q: "Mel Brooks: The 99 Year Old Man!", type: "Documentaire" });
  assert.equal(code, 200);
  assert.equal(corps.results.length, 1);
  assert.equal(corps.results[0].tmdbId, 308112);
  assert.equal(corps.results[0].annee, "2026");
  assert.equal(corps.results[0].tmdbSerie, true);
  assert.ok(appels.some((u) => u.includes("search/movie")), "les films sont cherchés d'abord");
});

test("film trouvé chez les films : aucun marquage série, pas de recherche série", async () => {
  process.env.TMDB_API_KEY = "k";
  const appels = simulerTmdb([
    ["search/movie", { results: [{ id: 550, title: "Fight Club", release_date: "1999-10-15", poster_path: null }] }],
  ]);
  const { corps } = await appeler({ q: "Fight Club", type: "Film" });
  assert.equal(corps.results[0].tmdbId, 550);
  assert.equal(corps.results[0].tmdbSerie, undefined);
  assert.ok(!appels.some((u) => u.includes("search/tv")));
});

test("catégorie Série : résultats de séries sans marquage particulier", async () => {
  process.env.TMDB_API_KEY = "k";
  simulerTmdb([["search/tv", { results: [{ id: 1396, name: "Breaking Bad", first_air_date: "2008-01-20", poster_path: null }] }]]);
  const { corps } = await appeler({ q: "Breaking Bad", type: "Série" });
  assert.equal(corps.results[0].tmdbSerie, undefined);
});
