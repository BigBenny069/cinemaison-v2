// tests/letterboxd-lien.test.js — CinéMaison V2 (28/10/2026)
//
// Teste lib/letterboxd-lien.js (ajout d'un film par lien Letterboxd). Utilise
// node:test (rien à installer). Pour lancer, depuis la racine du dépôt :
//   node --test tests/letterboxd-lien.test.js
// Ce dossier est hors de api/ : il n'est jamais déployé comme fonction Vercel.

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractLink, isAllowedUrl, parseFilmPath, titleFromSlug, parseFilmPage,
  looksLikeLetterboxdLink, pickBestTmdbMatch, resoudreLienLetterboxd,
} from "../lib/letterboxd-lien.js";

describe("extractLink", () => {
  it("retrouve un lien court seul ou noyé dans du texte", () => {
    assert.equal(extractLink("https://boxd.it/RTVm"), "https://boxd.it/RTVm");
    assert.equal(extractLink("Regarde ça : https://boxd.it/RTVm !"), "https://boxd.it/RTVm");
    assert.equal(extractLink("boxd.it/RTVm"), "https://boxd.it/RTVm");
  });
  it("force le https", () => {
    assert.equal(extractLink("http://letterboxd.com/film/clayface/"), "https://letterboxd.com/film/clayface/");
  });
  it("retourne null si aucun lien Letterboxd", () => {
    assert.equal(extractLink("https://exemple.com/film/clayface/"), null);
    assert.equal(extractLink(""), null);
    assert.equal(extractLink(null), null);
  });
});

describe("isAllowedUrl", () => {
  it("n'autorise que boxd.it et letterboxd.com en https", () => {
    assert.equal(isAllowedUrl("https://boxd.it/RTVm"), true);
    assert.equal(isAllowedUrl("https://letterboxd.com/film/clayface/"), true);
    assert.equal(isAllowedUrl("http://letterboxd.com/film/clayface/"), false);
    assert.equal(isAllowedUrl("https://letterboxd.com.evil.com/film/x/"), false);
    assert.equal(isAllowedUrl("https://boxd.it@evil.com/x"), false);
    assert.equal(isAllowedUrl("https://169.254.169.254/latest/meta-data"), false);
    assert.equal(isAllowedUrl("pas une url"), false);
  });
});

describe("parseFilmPath", () => {
  it("reconnaît une fiche film, y compris depuis un avis", () => {
    assert.deepEqual(parseFilmPath("https://letterboxd.com/film/clayface/"), { slug: "clayface" });
    assert.deepEqual(parseFilmPath("https://letterboxd.com/ben_benny/film/clayface/"), { slug: "clayface" });
    assert.deepEqual(parseFilmPath("https://letterboxd.com/film/clayface/reviews/"), { slug: "clayface" });
  });
  it("reconnaît un lien direct /tmdb/{id}", () => {
    assert.deepEqual(parseFilmPath("https://letterboxd.com/tmdb/311/"), { tmdbId: 311 });
  });
  it("refuse tout ce qui n'est pas une fiche film", () => {
    assert.equal(parseFilmPath("https://letterboxd.com/ben_benny/"), null);
    assert.equal(parseFilmPath("https://letterboxd.com/films/popular/"), null);
  });
});

describe("titleFromSlug", () => {
  it("transforme le slug en titre et détecte l'année d'un homonyme", () => {
    assert.deepEqual(titleFromSlug("le-retour-des-morts-vivants-3"), { title: "le retour des morts vivants 3", year: null });
    assert.deepEqual(titleFromSlug("dune-2021"), { title: "dune", year: 2021 });
  });
});

