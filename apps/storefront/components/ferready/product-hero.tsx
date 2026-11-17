"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { heroConfig } from "@/data/ferready-hero";
import { money, products } from "./catalog";
import { AddButton } from "./selection-motion";
import { useCart } from "./shell";
import { SafeImage } from "./safe-image";

export function ProductHero({ config = heroConfig }: { config?: typeof heroConfig }) {
  const entries = config.products.flatMap((entry) => {
    const product = products.find((candidate) => candidate.slug === entry.slug);
    return product ? [{ ...entry, product }] : [];
  });
  const [selected, setSelected] = useState(0);
  const [pointer, setPointer] = useState(false);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [manualSelection, setManualSelection] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusModality = useRef<"keyboard" | "pointer">("keyboard");
  const cancelCountdown = () => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  };
  const running = visible && !paused && !reducedMotion && !hovered && !focused && !interacting;
  const scene = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    const release = () => setInteracting(false);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, []);
  useEffect(() => {
    if (!running || entries.length < 2) return;
    timer.current = setTimeout(() => {
      setManualSelection(false);
      setPointer(true);
      setSelected((index) => (index + 1) % entries.length);
    }, 10_000);
    return cancelCountdown;
  }, [running, selected, countdown, entries.length]);
  useEffect(() => {
    const element = scene.current;
    if (!element) return;
    let inView = false;
    const updateVisibility = () => setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      updateVisibility();
    });
    observer.observe(element);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);
  const { add, ready } = useCart();
  const current = entries[selected] || entries[0];
  if (!current) return null;
  return <section className="product-hero" style={{ background: config.background, "--hero-cloth": config.background } as CSSProperties} data-motion={pointer ? "pointer" : "keyboard"} data-idle={running ? "running" : "paused"} aria-labelledby="campaign-title"
    onKeyDownCapture={() => { focusModality.current = "keyboard"; cancelCountdown(); setFocused(true); setPointer(false); setCountdown((value) => value + 1); }}
    onFocusCapture={() => { if (focusModality.current === "keyboard") { cancelCountdown(); setFocused(true); } }}
    onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
    onPointerEnter={(event) => { if (event.pointerType === "mouse" && window.matchMedia("(hover: hover) and (pointer: fine)").matches) { cancelCountdown(); setHovered(true); } }}
    onPointerLeave={() => setHovered(false)}
    onPointerDownCapture={() => { focusModality.current = "pointer"; cancelCountdown(); setFocused(false); setPointer(true); setInteracting(true); }}>
    <div className="hero-intro"><h1 id="campaign-title">{config.title}</h1><p>{config.description}</p></div>
    <div ref={scene} className="hero-objects" role="group" aria-label="Productos destacados">
      <button className="hero-motion-toggle" type="button" onClick={() => setPaused(!paused)}>{paused ? "Activar animación" : "Pausar animación"}</button>
      <div className="hero-counter" aria-hidden="true"><div className="hero-counter-top" /><div className="hero-counter-edge" /></div>
      {entries.map((entry, index) => {
        const slot = index === selected ? "active" : index === (selected + 1) % entries.length ? "next" : "previous";
        return <button key={entry.slug} type="button" className="hero-object" data-slot={slot} aria-pressed={index === selected} aria-label={`Seleccionar ${entry.product.name}`} onClick={(event) => { cancelCountdown(); setManualSelection(true); setPointer(event.detail > 0); setSelected(index); setCountdown((value) => value + 1); }}>
          <b className="hero-object-sway"><SafeImage src={entry.render} fallbackSrc={entry.product.image} alt="" width="720" height="720" /></b>
          <span>{entry.label}</span>
        </button>;
      })}
    </div>
    <div className="hero-detail" aria-live={manualSelection ? "polite" : "off"} aria-atomic="true">
      <h2><Link href={`/p/${current.slug}`}>{current.product.name}</Link></h2>
      <strong>{money(current.product.price)} <small>COP</small></strong>
      <span className="hero-price-note">Precio de demostración</span>
      <div className="hero-actions"><AddButton key={current.slug} className="button button-red" disabled={!ready} onClick={() => add(current.slug)}>Agregar al carrito</AddButton><Link className="hero-product-link" href={`/p/${current.slug}`}>Ver ficha del producto</Link></div>
      <small className="hero-disclosure">Imágenes, productos y precios de ejemplo. Personaliza el catálogo antes de publicar.</small>
      <Link className="hero-catalog-link" href="/catalogo">Explorar todo el catálogo</Link>
    </div>
  </section>;
}
