# Codex prompts for the Trexiti transition

> Superseded on 2026-08-19. Trexiti remains the primary application at
> `https://trexiti.com`; Trexiti Discover belongs at
> `https://discover.trexiti.com`. Do not execute the older domain-transfer
> prompts below. They are retained only as decision history.

Run these prompts in order, one task at a time. Prompts 1, 2, and 4 belong in the existing Trexiti Studio repository. Prompts 3 and 5 belong in the Trexiti Discover repository. Prompt 6 is a cross-repository release audit and must not deploy or change external configuration without explicit approval.

The prompts deliberately state the outcome, boundaries, evidence, and acceptance criteria once. If the repository's `AGENTS.md` conflicts with a prompt, follow `AGENTS.md` and report the conflict.

## Prompt 1 — Reposition the existing application as Trexiti Studio

```text
Reposition this existing B2B application as Trexiti Studio, the consultation, design, and engineering practice within the Trexiti ecosystem.

Read AGENTS.md if present, docs/trexiti-ecosystem-transition.md, the current content configuration, root metadata, structured data, navigation, forms, generated brand documents, analytics, and launch-verification scripts before editing. Read the relevant Next.js 16 guides from node_modules/next/dist/docs before changing framework behavior.

Required outcome:
- Public-facing identity is Trexiti Studio where the business unit needs to be explicit.
- Preserve the promise “Digital systems for ambitious businesses.”
- Describe Studio as the strategy, design, and engineering practice behind the Trexiti ecosystem without claiming Discover is live unless the repository has verified evidence that it is.
- Introduce a validated configurable canonical base URL whose production target is https://studio.trexiti.com; remove scattered assumptions that the Studio app owns https://www.trexiti.com.
- Update metadata, canonical URLs, sitemap, robots host, structured data, Open Graph data, RSS/feed URLs, generated documents, and tests that own public identity or absolute URLs.
- Preserve all project-enquiry behavior, Systems Review, attribution, CRM, Marketing OS, admin authorization, and existing real-versus-concept disclaimers.

Boundaries:
- Do not deploy, change DNS, alter Vercel linkage, rotate secrets, run migrations, or edit production configuration.
- Do not merge the Discover codebase into this repository.
- Do not delete or re-enable ServiceOS.
- Do not broadly rewrite the visual system or service positioning.

Verification:
Run formatting/lint, strict TypeScript checking, relevant non-mutating tests, and a production build. Run database-writing tests only against a confirmed isolated test database; otherwise list them as not run. Report exactly what changed, any remaining hard-coded trexiti.com assumptions, and every command result. Do not say the domain is migrated; this task only makes the code domain-ready.
```

## Prompt 2 — Add the Studio side of the Discover bridge

```text
Build the Studio side of the Trexiti Studio–Discover customer journey in this repository.

First read AGENTS.md if present and docs/trexiti-ecosystem-transition.md. Inspect the existing navigation, homepage, service pages, start-a-project form, Systems Review funnel, lead validation, Prisma lead/CRM models, attribution logic, privacy copy, and verification scripts. Preserve the current editorial design language and server-side validation.

Required outcome:
- Add a restrained external navigation path to Trexiti Discover at https://trexiti.com.
- Add a homepage or services-level bridge explaining that consumer-facing businesses seeking visibility can join Trexiti Discover, while businesses needing websites, operations, automation, integrations, or custom software should work with Trexiti Studio.
- Extend the appropriate enquiry intake to capture one primary need: customer visibility/discovery; website or customer experience; operations or automation; custom software; or not sure.
- Route visibility-led submissions into the existing lead pipeline with an explicit, queryable classification. Do not automatically publish a merchant, create a Discover account, or write to the Discover database.
- Preserve first-touch/last-touch attribution and existing duplicate/rate-limit/privacy protections.
- Add focused tests for the new classification, validation, persistence, rendering, and accessible form labels/errors.

Boundaries:
- Do not create a generic cross-product integration layer.
- Do not add a new CRM dependency when the existing CRM can own the classification.
- Do not claim Discover listings are verified, available, or live without evidence.
- Do not deploy, migrate production data, or change external services.

Verification:
Run lint, strict TypeScript checking, focused lead/CRM tests, the broader relevant non-mutating tests, and a production build. Run persistence tests only against a confirmed isolated test database. Summarize the exact lead handoff and identify any operational follow-up that code cannot solve.
```

## Prompt 3 — Add the Discover side of the Studio bridge

```text
In the Trexiti Discover repository, implement the consumer-safe and merchant-safe bridge to Trexiti Studio.

Read AGENTS.md and the required product documents before editing, especially the master blueprint, Q4 revenue plan, phase-one scope, blueprint alignment, implementation roadmap, and decision log. Inspect existing public navigation, business acquisition routes, merchant application/onboarding, analytics, feature flags, metadata, and tests. Read the relevant installed Next.js guides before changing framework behavior.

Required outcome:
- Keep the primary consumer experience focused on discovering useful businesses, products, services, and events.
- Add a low-prominence Studio link to https://studio.trexiti.com without turning the consumer navigation into a corporate product menu.
- Make /for-business the clear business router with two paths: join/grow on Trexiti Discover, or engage Trexiti Studio for websites, operations, automation, integrations, and custom software.
- Preserve the current Discover merchant packages, truthful sponsored-placement language, eligibility, permissions, moderation, and publication controls.
- Add campaign-safe outbound attribution to the Studio link using only approved, non-personal parameters.
- Keep the page server-rendered, accessible, mobile-first, and useful without client-side JavaScript.

Boundaries:
- Do not merge Studio forms, CRM, Marketing OS, or database models into Discover.
- Do not add checkout, booking, payments, CRM, inventory, chat, or a generic business operating system.
- Do not portray illustrative records as live or verified.
- Do not deploy or change external configuration.

Verification:
Run npm run lint, npm run typecheck, relevant unit/render tests, npm test, and npm run build as required by AGENTS.md. Report the user journeys and exact outbound attribution contract.
```

