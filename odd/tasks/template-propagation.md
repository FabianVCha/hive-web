# Template propagation foundation
Objective: turn the current neutral storefront template into a maintainable source for derived projects with versioned updates, project-owned configuration, and a payment-provider boundary. Branch: `feat/niche-template-frontend`; delivery: single-pr; runner: Node tests, storefront typecheck/build, and YAML/static checks.

## Specs
S1. User: "si perfecto, me parece bien puedes aplicarlo al proyecto como esta actualmente?" Apply the previously agreed architecture to the current project without overwriting unrelated local work.
S2. Previously agreed: "Separaría cada proyecto en dos capas: código compartido de la template" and "configuración propia de cada tienda". Document and encode the boundary using a versioned template manifest and explicit project-owned configuration.
S3. Previously agreed: "Cada repositorio derivado tendría un archivo" identifying its template version, and "GitHub Action ... crea rama y Pull Request". Add a safe update workflow that proposes updates through Pull Requests and never pushes directly to `main`.
S4. Previously agreed: "El checkout debería depender de una interfaz común" with "DemoPaymentProvider" and future provider adapters. Add a provider contract and preserve the current simulated payment behavior as the default.

## Tasks
- T1 [S1-S2] inline; add template manifest, project configuration boundary, and documentation; complete after tests; Risk: item 5 (template update automation changes repository workflow behavior).
- T2 [S1-S3] inline; add versioned consumer update script/workflow and tests; complete after tests; Risk: item 5 (automated branch and Pull Request creation).
- T3 [S1-S4] inline; add payment-provider contract and demo adapter without real payment credentials; complete after tests; Risk: none.

## Log
L1. Original request: "si perfecto, me parece bien puedes aplicarlo al proyecto como esta actualmente?"
L2. Existing evidence: the repository already has neutral demo data in `apps/storefront/data/storefront.mjs`, but README states there is no automatic synchronization and no real payment integration. Existing uncommitted files are unrelated local work and must remain untouched.
L3. Route: direct inline. No writer trigger applies because these units are sequentially coupled and will be implemented and verified by the parent.
L4. RED observed: before implementation, storefront tests failed because `data/project-config.mjs` and the provider boundary did not exist.
L5. GREEN observed: template manifest validation passes; storefront tests pass 34/34; storefront TypeScript check passes; production build passes; catalog validation passes.
L6. Pipeline probe passed in an isolated temporary Git fixture: template-owned files and version updated, derived `project.id` and project configuration preserved, and a branch commit was created.
L7. `actionlint` is unavailable in the environment, so GitHub workflow syntax has not received that tool's proof. The workflows are static and use standard GitHub Actions syntax; CI remains the authoritative remote check.
L8. README now has a dedicated, prominent section explaining the release-to-Pull-Request update flow and the prohibition on direct pushes to `main`.
