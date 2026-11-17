import type { DemoProduct } from "./prototype.mjs";

export const campaign: {
  brand: { name: string; red: string; navy: string; ink: string; steel: string; paper: string; logo: string; logoLight: string };
  headline: string;
  description: string;
  featured: string[];
  projects: { title: string; description: string; href: string; image: string; tone: string }[];
};
export function productStory(product: Pick<DemoProduct, "image" | "description" | "compatibility" | "includes" | "specs"> & { slug?: string }): {
  image: string;
  media: { src: string; alt: string; note: string; presentation?: string }[] | null;
  contents?: string[];
  contentNote?: string;
  video: string | null;
  specs: [string, string][];
  chapters: { title: string; body: string; detail: [string, string] | null | undefined }[];
};
export function journeyState(progress: number): {
  chapter: number; packing: number; y: number; scale: number; rotation: number; rotationY: number;
};
export function kitPackingState(packing: number): { items: number[]; close: number; table: number };
export const kitPackingDuration: 1;
