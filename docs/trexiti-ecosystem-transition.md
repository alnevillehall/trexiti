# Trexiti ecosystem transition

> Updated decision — 2026-08-19: this transition is superseded. The existing
> Trexiti consultation and systems application remains the primary Trexiti
> experience at `https://trexiti.com`. Trexiti Discover is a connected,
> separately deployed product at `https://discover.trexiti.com`. See
> `docs/domain-migration-inventory.md` for the active domain plan.

## Decision

Trexiti will use one parent brand with two distinct experiences:

| Brand surface | Role | Intended address |
| --- | --- | --- |
| Trexiti | Parent brand and consumer shorthand | `trexiti.com` |
| Trexiti Discover | Consumer discovery network and merchant-attention product | `trexiti.com` |
| Trexiti Studio | Consultation, digital experiences, custom software, business systems, and automation | `studio.trexiti.com` |

The Discover and Studio applications remain separate codebases and deployments. They share brand standards, purposeful cross-links, commercial routing, and measurement—not application internals or databases.

ServiceOS is dormant. Its routes, public promotion, and onboarding are disabled by default, but its source files, Prisma models, migrations, and history remain in the repository. PropertyOS is unchanged by this decision and requires a later product-positioning review.

## Product boundaries

### Trexiti Discover

- Serves consumers looking for businesses, products, services, and events.
- Gives eligible merchants a trustworthy public presence and measurable customer actions.
- Owns `trexiti.com`, consumer search traffic, marketplace supply, merchant profiles, and the Discover business area.
- Does not promise checkout, booking, delivery, CRM, payments, or custom business operations in the current stage.

### Trexiti Studio

- Serves organizations that need diagnosis, websites, operational improvements, integrations, automation, or custom software.
- Owns the existing public consultancy site, project-enquiry pipeline, internal CRM, and Marketing OS.
- Sends visibility-led prospects to Discover and accepts implementation-led prospects from Discover.
- Does not turn one client's request into a shared Trexiti product without repeated evidence and a product decision.

## Goals

### G0 — Preserve and pause ServiceOS

Status: implemented in source; deployment verification remains required.

Outcome: ServiceOS no longer competes with the Studio–Discover direction, while all work remains recoverable.

Acceptance criteria:

- ServiceOS is disabled unless `TREXITI_SERVICE_OS_ENABLED=true` is deliberately configured.
- Public ServiceOS links and sitemap entries are absent.
- The ServiceOS public page, demo workspace, and organization onboarding fail closed while dormant.
- Admin authentication, Studio CRM, Marketing OS, database schema, migrations, and ServiceOS source remain intact.
- Re-enabling ServiceOS is a documented product decision, not an incidental environment change.

### G1 — Establish Trexiti Studio

Outcome: the existing B2B application is clearly presented as Trexiti Studio without weakening its current offer or lead pipeline.

Acceptance criteria:

- Public identity reads “Trexiti Studio” where the business unit must be clear, with an appropriate “by Trexiti” or ecosystem endorsement.
- The core promise remains “Digital systems for ambitious businesses.”
- Studio metadata, canonical URLs, sitemaps, structured data, social images, email templates, downloads, and analytics use the approved Studio identity and configurable base URL.
- Existing project enquiries, Systems Review, CRM, Marketing OS, Clerk admin access, and attribution continue to work.

### G2 — Create the Studio–Discover bridge

Outcome: visitors can choose between marketplace visibility and custom implementation without learning Trexiti's internal structure.

Acceptance criteria:

- Studio includes a restrained link to Discover and a clear visibility-oriented referral path.
- Studio enquiry capture distinguishes visibility, website/customer experience, operations/automation, custom software, and uncertain needs.
- Discover has a “For Business” path that separates joining Discover from engaging Studio.
- Cross-site links preserve approved campaign attribution without exposing personal data.
- A Studio client is never automatically published in Discover; normal eligibility, permission, moderation, and quality rules still apply.

### G3 — Make both applications domain-ready

Outcome: each codebase can run correctly on its final host before any DNS or Vercel change.

Acceptance criteria:

- Discover is configured for `https://trexiti.com` and its approved `www` behavior.
- Studio is configured for `https://studio.trexiti.com`.
- Absolute URLs come from validated configuration with safe defaults, not scattered literals.
- Authentication callbacks, form origins, canonical metadata, robots, sitemap, Open Graph URLs, email links, analytics, and security policies are reviewed for their final host.
- Preview deployments remain testable without claiming to be the production service.

### G4 — Protect the domain migration

Outcome: the main domain can move from the current B2B site to Discover without losing valuable Studio routes or confusing search engines and visitors.

Acceptance criteria:

- An inventory maps every indexed or externally linked current route to its final Studio or Discover destination.
- Exact permanent redirects exist for valuable former Studio routes on `trexiti.com`.
- Query parameters used for campaign attribution survive redirects where safe.
- Both sitemaps are correct and contain no private, dormant, illustrative-only, or non-canonical routes.
- There is a rollback procedure for DNS, domains, authentication, forms, and redirects.

### G5 — Launch a measurable commercial loop

Outcome: Studio and Discover reinforce each other commercially instead of operating as unrelated brands.

Acceptance criteria:

- Merchant visibility leads have an owner, pipeline stage, response target, and Discover onboarding path.
- Studio implementation leads retain the existing qualification and proposal workflow.
- Reporting distinguishes Discover-sourced Studio opportunities, Studio-sourced merchants, paid merchant conversion, and consumer actions.
- No merchant is sold verification, hidden ranking, or an unimplemented capability.
- The first operating review occurs only after permissioned supply, production configuration, legal/operational prerequisites, and launch metrics are ready.

## Sequencing

1. Keep ServiceOS dormant and verify the current Studio application remains healthy.
2. Rebrand and configure the existing application as Trexiti Studio.
3. Add intent-based Studio–Discover routing in both applications.
4. Make both applications domain-ready and verify them on preview hosts.
5. Build and test the legacy-route redirect map.
6. Cut over domains only with explicit owner approval.
7. Measure merchant acquisition, consumer actions, and cross-product conversion before widening product scope.

## Reactivation gate for ServiceOS

Do not re-enable ServiceOS merely because the code exists. Reactivation requires:

- evidence that a repeated service-business workflow is the selected operational vertical;
- a named customer and commercial owner;
- a reviewed scope separating reusable capability from custom work;
- tenant authentication and authorization ready for production;
- updated privacy, security, support, migration, and release plans; and
- an explicit decision recorded before `TREXITI_SERVICE_OS_ENABLED` is enabled outside controlled local work.

## Current non-goals

- Combining Discover and Studio into one application or database.
- Moving the Studio CRM or Marketing OS into Discover.
- Deleting ServiceOS code or database history.
- Continuing ServiceOS, PropertyOS, payments, booking, checkout, or generic business-operations development without a new decision.
- Changing DNS, Vercel linkage, production secrets, or deployment targets as part of ordinary implementation tasks.
