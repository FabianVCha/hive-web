import { productMedia, productStoryOverrides } from "../data/ferready-product-media.mjs";
import { storefront } from "../data/storefront.mjs";

/** Replace campaign content here when adapting the storefront to another niche. */
export const campaign = {
  brand: {
    name: storefront.brandName,
    red: storefront.tokens.accent,
    navy: storefront.tokens.ink,
    ink: storefront.tokens.ink,
    steel: storefront.tokens.muted,
    paper: storefront.tokens.paper,
    logo: storefront.placeholder,
    logoLight: storefront.placeholder,
  },
  headline: storefront.hero.title,
  description: storefront.hero.description,
  featured: storefront.products.map(product => product.slug),
  projects: storefront.objectives.map((objective, index) => ({ title: objective.title, description: objective.description, href: `/c/${storefront.categories[index].slug}`, image: objective.image, tone: "paper" })),
};

/** Derive every claim from the selected product, not from its category's hero. */
export function productStory(product) {
  return {
    image: product.image,
    media: productMedia[product.slug] ?? null,
    video: null,
    ...productStoryOverrides[product.slug],
    ...(product.slug === storefront.kitSlug ? { contents: storefront.kitPieces.map(piece => `1 ${piece.label.toLowerCase()}`), contentNote: "Contenido de ejemplo, por personalizar." } : {}),
    specs: Object.entries(product.specs),
    chapters: [
      { title: "Míralo de cerca.", body: product.description, detail: Object.entries(product.specs)[0] },
      { title: "Que encaje contigo.", body: product.compatibility, detail: Object.entries(product.specs)[1] },
      { title: "Sin sorpresas al abrir.", body: product.includes, detail: null },
    ],
  };
}

/** Reversible scroll choreography shared by the rendered experience and its tests. */
export function journeyState(progress) {
  const p = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  const packing = Math.max(0, Math.min(1, (p - 0.78) / (1 - 0.78)));
  return {
    chapter: Math.min(3, Math.floor(p * 4)),
    packing,
    y: -Math.sin(p * Math.PI) * 5 + packing * 52,
    scale: 1 + Math.sin(p * Math.PI) * 0.06 - packing * 0.63,
    rotation: -7 + Math.sin(p * Math.PI * 2) * 9 + packing * 7,
    rotationY: Math.sin(p * Math.PI * 2) * 16,
  };
}

/** Total automatic drill packing duration, including the lids, in seconds. */
export const kitPackingDuration = 1;

/** Each object clears the rim before the lids can move; pure and reversible. */
export function kitPackingState(packing) {
  const clamp = value => Math.max(0, Math.min(1, value));
  const p = Number.isFinite(packing) ? clamp(packing) : 0;
  return {
    items: [[0, .36], [.28, .65], [.57, .86]].map(([start, end]) => clamp((p - start) / (end - start))),
    close: clamp((p - .89) / .11),
    table: 1 - clamp(p / .28),
  };
}
