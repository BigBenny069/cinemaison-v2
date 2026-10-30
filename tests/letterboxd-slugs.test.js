import test from "node:test";
import assert from "node:assert/strict";
import { slugifier, candidatsLetterboxd } from "../lib/letterboxd-slugs.js";

test("slugifier : accents, apostrophes, &", () => {
  assert.equal(slugifier("L'Aveu"), "laveu");
  assert.equal(slugifier("Kaïro"), "kairo");
  assert.equal(slugifier("Tom & Jerry"), "tom-and-jerry");
});

test("candidats : titre anglais avec année et années voisines", () => {
  const c = candidatsLetterboxd(["Kaïro", "Pulse"], 2001).map((x) => x.url.replace("https://letterboxd.com/film/", ""));
  assert.ok(c.includes("pulse/"));
  assert.ok(c.includes("pulse-2001/"));
  assert.ok(c.includes("pulse-2000/"));
  assert.ok(c.includes("pulse-2002/"));
  assert.ok(c.indexOf("kairo/") < c.indexOf("pulse/"));
});

test("candidats : pas de doublon, titres non latins ignorés", () => {
  const c = candidatsLetterboxd(["Le Couperet", "Le Couperet", "回路"], 2005);
  assert.equal(c.length, 4);
  assert.equal(new Set(c.map((x) => x.url)).size, 4);
});

test("candidats : sans année, un seul essai par titre", () => {
  assert.equal(candidatsLetterboxd(["The Ax"], "").length, 1);
});
