import { storefront } from "../data/storefront.mjs";
export type Delivery = { fullName: string; email: string; phone: string; address: string; city: string; municipality: string; neighborhood: string; complement: string };
export const emptyDelivery: Delivery = { fullName: "", email: "", phone: "", address: "", city: "Bogotá", municipality: "", neighborhood: "", complement: "" };
export type DeliveryErrors = Partial<Record<keyof Delivery, string>>;
export function validateDelivery(value: Delivery): DeliveryErrors {
  const errors: DeliveryErrors = {};
  for (const key of ["fullName", "email", "phone", "address", "city"] as const) if (!value[key].trim()) errors[key] = "Completa este campo.";
  for (const [key, text] of Object.entries(value)) {
    if (text.length > (key === "address" ? 180 : 120)) errors[key as keyof Delivery] = "El texto es demasiado largo.";
    if (/[\u0000-\u001f\u007f]/u.test(text)) errors[key as keyof Delivery] = "Usa texto sin saltos de línea ni caracteres de control.";
  }
  if (value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value.email.trim())) errors.email = "Escribe un correo válido, como nombre@example.com.";
  const digits = value.phone.replace(/\D/g, "");
  if (value.phone && (!/^[+\d\s().-]+$/.test(value.phone) || digits.length < 7 || digits.length > 15)) errors.phone = "Escribe un teléfono válido; puedes incluir +57.";
  if (!["Bogotá", "Chía", "Soacha", "Otro municipio"].includes(value.city)) errors.city = "Elige una ciudad o municipio.";
  if (value.city === "Otro municipio" && !value.municipality.trim()) errors.municipality = "Escribe el nombre del municipio.";
  return errors;
}
export function deliveryEstimate(city: string) {
  return city === "Bogotá" ? { amount: 12000, timing: "1–2 días hábiles de ejemplo" } : ["Chía", "Soacha"].includes(city) ? { amount: 18000, timing: "2–3 días hábiles de ejemplo" } : { amount: null, timing: "Cobertura, tarifa y plazo por confirmar" };
}
export type OrderSnapshot = { paymentStatus: "pending" | "simulated-paid"; reference: string; createdAt: string; delivery: Delivery; items: { slug: string; name: string; quantity: number; unitPrice: number; subtotal: number }[]; subtotal: number; shipping: number | null; total: number; timing: string };
export function createSnapshot(cart: { slug: string; quantity: number }[], catalog: { slug: string; name: string; price: number }[], delivery: Delivery, reference: string, createdAt: string): OrderSnapshot {
  if (Object.keys(validateDelivery(delivery)).length) throw new Error("Invalid delivery");
  const items = cart.map(item => {
    const product = catalog.find(product => product.slug === item.slug);
    if (!product || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) throw new Error("Invalid cart");
    return { slug: product.slug, name: product.name, quantity: item.quantity, unitPrice: product.price, subtotal: product.price * item.quantity };
  });
  if (!items.length) throw new Error("Empty cart");
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const shipping = deliveryEstimate(delivery.city);
  return { paymentStatus: "pending", reference, createdAt, delivery: Object.fromEntries(Object.entries(delivery).map(([key, text]) => [key, text.trim()])) as Delivery, items, subtotal, shipping: shipping.amount, total: subtotal + (shipping.amount ?? 0), timing: shipping.timing };
}

export function simulatePayment(order: OrderSnapshot): OrderSnapshot {
  if (order.paymentStatus !== "pending") throw new Error("Payment already simulated");
  const copy = structuredClone(order);
  copy.paymentStatus = "simulated-paid";
  Object.freeze(copy.delivery);
  copy.items.forEach(Object.freeze);
  Object.freeze(copy.items);
  return Object.freeze(copy);
}

/** Labeled contact data shared by the screen and the selectable-text PDF. */
export function receiptDeliveryFields(delivery: Delivery) {
  return [
    { label: "Nombre", value: delivery.fullName },
    { label: "Correo", value: delivery.email },
    { label: "Teléfono", value: delivery.phone },
    { label: "Dirección", value: delivery.address },
    { label: "Ciudad o municipio", value: delivery.city === "Otro municipio" ? delivery.municipality : delivery.city },
    { label: "Barrio", value: delivery.neighborhood },
    { label: "Complemento", value: delivery.complement },
  ].filter(field => field.value.trim());
}

/** Printable layout for the 80 mm PDF; pending orders cannot be exported. */
export function receiptLines(order: OrderSnapshot): string[] {
  if (order.paymentStatus !== "simulated-paid") throw new Error("Simulate payment before generating a receipt");
  const width = 34;
  const lines: string[] = [];
  const text = (value: string) => {
    for (const paragraph of value.split("\n")) {
      let remaining = paragraph;
      while (remaining.length > width) {
        const space = remaining.lastIndexOf(" ", width);
        const cut = space > 0 ? space : width;
        lines.push(remaining.slice(0, cut));
        remaining = remaining.slice(cut).trimStart();
      }
      lines.push(remaining);
    }
  };
  const money = (amount: number) => `$${new Intl.NumberFormat("es-CO").format(amount)}`;
  const rule = () => lines.push("-".repeat(width));
  text(`${storefront.brandName} DEMO`);
  text("     COMPROBANTE NO FISCAL");
  rule();
  text("PAGO DE PRUEBA SIMULADO");
  text("SIN COBRO REAL");
  rule();
  text(`Ref: ${order.reference}`);
  text(new Intl.DateTimeFormat("es-CO", { dateStyle: "short", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(order.createdAt)));
  text("Hora de Bogotá (America/Bogota)");
  rule(); text("ENTREGA Y CONTACTO");
  for (const field of receiptDeliveryFields(order.delivery)) { text(`${field.label}:`); text(field.value); }
  rule(); text("CANT. x UNITARIO / SUBTOTAL (COP)");
  for (const item of order.items) {
    text(item.name);
    const left = `${item.quantity} x ${money(item.unitPrice)}`;
    const right = money(item.subtotal);
    text(left + " ".repeat(Math.max(1, width - left.length - right.length)) + right);
  }
  rule();
  text(`Subtotal: ${money(order.subtotal)}`);
  text(`Envío: ${order.shipping === null ? "por confirmar (no incluido)" : money(order.shipping)}`);
  text(`${order.shipping === null ? "TOTAL PARCIAL SIN ENVÍO" : "TOTAL"}: ${money(order.total)} COP`);
  rule(); text("PAGO DE PRUEBA - SIN COBRO REAL");
  text("No es factura electrónica ni documento fiscal DIAN. No acredita pago ni pedido real.");
  text(`Entrega de ejemplo: ${order.timing}.`);
  text("Precios y tarifas de demostración. El carrito se conserva.");
  text("Datos solo en memoria; el PDF los guarda en tu dispositivo.");
  rule(); text("       Gracias por probar");
  return lines;
}
