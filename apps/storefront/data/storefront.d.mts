import type { DemoProduct } from "../lib/prototype.mjs";
import type { Objective } from "../lib/objectives.mjs";
export const storefront: {
  brandName: string; description: string; placeholder: string; kitSlug: string;
  tokens: Record<"paper" | "surface" | "ink" | "muted" | "border" | "accent", string>;
  hero: { title: string; description: string; background: string };
  guides: { slug: string; title: string; updated: null; markdown: string }[];
  categories: { slug: string; name: string; short: string; image: string }[];
  products: DemoProduct[]; objectives: Objective[];
  kitPieces: { id: string; label: string; detail: string; width: number; height: number }[];
};
