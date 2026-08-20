# Trexiti active domain plan

Decision date: 2026-08-19.

This repository is the main Trexiti application again. The earlier plan to
move it to `studio.trexiti.com` and give the root domain to Discover is
superseded.

## Active ownership

| Host | Application |
|---|---|
| `https://trexiti.com` | Main Trexiti website, consultation, project funnels, Systems Review, CRM, Marketing OS, and protected administration |
| `https://discover.trexiti.com` | Trexiti Discover consumer marketplace, merchant acquisition, accounts, business workspace, and marketplace operations |

`www.trexiti.com` should permanently redirect to `https://trexiti.com` once
the production domains are configured. `studio.trexiti.com` is not required by
the active plan.

## Route policy

- Every existing public route in this repository stays on the same path at
  `https://trexiti.com`.
- Discover must not intercept or redirect `/work`, `/services`, `/insights`,
  `/start-a-project`, `/systems-review`, or any other main-site route.
- Discover routes remain under `https://discover.trexiti.com`.
- Cross-site links may retain only approved non-personal attribution values.
- ServiceOS remains dormant, preserved, omitted from public navigation, and
  excluded from the sitemap while its flag is off.

## Required external configuration

| Dependency | Required value or action |
|---|---|
| Main Trexiti canonical | `NEXT_PUBLIC_TREXITI_SITE_URL=https://trexiti.com` |
| Discover canonical | `TREXITI_SITE_URL=https://discover.trexiti.com` |
| Vercel domains | Attach `trexiti.com` and `www.trexiti.com` to this repository; attach `discover.trexiti.com` to Discover |
| Authentication | Allow the correct origins and callback URLs for each application |
| Analytics and campaigns | Use `trexiti.com` for main-site funnels and `discover.trexiti.com` for marketplace journeys |
| Search consoles | Verify both properties and submit each application’s sitemap |

## Cutover checks

1. Verify this repository’s metadata, sitemap, robots, structured data, feeds,
   documents, campaign URLs, and lead forms use `trexiti.com`.
2. Verify Discover metadata, sitemap, robots, authentication, and business
   journeys use `discover.trexiti.com`.
3. Confirm Discover contains no legacy redirect layer for main-site routes.
4. Test the main site’s enquiries, CRM ingestion, authentication, and `/admin`.
5. Test Discover publication controls, accounts, merchant permissions, and
   cross-site referrals.
6. Change Vercel domains and DNS only with explicit production authorization.

Rollback means restoring the previous domain attachments and DNS records,
then rechecking canonical metadata, authentication, lead delivery, and the
Discover marketplace. This domain decision requires no database migration.
