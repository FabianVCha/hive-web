import test from 'node:test';
import assert from 'node:assert/strict';
import { storefront } from '../data/storefront.mjs';
import { campaign, productStory, kitPackingState } from '../lib/campaign.mjs';
import { objectiveItems, selectionResult } from '../lib/objectives.mjs';
import { restoreCart, cartTotal } from '../lib/prototype.mjs';
import { createSnapshot, emptyDelivery, receiptLines, simulatePayment } from '../lib/guest-checkout.ts';

test('template configuration has neutral public identity, images and consistent routes', () => {
  assert.doesNotMatch(JSON.stringify(storefront), /ferready|bauker|taladro|herramienta|homecenter|bosch|ferreter/i);
  assert.equal(storefront.products.length, 3);
  assert.equal(new Set(storefront.products.map(product => product.slug)).size, 3);
  for (const product of storefront.products) {
    assert(storefront.categories.some(category => category.slug === product.categorySlug));
    assert.equal(product.image, storefront.placeholder);
    assert(product.price > 0);
    const story = productStory(product);
    assert.equal(story.image, storefront.placeholder);
    assert.doesNotMatch(JSON.stringify(story), /ferready|taladro|bauker/i);
  }
  assert.equal(campaign.brand.name, storefront.brandName);
  assert.equal(productStory(storefront.products[0]).contents.length, 3);
  for (const value of Object.values(storefront.tokens)) assert.match(value, /^#([a-f0-9]{2})\1\1$/i);
});

test('template objectives and cart work with the same generic catalog', () => {
  for (const objective of storefront.objectives) {
    const items = objectiveItems(objective, storefront.products);
    assert.equal(items.length, 2);
    const result = selectionResult([], items, storefront.products);
    assert(result.added > 0);
    assert.deepEqual(restoreCart(JSON.stringify(result.cart), storefront.products), result.cart);
    assert(cartTotal(result.cart, storefront.products) > 0);
  }
  assert(Math.abs(kitPackingState(1).close - 1) < 1e-12);
});

test('template paid receipt uses configured name and preserves demo safety', () => {
  const delivery = { ...emptyDelivery, fullName: 'Cliente de prueba', email: 'test@example.com', phone: '3000000000', address: 'Dirección de ejemplo' };
  const order = createSnapshot([{ slug: storefront.products[0].slug, quantity: 1 }], storefront.products, delivery, 'DEMO-template', '2026-11-17T12:00:00Z');
  assert.throws(() => receiptLines(order));
  const text = receiptLines(simulatePayment(order)).join('\n');
  assert(text.includes(storefront.brandName));
  assert(text.includes(storefront.products[0].name));
  assert.match(text, /SIN COBRO REAL/);
  assert.doesNotMatch(text, /ferready|taladro|bauker/i);
});
