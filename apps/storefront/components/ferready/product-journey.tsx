"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { journeyState, productStory } from "@/lib/campaign.mjs";
import type { DemoProduct } from "@/lib/prototype.mjs";
import { Icon } from "./shell";
import { ProductFigure } from "./product-figure";
import { DrillKitTable } from "./drill-kit-table";
import { storefront } from "@/data/storefront.mjs";

function headerInset() {
  return Math.ceil(document.querySelector(".fr-header")?.getBoundingClientRect().height ?? 88);
}

export function ProductJourney({ product, children }: { product: DemoProduct; children: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  const object = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const finishScrub = useRef<(() => void) | null>(null);
  const [still, setStill] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [pointer, setPointer] = useState(true);
  const [replay, setReplay] = useState(0);
  const kit = product.slug === storefront.kitSlug;
  const story = productStory(product);
  useEffect(() => {
    const scrollInput = () => setPointer(true);
    window.addEventListener("wheel", scrollInput, { passive: true });
    window.addEventListener("touchstart", scrollInput, { passive: true });
    return () => { window.removeEventListener("wheel", scrollInput); window.removeEventListener("touchstart", scrollInput); };
  }, []);
  useLayoutEffect(() => {
    if (!kit || !root.current) return;
    const project = root.current.querySelector<HTMLElement>(".journey-object");
    const table = root.current.querySelector<HTMLElement>(".kit-table");
    if (!project || !table) return;
    const showingTable = chapter >= 2;
    const duration = still || !pointer || matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 280;
    const animations = [
      project.animate([{ opacity: getComputedStyle(project).opacity }, { opacity: showingTable ? 0 : 1 }], { duration, easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "forwards" }),
      table.animate([{ opacity: getComputedStyle(table).opacity, transform: getComputedStyle(table).transform }, { opacity: showingTable ? 1 : 0, transform: showingTable ? "translateY(0) scale(1)" : "translateY(12px) scale(.96)" }], { duration, easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "forwards" }),
    ];
    const projectLayer = project.querySelector<HTMLElement>(".journey-media-layer:nth-child(2)");
    if (projectLayer) animations.push(projectLayer.animate([{ transform: getComputedStyle(projectLayer).transform }, { transform: showingTable ? "translate(-8%, 8%) scale(.9)" : "translate(0, 0) scale(1)" }], { duration, easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "forwards" }));
    return () => { animations.forEach(animation => { animation.commitStyles(); animation.cancel(); }); };
  }, [chapter, kit, still, pointer]);
  useEffect(() => {
    if (!root.current || !object.current || !box.current || still) return;
    gsap.registerPlugin(ScrollTrigger);
    const element = root.current;
    const figure = object.current;
    const parcel = box.current;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      element.classList.add("is-enhanced");
      const driver = { progress: 0 };
      let lastChapter = -1;
      const render = () => {
        const state = journeyState(driver.progress);
        gsap.set(figure, { yPercent: state.y, scale: state.scale, rotation: state.rotation, rotationY: state.rotationY, transformPerspective: 1100 });
        if (!kit) {
          gsap.set(parcel, { autoAlpha: Math.min(1, Math.max(0, (driver.progress - 0.69) / 0.08)), y: (1 - state.packing) * 22 });
          element.style.setProperty("--packing", String(state.packing));
          element.style.setProperty("--parcel-close", String(Math.max(0, Math.min(1, (state.packing - 0.72) / 0.28))));
        }
        element.style.setProperty("--journey-progress", String(driver.progress));
        if (!kit) element.dataset.packed = state.packing > 0.96 ? "true" : "false";
        if (state.chapter !== lastChapter) {
          setChapter(state.chapter);
          lastChapter = state.chapter;
        }
      };
      const updateInset = () => element.style.setProperty("--journey-inset", `${headerInset()}px`);
      updateInset();
      const tween = gsap.to(driver, { progress: 1, ease: "none", onUpdate: render, scrollTrigger: { trigger: element, start: () => `top ${headerInset()}px`, end: "bottom bottom", scrub: 0.35, invalidateOnRefresh: true, onRefreshInit: updateInset } });
      finishScrub.current = () => { ScrollTrigger.update(); tween.scrollTrigger?.getTween()?.progress(1); };
      render();
      const refresh = () => ScrollTrigger.refresh();
      const images = Array.from(element.querySelectorAll("img"));
      images.forEach((image) => image.addEventListener("load", refresh));
      ScrollTrigger.refresh();
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        finishScrub.current = null;
        element.classList.remove("is-enhanced");
        delete element.dataset.packed;
        figure.style.removeProperty("transform");
        parcel.style.removeProperty("transform");
        parcel.style.removeProperty("opacity");
        parcel.style.removeProperty("visibility");
        element.style.removeProperty("--packing");
        element.style.removeProperty("--parcel-close");
        element.style.removeProperty("--journey-progress");
        element.style.removeProperty("--journey-inset");
        images.forEach((image) => image.removeEventListener("load", refresh));
      };
    }, element);
    return () => media.revert();
  }, [product.slug, still, kit]);

  const jump = (event: React.MouseEvent<HTMLAnchorElement>, index: number) => {
    const element = root.current;
    event.preventDefault();
    setPointer(event.detail > 0);
    setReplay(value => value + 1);
    setChapter(index);
    if (!element?.classList.contains("is-enhanced")) {
      if (kit && element) window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - headerInset(), behavior: "instant" });
      return;
    }
    const inset = headerInset();
    const top = element.getBoundingClientRect().top + window.scrollY - inset;
    const distance = element.offsetHeight - window.innerHeight + inset;
     window.scrollTo({ top: top + distance * (index === 3 ? (kit ? .79 : 1) : (index + 0.1) / 4), behavior: kit || event.detail === 0 ? "instant" : "smooth" });
    if (kit) finishScrub.current?.();
  };

  return (
    <section ref={root} data-phase={chapter} className={`product-journey product-first ${kit ? "drill-kit-journey" : ""} ${still ? "journey-still" : ""}`} id="recorrido" aria-label={`Recorrido visual de ${product.name}`}>
      <div className="journey-stage">
        <div className="journey-product-heading"><h1>{product.name}</h1><Link className="product-brand" href={`/catalogo?q=${encodeURIComponent(product.brand)}`}>{product.brand}</Link></div>
        <div className="journey-topline"><h2>Conoce lo que eliges.</h2><button className="text-link" onClick={() => setStill(!still)} aria-pressed={still}>{still ? "Activar animación" : "Ver sin animación"}<Icon name={still ? "arrow" : "minus"} size={17} /></button></div>
        <nav className="journey-stops" aria-label="Etapas del producto">
          {["El producto", "Tu proyecto", "Qué incluye", "A tu caja"].map((label, index) => <a href={`#etapa-${index}-${product.slug}`} aria-current={chapter === index ? "step" : undefined} onClick={(event) => jump(event, index)} key={label}>{label}</a>)}
        </nav>
        <div className="journey-composition">
          <div className="journey-copy">
            <div className="journey-chapters">
            {story.chapters.map((entry, index) => <article data-journey-chapter aria-hidden={chapter !== index} inert={chapter !== index} id={`etapa-${index}-${product.slug}`} key={entry.title}>
               <h3>{index === 2 && story.contents ? "Qué incluye" : entry.title}</h3>
               {index === 2 && story.contents ? <><ul className="journey-contents">{story.contents.map(item => <li key={item}>{item}</li>)}</ul><p className="journey-content-note">{story.contentNote}</p></> : index > 0 && <p>{entry.body}</p>}
              {index === 0 && entry.detail && <p className="journey-spec">{entry.detail[0]}: <strong>{entry.detail[1]}</strong></p>}
               {index === 2 && <Link className="text-link" href="#especificaciones">Revisar todos los detalles <Icon name="arrow" size={20} /></Link>}
            </article>)}
            <article data-journey-chapter aria-hidden={chapter !== 3} inert={chapter !== 3} id={`etapa-3-${product.slug}`} className="journey-checkout">
              <h3>Tu próximo proyecto. En camino.</h3>
              <p>Empaque y pedido de demostración. No se realiza un pago.</p>
            </article>
            </div>
            {children}
          </div>
          <div className="journey-visual" aria-label="Presentación visual y empaque ilustrativo">
            <div className="journey-orbit" aria-hidden="true" />
            <div ref={object} className="journey-object">
               {story.media ? story.media.map((view, index) => kit && index > 1 ? null : <div className={`journey-media-layer ${view.presentation === "plate" ? "journey-media-plate" : ""}`} data-media-src={view.src} data-active={chapter === index} aria-hidden={chapter !== index} key={view.src}>
                 {view.presentation === "plate" ? <img src={view.src} alt={view.alt} width="1200" height="800" /> : <ProductFigure src={view.src} alt={view.alt} priority />}
              </div>) : <ProductFigure src={story.image} alt={product.name} priority />}
            </div>
            {kit && <DrillKitTable chapter={chapter} still={still} pointer={pointer} replay={replay} />}
            <div ref={box} className="shipping-parcel" aria-hidden="true">
              <div className="parcel-back" />
              <div className="parcel-flap parcel-flap-left" />
              <div className="parcel-flap parcel-flap-right" />
              <div className="parcel-front"><strong>{storefront.brandName}</strong><span>Empaque de ejemplo</span></div>
              <div className="parcel-side" />
            </div>
            <p className="journey-image-note">{story.media?.[chapter]?.note ?? "Imagen del producto · espacio de ejemplo"}</p>
          </div>
        </div>
        <div className="journey-progress" aria-hidden="true"><span /></div>
      </div>
    </section>
  );
}