describe("parseFilmPage", () => {
  const page = (head, body = "") => `<html><head>${head}</head><body ${body}></body></html>`;
  it("lit l'identifiant TMDb, le titre et l'année", () => {
    const html = page('<meta property="og:title" content="Clayface (2026)" />', 'class="film" data-tmdb-id="1234" data-tmdb-type="movie"');
    assert.deepEqual(parseFilmPage(html), { tmdbId: 1234, title: "Clayface", year: 2026 });
  });
  it("décode les caractères spéciaux du titre", () => {
    const html = page('<meta content="L&#039;Évadé d&amp;Alcatraz (1979)" property="og:title">');
    assert.deepEqual(parseFilmPage(html), { tmdbId: null, title: "L'Évadé d&Alcatraz", year: 1979 });
  });
  it("retombe sur le lien TMDb de la page si l'attribut manque", () => {
    const html = page("<title>Climax (2018) • Letterboxd</title>") + '<a href="https://www.themoviedb.org/movie/487558/">TMDb</a>';
    assert.deepEqual(parseFilmPage(html), { tmdbId: 487558, title: "Climax", year: 2018 });
  });
  it("ignore un identifiant TMDb de série", () => {
    const html = page('<meta property="og:title" content="X (2020)">', 'data-tmdb-id="99" data-tmdb-type="tv"');
    assert.equal(parseFilmPage(html).tmdbId, null);
  });
  it("ne plante pas sur une page vide ou inattendue", () => {
    const vide = { tmdbId: null, title: null, year: null };
    assert.deepEqual(parseFilmPage(""), vide);
    assert.deepEqual(parseFilmPage("<html>Accès refusé</html>"), vide);
    assert.deepEqual(parseFilmPage(null), vide);
  });
});

describe("looksLikeLetterboxdLink", () => {
  it("filtre rapide avant l'appel serveur", () => {
    assert.equal(looksLikeLetterboxdLink("https://boxd.it/RTVm"), true);
    assert.equal(looksLikeLetterboxdLink("Regarde boxd.it/RTVm !"), true);
    assert.equal(looksLikeLetterboxdLink("https://letterboxd.com/film/dune-2021/"), true);
    assert.equal(looksLikeLetterboxdLink("bonjour"), false);
    assert.equal(looksLikeLetterboxdLink(null), false);
  });
});

describe("pickBestTmdbMatch (champs CinéMaison : titre / annee)", () => {
  const dune = [
    { titre: "Dune", annee: "1984", tmdbId: 1 },
    { titre: "Dune", annee: "2021", tmdbId: 2 },
    { titre: "Dune : Deuxième partie", annee: "2024", tmdbId: 3 },
  ];
  it("homonymes : prend l'année identique", () => {
    assert.equal(pickBestTmdbMatch(dune, "dune", 2021).tmdbId, 2);
    assert.equal(pickBestTmdbMatch(dune, "Dune", 1984).tmdbId, 1);
  });
  it("sans accents ni casse", () => {
    assert.equal(pickBestTmdbMatch([{ titre: "L'Évadé d'Alcatraz", annee: "1979", tmdbId: 9 }], "l evade d alcatraz", 1979).tmdbId, 9);
  });
  it("un an d'écart accepté s'il n'y a qu'un candidat", () => {
    assert.equal(pickBestTmdbMatch([{ titre: "Climax", annee: "2018", tmdbId: 5 }], "climax", 2019).tmdbId, 5);
  });
  it("doute -> null (homonymes sans année, ou écart d'un an avec deux candidats)", () => {
    assert.equal(pickBestTmdbMatch(dune, "dune", null), null);
    assert.equal(pickBestTmdbMatch([{ titre: "X", annee: "2019", tmdbId: 1 }, { titre: "X", annee: "2021", tmdbId: 2 }], "x", 2020), null);
    assert.equal(pickBestTmdbMatch(dune, "autre film", 2021), null);
    assert.equal(pickBestTmdbMatch([], "dune", 2021), null);
  });
});

