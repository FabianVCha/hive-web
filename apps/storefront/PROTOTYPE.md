# Ferready visual prototype

## Version 0.1.0 snapshot

This checkpoint preserves the functional campaign prototype, not a finished visual release. Current supplier-photo cutouts were rejected for final delivery; custom Higgsfield campaign photography remains pending. A separate basic-settings storefront-sign diagnostic successfully generated an image with the official logo, so image generation is not universally blocked. Earlier higher-setting requests were refused, and the exact eligibility cause is unconfirmed. The diagnostic is not integrated into the website.

Snapshot checks: all 13 unit tests and TypeScript passed. Earlier isolated Webpack production and browser checks passed; the final tablet typography recheck remains pending. This checkpoint does not authorize a public deployment or real transactions.

The prototype is opt-in, local, private and non-transactional. The default Medusa-backed storefront is preserved. No backend services are needed for the prototype.

## Run locally

From `apps/storefront`, install the existing lockfile dependencies with `npm ci`, then:

```powershell
$env:FERREADY_DEMO='1'
npm run dev -- --hostname 127.0.0.1
```

Open `http://localhost:8000`. To restore the original storefront, stop the server, remove `FERREADY_DEMO` (`Remove-Item Env:FERREADY_DEMO` in PowerShell), and restart it. Environment changes require restarting the server.

## Demonstration routes

- `/`: Ferready homepage, direct category access and optional task links.
- `/catalogo`: all 15 candidates; `?q=manguera` demonstrates direct search.
- `/c/plomeria-hogar`: filtered category; all existing category route shapes are preserved.
- `/p/taladro-bauker-12v`: independently usable product detail page, image gallery, compatibility, kit information, demo delivery and add/buy actions.
- `/carrito`: browser-local cart, quantity controls, removal and totals.
- `/checkout`: simulated delivery and confirmation. No payment fields, network submission or actual orders.
- `/informacion`: transparent demonstration conditions and reference-image disclosure.

UI language is Colombian Spanish as requested by the product context. No human-support channel, fake testimonials or borrowed reviews are provided. Prices, stock, delivery coverage and times are fixtures authorized for demonstration only. Product identity, specifications, stock and rights to use photographs must be validated before any public launch.

## Isolation and data

`FERREADY_DEMO=1` is checked only on the server. The demo does not call Medusa, write approved catalog data, persist personal details or submit checkout data. Only the cart's product handles and bounded integer quantities are stored under `ferready-demo-cart-v1` in localStorage. Invalid stored items are discarded; storage denial falls back to in-memory use. Demonstration pages are marked noindex; this does not provide authentication or authorize hosting them publicly.

Official logos were copied unchanged from the user-supplied brand folder. `/ferready/image-sources.json` records image provenance. Homecenter/Easy photographs are presentation references, not claimed licenses, supplier inventory, Ferready reviews or guarantees. The Higgsfield generation attempt was rejected with `only_mcp_usage_on_trial_is_available`; no generated asset is claimed or substituted from another provider. The current editorial composition uses actual reference photography on brand-colored fields.

## Verification

```text
npm test
npm run lint
npm run build
```

Browser acceptance: search `manguera` directly; open product from a direct URL; switch gallery image; add two units; reload cart; change/remove quantities; checkout with example data; change delivery zone; complete simulation and verify empty cart. Test at desktop, tablet and phone widths, keyboard focus and reduced motion. The repository's database integration harness is deliberately not applicable: this prototype does not change backend behavior and that harness creates database fixtures and migrations.

## Campaign redesign

The current demonstration homepage uses the approved campaign-studio direction, with the supplied official SVG logos and Ferready palette. The fictional tool logos visible in the proposal image are not shipped. No additional Higgsfield generation is required or claimed: product photographs come from the existing reference inventory, and their original licensing caveats still apply.

- Campaign copy, featured handles, project entries and identity references: `lib/campaign.mjs`.
- Campaign layout: `components/ferready/campaign-home.tsx`; scoped theme: `app/campaign.css`.
- Product presentation: `components/ferready/product-journey.tsx`. Every product uses its own photograph, specifications, compatibility and contents.
- The browser derives a cutout from the photograph's connected white studio background. If canvas processing fails, the original photograph remains; if the image fails, a readable fallback remains.
- This is image-based perspective and motion, not a real volumetric model or a generated video. Video is deferred at the user's request; `productStory().video` is reserved for later media integration.
- Scroll progresses through the product, compatibility, contents and an illustrative shipping-box conclusion with working cart/checkout controls. Step links work with keyboard and touch. Scrolling back restores earlier stages.
- `Ver sin animación`, reduced-motion preference and short viewports expose the same content and purchase actions without a pinned sequence. No payment, real order or personal-data persistence has been added.

Additional checks: `node --test tests/campaign.test.mjs` and the host-Playwright function `tests/browser-campaign.probe.js` (currently points at the isolated preview on port 8002 and uses a fresh browser context).

An isolated production build was checked with `npm run build -- --webpack`. The default Turbopack attempt could not resolve dependencies through the scratch copy's external `node_modules` junction; this is not claimed as a successful default build or a framework migration. Do not stop another developer's preview process to fix that isolation issue.
# Guest checkout test payment

The guest flow is delivery details → editable order review → **Simular pago** → thermal receipt. Simulation is enabled for testing only: no processor, real charge, order submission or personal-data storage is involved. The cart remains available.

The non-fiscal receipt appears on screen and can be downloaded only after simulated payment. Both use the same monochrome, 34-character Courier layout; the PDF is 80 mm wide with content-based height. Pending snapshots are rejected by the receipt/PDF generator. This client-side state check is a demo-flow guard, not a real payment authorization mechanism.

Receipt data is copied and frozen at simulation time. Later cart changes do not alter an existing receipt. “Iniciar nueva simulación” discards it and returns to editable details; the next simulation gets a new reference. Reloading forgets delivery details and simulation state, while retaining the demo cart. Unknown delivery destinations retain “por confirmar” shipping and a partial total.

Verification: `npm test`, `npm run lint`, and `node tests/browser-guest-checkout.probe.cjs` from `apps/storefront`. The browser probe requires the existing local Chromium/Playwright installation and `pdfinfo`/`pdftotext`; its evidence is written to `/tmp/opencode/thermal-receipt`.
