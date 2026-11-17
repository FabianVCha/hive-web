import test from "node:test";
import assert from "node:assert/strict";
import { objectiveItems, mergeSelection, restoreObjectiveDraft, parseQuantity, selectionResult } from "../lib/objectives.mjs";

const products = [{ slug: "cream" }, { slug: "brush" }];
const objectives = [{ id: "care", items: [{ slug: "cream", quantity: 1 }] }];
test("add feedback reports actual quantities for full, partial and blocked additions", () => {
  const catalog = [{ slug: "cream", name: "Crema" }, { slug: "brush", name: "Cepillo" }];
  const selection = [{ slug: "cream", quantity: 3 }, { slug: "brush", quantity: 2 }];
  const complete = selectionResult([], selection, catalog);
  assert.equal(complete.added, 5);
  assert.equal(complete.message, "Se añadieron 5 unidades al carrito.");
  const partial = selectionResult([{ slug: "cream", quantity: 19 }], selection, catalog);
  assert.equal(partial.added, 3);
  assert.match(partial.message, /3 de 5 unidades/);
  assert.deepEqual(partial.limited, ["Crema"]);
  const blocked = selectionResult([{ slug: "cream", quantity: 20 }], [{ slug: "cream", quantity: 1 }], catalog);
  assert.equal(blocked.added, 0);
  assert.match(blocked.message, /No se añadió ninguna unidad.*Crema/);
  assert.equal(selectionResult([], [], catalog).added, 0);
  assert.equal(selectionResult([], [{ slug: "brush", quantity: 1 }], catalog).message, "Se añadió 1 unidad al carrito.");
});
test("draft roundtrip preserves edited quantities and explicit empty selection", () => {
  for (const items of [[], [{ slug: "brush", quantity: 20 }]]) {
    assert.deepEqual(restoreObjectiveDraft(JSON.stringify({ version: 1, selected: "care", items }), objectives, products), { selected: "care", items });
  }
});
test("draft rejects corrupt data and unknown objective; reset uses editorial defaults", () => {
  for (const raw of [null, "bad", "null", "{}", JSON.stringify({ version: 1, selected: "gone", items: [] })]) {
    assert.deepEqual(restoreObjectiveDraft(raw, objectives, products), { selected: "care", items: objectiveItems(objectives[0], products) });
  }
  assert.deepEqual(restoreObjectiveDraft(JSON.stringify({ version: 1, selected: "care", items: [null, { slug: "gone", quantity: 2 }, { slug: "brush", quantity: 21 }, { slug: "cream", quantity: 2 }] }), objectives, products).items, [{ slug: "cream", quantity: 2 }]);
});
test("direct quantity accepts only whole numbers from 1 to 20", () => {
  for (const value of ["", "0", "21", "1.5", "-1", "NaN", "1e1", " "]) assert.equal(parseQuantity(value), null);
  assert.equal(parseQuantity("20"), 20);
  assert.equal(parseQuantity("1"), 1);
});
test("objectives work with any niche and retain explicit editorial quantities", () => {
  assert.deepEqual(objectiveItems({ items: [{ slug: "cream", quantity: 2 }, { slug: "brush", quantity: 1 }] }, products), [{ slug: "cream", quantity: 2 }, { slug: "brush", quantity: 1 }]);
});
test("invalid references, duplicate products and invalid quantities are excluded", () => {
  assert.deepEqual(objectiveItems({ items: [{ slug: "cream", quantity: 1 }, { slug: "cream", quantity: 3 }, { slug: "unknown", quantity: 1 }, { slug: "brush", quantity: 0 }, { slug: "brush", quantity: 1.5 }, { slug: "brush", quantity: 21 }] }, products), [{ slug: "cream", quantity: 1 }]);
});
test("batch add merges atomically, preserves cart input and caps quantities", () => {
  const cart = [{ slug: "cream", quantity: 19 }];
  assert.deepEqual(mergeSelection(cart, [{ slug: "cream", quantity: 3 }, { slug: "brush", quantity: 2 }], products), [{ slug: "cream", quantity: 20 }, { slug: "brush", quantity: 2 }]);
  assert.deepEqual(cart, [{ slug: "cream", quantity: 19 }]);
});
test("empty selections do not change the cart", () => {
  assert.deepEqual(mergeSelection([{ slug: "brush", quantity: 1 }], [], products), [{ slug: "brush", quantity: 1 }]);
  assert.deepEqual(objectiveItems(undefined, products), []);
});
