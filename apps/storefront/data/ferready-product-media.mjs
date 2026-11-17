/** Editorial views for this SKU only; all other products retain their catalog image. */
export const productMedia = {
  "taladro-bauker-12v": [
    { src: "/ferready/products/484299.webp", alt: "Taladro Bauker 12 V con batería, vista principal", note: "Vista principal · fotografía de catálogo" },
    { src: "/ferready/products/484299_12.webp", alt: "Taladro Bauker 12 V, vista lateral opuesta", note: "Vista lateral · fotografía de catálogo" },
    { src: "/ferready/products/drill-12v-includes-ai.webp", alt: "Ilustración de un taladro sin batería, una batería separada y un cargador genérico con cable", note: "Ilustración del contenido. Apariencia del cargador por confirmar.", presentation: "plate" },
    { src: "/ferready/products/484299_01.webp", alt: "Taladro Bauker 12 V, vista alternativa antes del empaque ilustrativo", note: "Vista alternativa · empaque ilustrativo, no incluido" },
  ],
};

/** Editorial structure only; the source catalog's inclusion claim still needs confirmation. */
export const productStoryOverrides = {
  "taladro-bauker-12v": {
    contents: ["1 taladro", "1 batería de 12 V · 1,3 Ah", "1 cargador"],
    contentNote: "Ilustración del contenido. Apariencia del cargador por confirmar.",
  },
};
