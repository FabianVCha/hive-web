# Neutral storefront template

The approved direction is a white canvas, not a new layout: preserve navigation, selectable three-object counter scene, objectives, catalog, animated product detail, cart, guest checkout and thermal receipt. Remove the former niche's public identity, photographs, colors and commercial copy. Visitor mode: shopping and checkout are Operate; the home demonstrates the same template interactions.

## Tokens and composition

`apps/storefront/data/storefront.mjs` owns the public identity and palette. `app/template.css` maps these values to legacy component tokens without changing the real Medusa storefront.

- Paper `#ffffff`; quiet surface `#f5f5f5`.
- Ink `#202020`; secondary text `#595959`; border `#dedede`.
- Action `#303030` with white text. Selection adds a dark outline and gray surface, not color alone.
- Retain self-hosted Manrope, readable body type and the established responsive grid.
- Header and footer are white with a text wordmark. Counter, cloth, box and contact shadows use only neutral tones.
- `public/template/product-placeholder.svg` is an intentional, accessible placeholder, labeled “Imagen del producto”; no generated images or niche object silhouettes.

## Content and behavior

Three example products use generic slugs, three categories and three editable objectives. The central configuration supplies all active images, kit-piece labels, hero entries and template guide content. Prices (COP 10,000 / 20,000 / 30,000) are explicitly illustrative. Replace them and all example descriptions before publishing. Legacy niche fixtures and media remain isolated as historical test evidence, not active catalog content.

The home retains three selectable placeholders, synchronized product name, price and add-to-cart action, interruptible pointer transitions, instant keyboard selection, the ten-second idle selection cycle and pause/focus/offscreen/reduced-motion handling. Objective quantities, removal, reset and validated session drafts are unchanged.

`storefront.kitSlug` selects the product with the three-piece contents interaction. It preserves selection, idle emphasis, chapter crossfade, one-second automatic packing, lid closure and replay. All three objects are neutral placeholders. Product detail retains quantities, purchase controls, specifications and demonstrative delivery choices.

Cart storage retains its legacy key for compatibility. Unknown old product references are removed by the existing validated restore function. Canonical route patterns remain `/p/[slug]` and `/c/[handle]`; former demo-specific product/category handles are no longer active and return the normal not-found state. The default real storefront remains separate and requires no backend migration.

Checkout retains in-memory contact data, validation and first-error focus, editable review, explicit simulated payment and a downloadable non-fiscal 80 mm PDF. Screen and PDF use the same configured store name. The white paper, printer-cut edges, selectable Courier text and shared contact labels remain. Payment is never real; the cart is not cleared. Existing Bogotá/Chía/Soacha rates are labeled examples, not commercial promises.

## Verification

`npm test`, `npm run lint` and `npm run build` cover both original isolated fixtures and neutral template contracts. `tests/browser-template.probe.cjs`, `tests/browser-auto-packing-transition.probe.cjs` and `tests/browser-guest-checkout.probe.cjs` exercise the active configuration. Evidence is written to `/tmp/opencode/neutral-template` at 1440, 390 and 320 pixels, including receipts and an actual PDF. Browser emulation is not a substitute for final phone-hardware validation.
