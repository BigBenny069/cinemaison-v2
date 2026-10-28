import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { poidsCeSoir, tirerPondere, vuesNettoyer, vuesAjouter, VUES_MAX } from "../lib/explorer-outils.js";

describe("poidsCeSoir", () => {
  it("favorise les films qui partent bientôt", () => {
    assert.equal(poidsCeSoir(3), 3);
    assert.equal(poidsCeSoir(14), 3);
    assert.equal(poidsCeSoir(20), 2);
    assert.equal(poidsCeSoir(90), 1);
    assert.equal(poidsCeSoir(null), 1);
    assert.equal(poidsCeSoir(-2), 1);
  });
});

describe("tirerPondere", () => {
  const items = [{ id: "a", p: 1 }, { id: "b", p: 3 }];
  const g = (x) => x.p, id = (x) => x.id;
  it("respecte les poids", () => {
    assert.equal(tirerPondere(items, g, id, [], () => 0.1).id, "a");
    assert.equal(tirerPondere(items, g, id, [], () => 0.5).id, "b");
    assert.equal(tirerPondere(items, g, id, [], () => 0.99).id, "b");
  });
  it("évite les films déjà proposés, puis repart de zéro", () => {
    assert.equal(tirerPondere(items, g, id, ["b"], () => 0.9).id, "a");
    assert.ok(tirerPondere(items, g, id, ["a", "b"], () => 0.5));
  });
  it("liste vide -> null", () => {
    assert.equal(tirerPondere([], g, id), null);
    assert.equal(tirerPondere(null, g, id), null);
  });
});

describe("recherches enregistrées", () => {
  it("ignore tout ce qui est abîmé", () => {
    assert.deepEqual(vuesNettoyer("pas du json"), []);
    assert.deepEqual(vuesNettoyer('{"a":1}'), []);
    assert.deepEqual(vuesNettoyer(null), []);
    assert.deepEqual(vuesNettoyer(JSON.stringify([{ nom: "ok", filtres: {} }, { nom: "", filtres: {} }, { nom: "x" }, 5])), [{ nom: "ok", filtres: {} }]);
  });
  it("remplace une recherche du même nom et plafonne la liste", () => {
    let v = vuesAjouter([], "Soirée à deux", { qui: "À deux" });
    v = vuesAjouter(v, "soirée à DEUX", { qui: "Romy" });
    assert.equal(v.length, 1);
    assert.equal(v[0].filtres.qui, "Romy");
    for (let i = 0; i < 20; i++) v = vuesAjouter(v, "n" + i, {});
    assert.equal(v.length, VUES_MAX);
    assert.equal(vuesAjouter(v, "  ", {}), v);
  });
});
