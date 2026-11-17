import { storefront } from "@/data/storefront.mjs";
import type { DemoProduct } from "@/lib/prototype.mjs";

export const products: DemoProduct[] = storefront.products.map((product) => ({
  ...product,
  specs: Object.fromEntries(
    Object.entries(product.specs).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  ),
}));
export const categories = storefront.categories;
export const money = (amount: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
