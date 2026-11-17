import test from 'node:test';
import assert from 'node:assert/strict';
import { createSnapshot, deliveryEstimate, emptyDelivery, receiptDeliveryFields, receiptLines, simulatePayment, validateDelivery } from '../lib/guest-checkout.ts';

const delivery = { ...emptyDelivery, fullName: 'Laura Pérez Ñáñez', email: 'laura@example.com', phone: '+57 (300) 000-0000', address: 'Calle de prueba 123', city: 'Chía' };
test('guest delivery validates necessary fields, accents and flexible telephone', () => {
  assert.deepEqual(validateDelivery(delivery), {});
  assert.equal(Object.keys(validateDelivery(emptyDelivery)).length, 4);
  assert.ok(validateDelivery({ ...delivery, email: 'bad' }).email);
  assert.ok(validateDelivery({ ...delivery, phone: 'abc123456789' }).phone);
  assert.ok(validateDelivery({ ...delivery, city: 'Otro municipio' }).municipality);
  assert.ok(validateDelivery({ ...delivery, fullName: 'x'.repeat(121) }).fullName);
  assert.ok(validateDelivery({ ...delivery, address: 'line\nline' }).address);
});
test('snapshot trusts catalog prices, copies data and leaves the cart untouched', () => {
  const cart = [{ slug: 'test', quantity: 2 }];
  const order = createSnapshot(cart, [{ slug: 'test', name: 'Taladro', price: 10000 }], delivery, 'DEMO-test', '2026-11-17T12:00:00Z');
  assert.equal(order.total, 38000);
  assert.equal(order.items[0].subtotal, 20000);
  assert.notEqual(order.delivery, delivery);
  assert.deepEqual(cart, [{ slug: 'test', quantity: 2 }]);
  assert.throws(() => createSnapshot([], [], delivery, 'DEMO-test', '2026-11-17T12:00:00Z'));
  assert.throws(() => createSnapshot([{ slug: 'test', quantity: 21 }], [{ slug: 'test', name: 'Taladro', price: 10000 }], delivery, 'DEMO-test', '2026-11-17T12:00:00Z'));
});
test('unknown coverage is not a free or fabricated delivery quote', () => {
  assert.equal(deliveryEstimate('Bogotá').amount, 12000);
  assert.equal(deliveryEstimate('Soacha').amount, 18000);
  assert.equal(deliveryEstimate('Chía').amount, 18000);
  assert.equal(deliveryEstimate('Otro municipio').amount, null);
});

test('receipt contact labels are shared, omit empty optional values and resolve the municipality', () => {
  const fields = receiptDeliveryFields({ ...delivery, city: 'Otro municipio', municipality: 'Municipio de prueba', neighborhood: ' ', complement: '' });
  assert.deepEqual(fields.map(field => field.label), ['Nombre', 'Correo', 'Teléfono', 'Dirección', 'Ciudad o municipio']);
  assert.equal(fields.at(-1).value, 'Municipio de prueba');
  const order = simulatePayment(createSnapshot([{ slug: 'test', quantity: 1 }], [{ slug: 'test', name: '<script>not markup</script>', price: 10000 }], { ...delivery, email: 'long'.repeat(20) + '@example.com', address: 'Dirección '.repeat(18) }, 'DEMO-test', '2026-11-17T12:00:00Z'));
  const lines = receiptLines(order);
  assert(lines.every(line => line.length <= 34));
  for (const label of ['Nombre:', 'Correo:', 'Teléfono:', 'Dirección:', 'Ciudad o municipio:']) assert(lines.includes(label));
  assert(!lines.includes('Barrio:'));
  assert(!lines.includes('Complemento:'));
  assert(lines.join('').includes(order.delivery.email));
});

test('receipt is unavailable before simulated payment; paid snapshot is isolated and immutable', () => {
  const cart = [{ slug: 'test', quantity: 2 }];
  const pending = createSnapshot(cart, [{ slug: 'test', name: 'Taladro con batería de larga duración', price: 10000 }], delivery, 'DEMO-test', '2026-11-17T12:00:00Z');
  assert.equal(pending.paymentStatus, 'pending');
  assert.throws(() => receiptLines(pending), /Simulate payment/);
  const paid = simulatePayment(pending);
  pending.delivery.fullName = 'Changed';
  pending.items[0].quantity = 15;
  cart[0].quantity = 5;
  assert.equal(paid.items[0].quantity, 2);
  assert.equal(paid.delivery.fullName, delivery.fullName);
  assert.throws(() => simulatePayment(paid), /already simulated/);
  assert.throws(() => { paid.items[0].quantity = 20; }, TypeError);
  const lines = receiptLines(paid);
  assert.ok(lines.every(line => line.length <= 34));
  assert.match(lines.join('\n'), /PAGO DE PRUEBA SIMULADO/);
  assert.match(lines.join('\n'), /SIN COBRO REAL/);
  assert.doesNotMatch(lines.join('\n'), /PENDIENTE DE PAGO/);
});