// ── Partie réseau, avec un faux fetch ──
const redirect = (location) => ({ status: 302, headers: { get: (h) => (h.toLowerCase() === "location" ? location : null) } });
const page = (status, html = "") => ({ status, headers: { get: () => null }, text: async () => html });
const FILM_HTML = '<meta property="og:title" content="Clayface (2026)"><body data-tmdb-id="777" data-tmdb-type="movie"></body>';

function fauxFetch(...reponses) {
  const appels = [];
  const fn = async (url) => {
    appels.push(url);
    const r = reponses.shift();
    if (!r) throw new Error("appel réseau inattendu : " + url);
    return r;
  };
  fn.appels = appels;
  return fn;
}

describe("resoudreLienLetterboxd", () => {
  it("refuse un texte sans lien Letterboxd, sans aucune requête réseau", async () => {
    const f = fauxFetch();
    const r = await resoudreLienLetterboxd("https://exemple.com/x", f);
    assert.equal(r.status, 400);
    assert.equal(f.appels.length, 0);
  });

  it("résout un lien boxd.it vers la fiche (TMDb, titre, année) en 2 appels exactement", async () => {
    const f = fauxFetch(redirect("https://letterboxd.com/film/clayface/"), page(200, FILM_HTML));
    const r = await resoudreLienLetterboxd("Regarde https://boxd.it/RTVm", f);
    assert.equal(r.status, 200);
    assert.deepEqual(
      { slug: r.body.slug, tmdbId: r.body.tmdbId, title: r.body.title, year: r.body.year, source: r.body.source },
      { slug: "clayface", tmdbId: 777, title: "Clayface", year: 2026, source: "page" }
    );
    assert.equal(r.body.letterboxdUrl, "https://letterboxd.com/film/clayface/");
    assert.equal(f.appels.length, 2);
  });

  it("depuis un lien d'avis, va chercher la fiche canonique du film", async () => {
    const f = fauxFetch(
      redirect("https://letterboxd.com/ben_benny/film/clayface/"),
      page(200, "<html>page d'avis sans infos</html>"),
      page(200, FILM_HTML)
    );
    const r = await resoudreLienLetterboxd("https://boxd.it/avis", f);
    assert.equal(r.body.tmdbId, 777);
    assert.equal(r.body.source, "page");
    assert.equal(f.appels[2], "https://letterboxd.com/film/clayface/");
  });

  it("retombe sur le slug si Letterboxd refuse de livrer la page (403)", async () => {
    const f = fauxFetch(redirect("https://letterboxd.com/film/dune-2021/"), page(403));
    const r = await resoudreLienLetterboxd("https://boxd.it/abc", f);
    assert.equal(r.status, 200);
    assert.deepEqual(
      { slug: r.body.slug, tmdbId: r.body.tmdbId, title: r.body.title, year: r.body.year, source: r.body.source },
      { slug: "dune-2021", tmdbId: null, title: "dune", year: 2021, source: "slug" }
    );
  });

  it("lien direct /tmdb/{id} : source tmdb, aucune lecture de page", async () => {
    const f = fauxFetch(page(200));
    const r = await resoudreLienLetterboxd("https://letterboxd.com/tmdb/311/", f);
    assert.equal(r.status, 200);
    assert.equal(r.body.tmdbId, 311);
    assert.equal(r.body.source, "tmdb");
    assert.equal(f.appels.length, 1);
  });

  it("ne suit jamais une redirection vers un autre site (un seul appel, 502)", async () => {
    const f = fauxFetch(redirect("https://evil.example/film/x/"));
    const r = await resoudreLienLetterboxd("https://boxd.it/abc", f);
    assert.equal(r.status, 502);
    assert.equal(f.appels.length, 1);
  });

  it("refuse un lien Letterboxd qui n'est pas une fiche de film (422)", async () => {
    const f = fauxFetch(page(200));
    const r = await resoudreLienLetterboxd("https://letterboxd.com/ben_benny/", f);
    assert.equal(r.status, 422);
  });
});
