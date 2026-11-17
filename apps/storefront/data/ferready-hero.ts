import { storefront } from "./storefront.mjs";
/** Compatibility entry point; customize the central storefront configuration. */
export const heroConfig = {
  ...storefront.hero,
  products: storefront.products.map(product => ({ slug: product.slug, label: product.name, render: product.image })),
};
