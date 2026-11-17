"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AddButton, MotionButton } from "./selection-motion";
import { objectives } from "@/data/ferready-objectives";
import { objectiveItems, restoreObjectiveDraft } from "@/lib/objectives.mjs";
import { QuantityInput } from "./quantity-input";
import { products, money } from "./catalog";
import { Icon, useCart } from "./shell";
import { ProductCard } from "./storefront";
import { SafeImage } from "./safe-image";
import { ProductHero } from "./product-hero";

export function CampaignHome() {
  const { addSelection, ready } = useCart();
  const [selected, setSelected] = useState(objectives[0].id);
  const [items, setItems] = useState(() => objectiveItems(objectives[0], products));
  const [draftReady, setDraftReady] = useState(false);
  const workspace = useRef<HTMLDivElement>(null);
  const animateSelection = useRef(false);
  const bridge = useRef<Animation | null>(null);
  useEffect(() => () => bridge.current?.cancel(), []);
  function changeObjective(id: string, pointer: boolean) {
    if (id === selected) return;
    bridge.current?.cancel();
    animateSelection.current = pointer;
    setSelected(id);
    setItems(objectiveItems(objectives.find((entry) => entry.id === id)!, products));
  }
  useLayoutEffect(() => {
    if (!animateSelection.current || !workspace.current) return;
    animateSelection.current = false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const easing = getComputedStyle(workspace.current).getPropertyValue("--selection-ease-out").trim();
    bridge.current = workspace.current.animate(
        [{ opacity: .4, transform: "translateY(8px)" }, { opacity: 1, transform: "translateY(0)" }],
        { duration: 220, easing: easing || "cubic-bezier(0.23, 1, 0.32, 1)" },
      );
    return () => bridge.current?.cancel();
  }, [selected]);
  useEffect(() => {
    try {
      const draft = restoreObjectiveDraft(sessionStorage.getItem("storefront-objective-draft-v1"), objectives, products);
      setSelected(draft.selected);
      setItems(draft.items);
    } catch { /* Storage may be unavailable; editing remains usable. */ }
    setDraftReady(true);
  }, []);
  useEffect(() => {
    if (!draftReady) return;
    try { sessionStorage.setItem("storefront-objective-draft-v1", JSON.stringify({ version: 1, selected, items })); } catch { /* Keep the in-memory selection. */ }
  }, [draftReady, selected, items]);
  const objective = objectives.find((entry) => entry.id === selected)!;
  const total = items.reduce((sum, item) => sum + products.find((product) => product.slug === item.slug)!.price * item.quantity, 0);
  return <div className="campaign-home" onPointerDownCapture={(event) => { event.currentTarget.dataset.modality = "pointer"; }} onKeyDownCapture={(event) => { event.currentTarget.dataset.modality = "keyboard"; bridge.current?.cancel(); }}>
    <ProductHero />
    <section id="por-tarea" className="campaign-section objective-section" aria-labelledby="objectives-title">
      <div className="section-heading"><div><h2 id="objectives-title">Elige tu próximo proyecto.</h2><p>Elige un objetivo, ajusta los productos y llévalos al carrito.</p></div><Link className="text-link" href="/catalogo">Prefiero explorar <Icon name="arrow" size={20} /></Link></div>
      <div className="objective-options" role="group" aria-label="Elige un objetivo">
        {objectives.map((entry) => <MotionButton key={entry.id} disabled={!draftReady} aria-pressed={entry.id === selected} onClick={(event) => changeObjective(entry.id, event.detail > 0)}><SafeImage src={entry.image} alt="" width="90" height="90" /><span>{entry.title}</span><span className="selection-feedback-icon" aria-hidden="true"><span><Icon name="arrow" size={21} /></span><span><Icon name="check" size={21} /></span></span></MotionButton>)}
      </div>
      <div className="objective-workspace" ref={workspace} aria-busy={!draftReady} inert={!draftReady}>
        <div className="objective-intro"><h3>{objective.title}</h3><p>{objective.description}</p><span>Selección de ejemplo. Ajusta las cantidades según lo que necesites.</span><button className="text-link" onClick={() => setItems(objectiveItems(objective, products))}>Restablecer selección <Icon name="arrow" size={18} /></button></div>
        <div className="objective-products">
          {items.length === 0 && <p className="objective-empty">Quitaste todos los productos. Restablece la selección o elige otro objetivo.</p>}
          {items.map((item) => {
            const product = products.find((entry) => entry.slug === item.slug)!;
            return <article className="objective-product" key={item.slug}>
              <Link href={`/p/${item.slug}`}><SafeImage src={product.image} alt={product.name} width="96" height="96" /></Link>
              <div className="objective-product-name"><Link href={`/p/${item.slug}`}>{product.name}</Link><span>{money(product.price)} por unidad</span><button onClick={() => setItems(items.filter((entry) => entry.slug !== item.slug))}>Quitar</button></div>
              <QuantityInput name={product.name} value={item.quantity} onChange={(quantity) => setItems((current) => current.map((entry) => entry.slug === item.slug ? { ...entry, quantity } : entry))} />
              <strong>{money(product.price * item.quantity)}</strong>
            </article>;
          })}
          <div className="objective-summary"><div><span>Total de la selección</span><strong>{money(total)}</strong><small>Precios de demostración · envío no incluido.</small></div><AddButton className="button button-red" disabled={!ready || !items.length} onClick={() => addSelection(items)}>Agregar seleccionados</AddButton></div>
        </div>
      </div>
    </section>
    <section className="campaign-section home-products"><div className="section-heading"><h2>Productos de ejemplo</h2><Link href="/catalogo" className="text-link">Ver catálogo <Icon name="arrow" /></Link></div><div className="product-grid">{products.map((product) => <ProductCard product={product} key={product.slug} />)}</div></section>
  </div>;
}
