import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  campaign,
  productStory,
  journeyState,
  kitPackingState,
  kitPackingDuration,
} from "../lib/campaign.mjs";
import { productMedia } from "../data/ferready-product-media.mjs";

const products = JSON.parse(
  readFileSync(new URL("../data/prototype-products.json", import.meta.url)),
);

test("automatic drill packing fits all objects and lids in one second total", () => {
  assert.equal(kitPackingDuration * 1000, 1000);
  const at = milliseconds => kitPackingState(milliseconds / (kitPackingDuration * 1000));
  assert(at(280).items[0] > 0 && at(280).items[1] === 0);
  assert(at(320).items[0] < 1 && at(320).items[1] > 0);
  assert(at(600).items[1] < 1 && at(600).items[2] > 0);
  assert.deepEqual(at(860).items, [1, 1, 1]);
  assert.equal(at(890).close, 0);
  assert(at(950).close > 0 && at(950).close < 1);
  assert(at(1000).close > .999);
  assert.deepEqual(at(0).items, [0, 0, 0]);
});

test("kit components pack in causal order and lids wait for the last object", () => {
  for (const p of [0, .25, .5, .75, .86, .89, 1]) {
    const state = kitPackingState(p);
    assert.ok(state.items[0] >= state.items[1] && state.items[1] >= state.items[2]);
    if (state.close > 0) assert.deepEqual(state.items, [1, 1, 1]);
    if (p <= .89) assert.equal(state.close, 0);
    assert.deepEqual(kitPackingState(p), state);
  }
  assert.deepEqual(kitPackingState(1).items, [1, 1, 1]);
  assert.deepEqual(kitPackingState(NaN), kitPackingState(0));
  assert.deepEqual(kitPackingState(-1), kitPackingState(0));
  assert.deepEqual(kitPackingState(2), kitPackingState(1));
  for (const name of ["drill", "battery", "charger"]) assert.ok(readFileSync(new URL(`../public/ferready/products/drill-kit-${name}.webp`, import.meta.url)).length > 0);
});

test("campaign uses neutral configuration independently of legacy niche fixtures", async () => {
  const { storefront } = await import('../data/storefront.mjs');
  assert.equal(campaign.brand.name, storefront.brandName);
  assert.equal(campaign.brand.red, storefront.tokens.accent);
  assert.equal(campaign.brand.navy, storefront.tokens.ink);
  assert.equal(campaign.brand.logo, storefront.placeholder);
  assert.equal(campaign.brand.logoLight, storefront.placeholder);
  assert.ok(campaign.featured.every((slug) => storefront.products.some((p) => p.slug === slug)));
  assert.equal(campaign.projects.length, 3);
  assert.ok(campaign.projects.every((p) => p.href.startsWith("/c/")));
});

test("product journey uses the current product's facts, compatibility and actual image", () => {
  for (const product of products) {
    const story = productStory(product);
    assert.equal(story.image, product.image);
    assert.equal(story.chapters.length, 3);
    assert.equal(story.chapters[0].body, product.description);
    assert.equal(story.chapters[1].body, product.compatibility);
    assert.equal(story.chapters[2].body, product.includes);
    assert.deepEqual(story.specs, Object.entries(product.specs));
    assert.equal(story.video, null);
  }
  const cosmetics = {
    slug: "serum-demo", name: "Sérum de demostración", image: "/serum.webp",
    description: "Descripción del sérum", compatibility: "Revisar ingredientes",
    includes: "Un frasco", specs: { Contenido: "30 ml" },
  };
  const story = productStory(cosmetics);
  assert.equal(story.image, "/serum.webp");
  assert.ok(!JSON.stringify(story).includes("taladro"));
});

test("scroll journey reveals details and lowers the product into the box at its end", () => {
  assert.equal(journeyState(0).chapter, 0);
  assert.equal(journeyState(0.4).chapter, 1);
  assert.equal(journeyState(0.7).chapter, 2);
  assert.equal(journeyState(1).chapter, 3);
  assert.equal(journeyState(0).packing, 0);
  assert.equal(journeyState(1).packing, 1);
  assert.ok(journeyState(1).y > journeyState(0).y);
  assert.ok(journeyState(1).scale < journeyState(0).scale);
  assert.deepEqual(journeyState(-1), journeyState(0));
  assert.deepEqual(journeyState(99), journeyState(1));
  assert.deepEqual(journeyState(NaN), journeyState(0));
  assert.deepEqual(journeyState(0.4), journeyState(0.4));
});

test("only the 12 V drill opts into four truthful phase views", () => {
  assert.deepEqual(Object.keys(productMedia), ["taladro-bauker-12v"]);
  for (const product of products) {
    const story = productStory(product);
    if (product.slug !== "taladro-bauker-12v") {
      assert.equal(story.media, null);
      assert.equal(story.image, product.image);
      continue;
    }
    assert.equal(story.media.length, 4);
    assert.equal(new Set(story.media.map(view => view.src)).size, 4);
    assert.deepEqual(story.media.map(view => view.src.split("/").at(-1)), ["484299.webp", "484299_12.webp", "drill-12v-includes-ai.webp", "484299_01.webp"]);
    for (const view of story.media) {
      assert.ok(view.alt.length > 15 && view.note.length > 15);
      assert.ok(readFileSync(new URL(`../public${view.src}`, import.meta.url)).length > 0);
    }
    assert.match(story.media[2].note, /Ilustración.*por confirmar/);
    assert.equal(story.media[2].presentation, "plate");
    assert.deepEqual(story.contents, ["1 taladro", "1 batería de 12 V · 1,3 Ah", "1 cargador"]);
    assert.match(story.media[3].note, /ilustrativo, no incluido/);
    assert.equal(story.chapters[2].body, product.includes);
  }
  assert.equal(productStory({ image: "/fallback.webp", specs: {} }).media, null);
});
