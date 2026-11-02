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

test("films voisins trouvés (liste non vide) mais le titre exact n'existe que chez les séries : la série passe en premier", async () => {
  process.env.TMDB_API_KEY = "k";
  simulerTmdb([
    ["search/movie", { results: [{ id: 9001, title: "Mel Brooks: Make a Noise", release_date: "2013-01-01", poster_path: null }] }],
    ["search/tv", { results: [
      { id: 308112, name: "Mel Brooks: The 99 Year Old Man!", first_air_date: "2026-01-22", poster_path: null },
      { id: 777, name: "Autre série", first_air_date: "2020-01-01", poster_path: null },
    ] }],
  ]);
  const { corps } = await appeler({ q: "mel brooks the 99 year old man", type: "Documentaire" });
  assert.equal(corps.results.length, 2, "la série au titre exact + le film voisin, pas l'autre série");
  assert.equal(corps.results[0].tmdbId, 308112);
  assert.equal(corps.results[0].tmdbSerie, true);
  assert.equal(corps.results[1].tmdbId, 9001);
  assert.equal(corps.results[1].tmdbSerie, undefined);
});

test("un film et une série de même titre : le film reste en premier", async () => {
  process.env.TMDB_API_KEY = "k";
  simulerTmdb([
    ["search/movie", { results: [{ id: 1, title: "Fargo", release_date: "1996-03-08", poster_path: null }] }],
    ["search/tv", { results: [{ id: 2, name: "Fargo", first_air_date: "2014-04-15", poster_path: null }] }],
  ]);
  const { corps } = await appeler({ q: "Fargo", type: "Film" });
  assert.equal(corps.results[0].tmdbId, 1);
  assert.equal(corps.results[0].tmdbSerie, undefined);
  assert.equal(corps.results[1].tmdbSerie, true);
});

test("film trouvé chez les films, aucune série de même titre : aucun marquage série", async () => {
  process.env.TMDB_API_KEY = "k";
  simulerTmdb([
    ["search/movie", { results: [{ id: 550, title: "Fight Club", release_date: "1999-10-15", poster_path: null }] }],
  ]);
  const { corps } = await appeler({ q: "Fight Club", type: "Film" });
  assert.equal(corps.results[0].tmdbId, 550);
  assert.equal(corps.results[0].tmdbSerie, undefined);
});

test("catégorie Série : résultats de séries sans marquage particulier", async () => {
  process.env.TMDB_API_KEY = "k";
  simulerTmdb([["search/tv", { results: [{ id: 1396, name: "Breaking Bad", first_air_date: "2008-01-20", poster_path: null }] }]]);
  const { corps } = await appeler({ q: "Breaking Bad", type: "Série" });
  assert.equal(corps.results[0].tmdbSerie, undefined);
});
