// tests-get-films.js — CinéMaison V2 (cinemaison-v2)
//
// Point 6 du plan de fiabilisation (12/09/2026). Vise précisément le
// bug réel constaté ce jour-là : CanalContentId (et TMDbID, IMDbID,
// URLPlateforme) ajoutés au dictionnaire de renommage HEADER_TO_CAMEL
// mais oubliés dans EXPOSED_COLUMNS -- résultat, ces champs n'étaient
// jamais envoyés à l'app, silencieusement, sans qu'aucune erreur ne
// le signale.
//
// Utilise node:test (Node 18+, rien à installer). Ce fichier vit dans
// le dépôt cinemaison-v2 (contrairement à tests-correspondance.js, qui
// vit dans Collecteurs_NODE) puisqu'il teste du code de ce dépôt.
//
// Pour lancer, depuis la racine de cinemaison-v2 : node --test tests-get-films.js

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { EXPOSED_COLUMNS, HEADER_TO_CAMEL } from "./api/get-films.js";

describe("get-films.js -- cohérence des colonnes exposées", () => {
  test("toute colonne renommée dans HEADER_TO_CAMEL est bien dans EXPOSED_COLUMNS", () => {
    const manquantes = Object.keys(HEADER_TO_CAMEL).filter(
      (header) => !EXPOSED_COLUMNS.includes(header)
    );
    assert.deepEqual(
      manquantes,
      [],
      "Colonne(s) renommée(s) mais jamais envoyée(s) à l'app : " + manquantes.join(", ") +
      " -- ajoute-la/les à EXPOSED_COLUMNS dans get-films.js."
    );
  });

  test("aucun doublon dans EXPOSED_COLUMNS", () => {
    const doublons = EXPOSED_COLUMNS.filter((c, i) => EXPOSED_COLUMNS.indexOf(c) !== i);
    assert.deepEqual(doublons, []);
  });
});
