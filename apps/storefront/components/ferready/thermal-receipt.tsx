import { receiptDeliveryFields, type OrderSnapshot } from "@/lib/guest-checkout";
import { money } from "./catalog";
import { storefront } from "@/data/storefront.mjs";

export function ThermalReceipt({ order, mode }: { order: OrderSnapshot; mode: "pending" | "paid" }) {
  const paid = mode === "paid" && order.paymentStatus === "simulated-paid";
  return <article className="thermal-receipt" aria-label={paid ? "Comprobante térmico no fiscal" : "Vista previa del comprobante sin pagar"}>
    <header className="receipt-heading"><strong>{storefront.brandName} DEMO</strong><p>Comprobante no fiscal</p><p className="receipt-status">{paid ? "Pago de prueba simulado" : "Vista previa · Sin pagar"}</p><p>{paid ? "Sin cobro real" : "Pendiente de pago de prueba"}</p></header>
    {paid && <div className="receipt-block"><p>Ref: {order.reference}</p><p>{new Intl.DateTimeFormat("es-CO", { dateStyle: "short", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(order.createdAt))}</p><p>Hora de Bogotá (America/Bogota)</p></div>}
    <section className="receipt-block"><h2>Entrega y contacto</h2><dl className="receipt-contact">{receiptDeliveryFields(order.delivery).map(field => <div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl></section>
    <section className="receipt-block"><h2>Productos · COP</h2>{order.items.map(item => <div className="receipt-item" key={item.slug}><p>{item.name}</p><div className="receipt-amounts"><span>{item.quantity} × {money(item.unitPrice)}</span><strong>{money(item.subtotal)}</strong></div></div>)}</section>
    <dl className="receipt-block receipt-totals"><div><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd></div><div><dt>Envío</dt><dd>{order.shipping === null ? "Por confirmar (no incluido)" : money(order.shipping)}</dd></div><div className="receipt-total"><dt>{order.shipping === null ? "Total parcial sin envío" : "Total"}</dt><dd>{money(order.total)} COP</dd></div></dl>
    <footer className="receipt-block"><p>{paid ? "Pago de prueba · Sin cobro real" : "Vista previa · No acredita pago"}</p><p>No es factura electrónica ni documento fiscal DIAN. No acredita pago ni pedido real.</p><p>Entrega de ejemplo: {order.timing}.</p><p>Precios y tarifas de demostración. El carrito se conserva.</p><p>Datos solo en memoria; el PDF los guarda en tu dispositivo.</p><p className="receipt-thanks">Gracias por probar</p></footer>
  </article>;
}
