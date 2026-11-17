"use client";

import Link from "next/link";
import "./thermal-receipt.css";
import { useEffect, useRef, useState } from "react";
import { createSnapshot, deliveryEstimate, emptyDelivery, simulatePayment, validateDelivery, type Delivery, type DeliveryErrors, type OrderSnapshot } from "@/lib/guest-checkout";
import { ThermalReceipt } from "./thermal-receipt";
import { money, products } from "./catalog";
import { useCart } from "./shell";

const labels: Record<keyof Delivery, string> = { fullName: "Nombre completo", email: "Correo electrónico", phone: "Teléfono", address: "Dirección", city: "Ciudad o municipio", municipality: "Nombre del municipio", neighborhood: "Barrio (opcional)", complement: "Apartamento, casa u otra indicación (opcional)" };

export function GuestCheckout() {
  const { cart, ready } = useCart();
  const [delivery, setDelivery] = useState<Delivery>({ ...emptyDelivery });
  const [errors, setErrors] = useState<DeliveryErrors>({});
  const [stage, setStage] = useState<"delivery" | "review" | "document">("delivery");
  const [snapshot, setSnapshot] = useState<OrderSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const lock = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (stage !== "delivery") heading.current?.focus(); }, [stage]);
  const estimate = deliveryEstimate(delivery.city);
  const items = snapshot?.items ?? cart.map(item => { const product = products.find(p => p.slug === item.slug)!; return { ...item, name: product.name, unitPrice: product.price, subtotal: product.price * item.quantity }; });
  const subtotal = snapshot?.subtotal ?? items.reduce((sum, item) => sum + item.subtotal, 0);
  const shipping = snapshot ? snapshot.shipping : estimate.amount;
  const total = snapshot?.total ?? subtotal + (shipping ?? 0);
  const preview = stage === "review" ? snapshot : null;
  const updateDelivery = (key: keyof Delivery, value: string) => {
    setDelivery(current => ({ ...current, [key]: value }));
    setErrors(current => { const next = { ...current }; delete next[key]; return next; });
  };
  const field = (key: keyof Delivery, type = "text") => <div key={key}><label htmlFor={`delivery-${key}`}>{labels[key]}
    <input id={`delivery-${key}`} name={key} type={type} value={delivery[key]} required={!["neighborhood", "complement"].includes(key)} maxLength={key === "address" ? 180 : 120} autoComplete="off" aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `error-${key}` : undefined} onChange={event => updateDelivery(key, event.target.value)} />
    </label>{errors[key] && <small className="field-error" id={`error-${key}`}>{errors[key]}</small>}
  </div>;
  const download = async () => {
    if (!snapshot || snapshot.paymentStatus !== "simulated-paid" || lock.current) return;
    lock.current = true; setBusy(true); setDownloadError("");
    try { const { downloadOrderPdf } = await import("@/lib/order-pdf"); await downloadOrderPdf(snapshot); }
    catch { setDownloadError("No se pudo descargar el PDF. Intenta de nuevo; tu comprobante sigue aquí."); }
    finally { lock.current = false; setBusy(false); }
  };
  return <div className="page-pad purchase-page guest-checkout">
    <div className="breadcrumb"><Link href="/carrito">Carrito</Link><span>/</span><span>Compra sin cuenta</span></div>
    <h1 ref={heading} tabIndex={-1}>{stage === "delivery" ? "Datos de entrega" : stage === "review" ? "Revisa tu pedido" : "Tu comprobante de ejemplo"}</h1>
    <p className="checkout-intro">Sin crear una cuenta. {stage === "document" ? "Pago de prueba simulado. No se realizó ningún cobro." : "Completa tus datos, revisa y simula el pago para obtener tu comprobante."}</p>
    <ol className="checkout-steps" aria-label="Pasos de compra"><li aria-current={stage === "delivery" ? "step" : undefined}>1. Datos</li><li aria-current={stage === "review" ? "step" : undefined}>2. Revisión</li><li aria-current={stage === "document" ? "step" : undefined}>3. Comprobante</li></ol>
    <div className="demo-form-notice"><div><strong>Demostración sin cobro</strong><p>Usa datos de prueba. No se enviarán a la tienda ni se realizará un cobro. El formulario permanece solo en memoria: al recargar o salir de esta página, tendrás que completarlo de nuevo. El carrito se conserva.</p></div></div>
    {!ready ? <p>Cargando tu carrito…</p> : !cart.length && !snapshot ? <div className="empty-state"><h2>Primero elige tus productos.</h2><p>Si recargaste, vuelve al carrito para comenzar de nuevo.</p><Link href="/catalogo" className="button button-red">Ir al catálogo</Link></div> : <form className="purchase-layout checkout-form" noValidate autoComplete="off" onSubmit={event => {
      event.preventDefault();
      if (stage === "delivery") {
        const nextErrors = validateDelivery(delivery); setErrors(nextErrors);
        const first = Object.keys(nextErrors)[0];
        if (first) { document.getElementById(`delivery-${first}`)?.focus(); return; }
        setSnapshot(createSnapshot(cart, products, delivery, `DEMO-${crypto.randomUUID().slice(0, 12)}`, new Date().toISOString())); setStage("review");
      } else if (stage === "review" && snapshot && !lock.current) {
        lock.current = true;
        try { setSnapshot(simulatePayment(snapshot)); setStage("document"); }
        finally { lock.current = false; }
      }
    }}>
      <div className="checkout-fields">
        {stage === "delivery" ? <>
          {Object.keys(errors).length > 0 && <p role="alert" className="field-error">Revisa los campos indicados para continuar.</p>}
          <section><h2>¿Quién recibe?</h2><div className="form-grid">{field("fullName")}{field("email", "email")}{field("phone", "tel")}</div></section>
          <section><h2>¿Dónde lo entregamos?</h2><div className="form-grid"><label htmlFor="delivery-city">{labels.city}<select id="delivery-city" value={delivery.city} onChange={event => setDelivery({ ...delivery, city: event.target.value })}>{["Bogotá", "Soacha", "Chía", "Otro municipio"].map(city => <option key={city}>{city}</option>)}</select></label>{delivery.city === "Otro municipio" && field("municipality")}{field("address")}{field("neighborhood")}{field("complement")}</div><p className="summary-note">{estimate.timing}. Tarifas y plazos de ejemplo; no garantizan cobertura ni entrega real.</p></section>
        </> : <>
          {stage === "review" && preview && <section className="thermal-result"><ThermalReceipt order={preview} mode="pending" /><button type="button" className="text-link" onClick={() => { setSnapshot(null); setStage("delivery"); requestAnimationFrame(() => document.getElementById("delivery-fullName")?.focus()); }}>Editar datos de entrega</button></section>}
          {stage === "document" && snapshot?.paymentStatus === "simulated-paid" && <section className="thermal-result"><p role="status">Pago de prueba completado. Sin cobro real.</p><ThermalReceipt order={snapshot} mode="paid" /><button type="button" className="button button-dark" disabled={busy} onClick={download}>{busy ? "Preparando PDF…" : "Descargar comprobante PDF"}</button><p className="summary-note">PDF de 80 mm con el mismo contenido. Incluye los datos de prueba que escribiste. Este comprobante conserva los productos y datos del momento de la simulación, aunque cambies el carrito.</p><button type="button" className="text-link" onClick={() => { setSnapshot(null); setDownloadError(""); setStage("delivery"); }}>Iniciar nueva simulación</button>{downloadError && <p role="alert" className="field-error">{downloadError}</p>}</section>}
        </>}
        {stage !== "document" && <section><h2>Pago de prueba</h2><p>Simulación habilitada, sin pasarela ni cobro real. No solicitamos tarjetas ni credenciales. El comprobante solo estará disponible después de simular el pago.</p></section>}
      </div>
      <aside className="order-summary"><h2>{stage === "document" ? "Tu simulación" : stage === "review" ? "Pendiente de pago" : "Resumen de ejemplo"}</h2>{stage === "delivery" && <><div className="guest-order-items">{items.map(item => <div key={item.slug}><span>{item.name}<small>{item.quantity} × {money(item.unitPrice)}</small></span><strong>{money(item.subtotal)}</strong></div>)}</div><div className="summary-row"><span>Subtotal</span><span>{money(subtotal)}</span></div><div className="summary-row"><span>Envío estimado</span><span>{shipping === null ? "Por confirmar" : money(shipping)}</span></div><div className="summary-total"><span>{shipping === null ? "Total parcial, sin envío" : "Total estimado"}</span><strong>{money(total)}</strong></div><p className="summary-note">Precios de demostración en COP. Cobertura, tarifas y fechas reales por definir.</p></>}
        {stage === "document" && <p>Pago de prueba simulado, sin cobro ni pedido real. Tu carrito se conserva para seguir probando.</p>}
        {stage !== "document" && <button type="submit" className="button button-red">{stage === "delivery" ? "Revisar pedido" : "Simular pago"}</button>}
        {stage === "review" && <p className="demo-note">Sin cobro real. Después de simular el pago verás la tirilla y podrás descargarla.</p>}
        <Link href="/carrito" className="text-link">Volver al carrito</Link>
      </aside>
    </form>}
  </div>;
}