## Prompt 4 — Prepare Studio SEO and migration inventory

```text
Prepare the Trexiti Studio repository for a later move from trexiti.com to studio.trexiti.com, without changing DNS or deploying.

Read AGENTS.md if present and docs/trexiti-ecosystem-transition.md. Inspect all public routes, sitemap entries, canonical metadata, structured data, RSS/feed files, public assets, downloadable documents, form actions, callback URLs, analytics destinations, emails, and tests. Use repository evidence and, if available, exported analytics/Search Console data; do not invent traffic or indexing claims.

Create a version-controlled migration inventory containing:
- every current public route;
- whether it remains a Studio route, becomes a Discover route, redirects, or is retired;
- its final URL;
- redirect status and query-parameter behavior;
- canonical/sitemap implications;
- owner and verification note for any external dependency.

Implement only safe code-level preparation that is valid before cutover, such as centralized validated base-URL handling and tests. Do not activate redirects from trexiti.com in this Studio deployment because the main-domain redirects will ultimately be owned by the Discover deployment.

Boundaries:
- Do not change Vercel project linkage, domains, DNS, Clerk dashboards, production environment variables, or search-console settings.
- Do not delete legacy pages merely because a redirect is planned.
- Keep ServiceOS dormant and omitted from public migration promotion.

Verification:
Run lint, strict TypeScript checking, metadata/sitemap tests, relevant non-mutating repository tests, and a production build. Return the migration inventory path, unresolved external configuration, and a cutover checklist with rollback checkpoints.
```

## Prompt 5 — Make Discover own trexiti.com and preserve legacy Studio routes

```text
In the Trexiti Discover repository, make the application code ready to own https://trexiti.com while preserving valuable legacy Studio URLs through exact redirects to https://studio.trexiti.com.

Read AGENTS.md, the product decision documents, and the approved route inventory produced by the Studio repository. Inspect current Discover configuration, metadata, sitemap, robots, authentication base URLs, outbound actions, security headers, and tests. Read the installed Next.js 16 redirect, proxy, metadata, and caching guides relevant to the implementation.

Required outcome:
- Centralize and validate the Discover canonical origin with https://trexiti.com as the production target.
- Implement only the approved exact legacy route redirects. Preserve safe query parameters needed for attribution, avoid redirect loops, and do not use a catch-all that could steal valid Discover routes.
- Ensure Discover canonicals, sitemap, robots host, Open Graph URLs, and structured data use the correct public origin.
- Add automated tests for redirect destinations, permanence, query behavior, canonical URLs, sitemap membership, and collisions with Discover routes.
- Produce a concise external-configuration checklist for Vercel domains, DNS, auth callbacks, email links, database environment, and rollback. Do not perform those external actions.

Boundaries:
- Do not copy the Studio website into Discover.
- Do not redirect private Studio/admin routes into public Discover pages.
- Do not claim a production cutover has occurred.
- Do not deploy, migrate the database, or change Vercel linkage without explicit approval.

Verification:
Run npm run lint, npm run typecheck, relevant tests, npm test, and npm run build. Report any route collision or unresolved redirect instead of guessing.
```

## Prompt 6 — Pre-cutover cross-repository release audit

```text
Audit the Trexiti Discover and Trexiti Studio repositories as one domain-cutover release candidate. This is a read-only and local-verification task unless I separately authorize fixes.

Use these intended hosts:
- https://trexiti.com — Trexiti Discover and the consumer-facing parent-brand entry point.
- https://studio.trexiti.com — Trexiti Studio, its project funnels, and its protected internal administration.

Verify:
- final route ownership and exact redirects;
- canonical, sitemap, robots, structured-data, Open Graph, and RSS origins;
- no ServiceOS public links, sitemap entries, onboarding, or workspace access while its flag is off;
- Studio admin and lead funnels remain protected and functional;
- Discover publication, merchant permissions, and illustrative-data guardrails remain intact;
- cross-site links and approved attribution parameters work without leaking personal data;
- authentication callback/origin assumptions are enumerated;
- both repositories pass their required lint, typecheck, test, and production-build commands;
- rollback steps exist for domains, DNS, redirects, auth, and forms.

Return a severity-ordered release report with evidence paths and command results. Separate code defects from external configuration still requiring owner action. Do not deploy, change DNS/domains, edit provider dashboards, run production migrations, or rotate secrets.
```

## Cutover authorization prompt — use only when ready

Do not use this prompt until the pre-cutover audit is green and the owner intends to change external production state.

```text
Execute the approved Trexiti domain cutover using the verified release plan and rollback checkpoints. Before each external or irreversible action, state the exact target and obtain my confirmation unless I have already explicitly authorized that action in this task. Never infer approval for database migrations, DNS changes, Vercel domain changes, authentication-provider callbacks, secret changes, or production deployment.

The desired final state is trexiti.com for Discover and studio.trexiti.com for Studio. Preserve exact legacy redirects, validate both applications after each stage, stop and roll back on failed authentication, form delivery, canonical/redirect behavior, or critical smoke tests, and produce a timestamped cutover record.
```
