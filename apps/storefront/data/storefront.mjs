/** The public template identity, content and palette. No commercial claims. */
export const storefront = {
  brandName: "Tu tienda",
  description: "Plantilla de tienda con productos y precios de ejemplo.",
  placeholder: "/template/product-placeholder.svg",
  kitSlug: "producto-ejemplo-1",
  tokens: { paper: "#ffffff", surface: "#f5f5f5", ink: "#202020", muted: "#595959", border: "#dedede", accent: "#303030" },
  hero: { title: "Tu tienda, a tu manera.", description: "Un espacio para tus productos.", background: "#ffffff" },
  guides: [{ slug: "guia-ejemplo", title: "Guía de ejemplo", updated: null, markdown: "Espacio para una guía de tu tienda. Sustituye este contenido por información útil para tus productos." }],
  categories: [1, 2, 3].map(index => ({ slug: `categoria-${index}`, name: `Categoría ${index}`, short: `Categoría ${index}`, image: "/template/product-placeholder.svg" })),
  products: [1, 2, 3].map(index => ({
    slug: `producto-ejemplo-${index}`, name: `Producto de ejemplo ${index}`, brand: "Marca de ejemplo",
    category: `Categoría ${index}`, categorySlug: `categoria-${index}`, price: index * 10000,
    image: "/template/product-placeholder.svg", description: "Espacio para la descripción de tu producto. Este artículo y su precio son de ejemplo.",
    compatibility: "Añade aquí la información que ayude a elegir este producto.",
    includes: "Producto de ejemplo y dos complementos de ejemplo. Personaliza el contenido antes de publicar.",
    source: "", specs: { "Detalle de ejemplo": "Por personalizar", "Información adicional": "Por personalizar" },
  })),
  kitPieces: ["Producto", "Complemento 1", "Complemento 2"].map((label, index) => ({ id: ["drill", "battery", "charger"][index], label, detail: `${label} de ejemplo. Espacio para tu contenido.`, width: 500, height: 500 })),
  objectives: [1, 2, 3].map(index => ({ id: `objetivo-${index}`, title: `Objetivo de ejemplo ${index}`, description: "Personaliza esta selección con los productos de tu catálogo.", image: "/template/product-placeholder.svg", items: [index, index % 3 + 1].map(product => ({ slug: `producto-ejemplo-${product}`, quantity: 1 })) })),
};
