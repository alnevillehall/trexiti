# Trexiti COO Operations Center

## What this adds

Trexiti's authenticated `/admin` application is the operational system of
record. The command center, Server Actions, durable workflows, and MCP endpoint
all use the same typed service and policy layer under `lib/coo`.

The implementation is additive. It does not use the dormant customer-facing
Service OS models and it does not create a second hosting or data stack.

## Operator surfaces

| Surface | Purpose |
| --- | --- |
| `/admin` | Ranked founder brief, separated action queues, linked KPIs, risks, deadlines, and workflow health |
| `/admin/clients` | Active delivery clients and attention signals |
| `/admin/projects` | Projects, milestones, blockers, dependencies, and update history |
| `/admin/finance` | Invoices, payment allocations, outstanding/overdue/expected/received totals by JMD and USD |
| `/admin/approvals` | Founder decisions, expiry, target snapshots, and execution outcomes |
| `/admin/automations` | Durable runs, steps, retries, costs, errors, and correlation IDs |
| `/admin/operations-policy` | Versioned risk, freshness, automation, and approval thresholds |
| `/mcp` | Authenticated Streamable HTTP MCP server for the private COO connection |

`Run Operations` and `Ask Trexiti` use the same registry that is exposed through
MCP. Financial totals and deterministic rule results are calculated in
application code. AI is limited to structured extraction, ranking, explanation,
and an allow-listed operations plan.

## Authority model

1. `trexiti:read` reads permitted Trexiti operational data.
2. `trexiti:write_internal` permits idempotent internal tasks, notes, follow-up
   dates, prospect classifications, record links, and risk flags.
3. `trexiti:approve` permits the founder to decide a stored approval request.

Pricing, proposals, invoice/payment changes, opportunity closing, deletions,
policy changes, external communication, contracts, refunds, and destructive
work do not execute as safe actions. Supported sensitive actions use a canonical
payload, a target-version snapshot, a 24-hour expiry, and optimistic concurrency
at execution. Unsupported external actions are reported as unavailable.

Production automation modes are:

- `off`: no scheduled or requested automation work executes.
- `shadow`: workflows and decisions are evaluated and audited without the
  guarded writes that are being observed.
- `guarded`: allow-listed writes and founder-approved execution are enabled.

Keep production in `shadow` until three consecutive scheduled cycles have been
reviewed successfully.

## Scheduled workflows

Vercel invokes authenticated cron entrypoints in UTC:

| Jamaica time | UTC | Workflow |
| --- | --- | --- |
| 06:00 | 11:00 | Prospect research, validation, deduplication, scoring, persistence, and follow-up creation |
| 07:00 | 12:00 | Deterministic operations snapshot, ranked brief, and stored daily brief |
| 07:05 | 12:05 | ChatGPT scheduled task fetches the stored brief through the connected plugin |

The 07:05 delivery is configured in ChatGPT after the production MCP endpoint
and founder OAuth connection are live. The application does not create a second
local delivery automation. A missing, failed, or incomplete prospect run does
not block the brief; it produces a degraded-data warning and a link to the run.

Duplicate cron invocations use the Jamaica business date as their idempotency
boundary. The workflows are defined under `workflows/coo` and launched by:

- `/api/cron/coo/prospecting`
- `/api/cron/coo/daily-brief`

## AI configuration

The defaults are:

- `openai/gpt-5.6-terra`: research scoring, daily-priority rationale, the stored
  brief, Ask Trexiti, and operations planning.
- `openai/gpt-5.6-luna`: bounded prospect extraction and preliminary research.

Outputs are schema validated. Public web pages are untrusted evidence and cannot
change operating policy or invoke tools. JMD and USD are never converted or
combined. Each durable AI run stores token usage and the exact Gateway-reported
USD cost when that metadata is available; it never estimates against a stale
price table. Durable step attempts use the Workflow retry attempt number, so
failed and retried attempts remain distinct in the automation record.

## Runtime configuration

The application already requires `DATABASE_URL`, Clerk, and the Trexiti site URL.
The COO layer additionally uses:

| Variable | Requirement |
| --- | --- |
| `COO_AUTOMATION_MODE` | Start with `shadow`; use `off` as the kill switch and `guarded` only after the rollout gate |
| `COO_REASONING_MODEL` | Optional Terra override |
| `COO_FAST_MODEL` | Optional Luna override |
| `COO_MAX_RESEARCH_CANDIDATES` | Bounded discovery pool, capped at 75 in code |
| `COO_MAX_ACCEPTED_PROSPECTS` | Accepted daily maximum, capped at 50 |
| `CRON_SECRET` | Required bearer secret for both cron routes |
| `COO_MCP_RESOURCE_URL` | Canonical production resource URL; defaults to `https://trexiti.com/mcp` |
| `COO_MCP_AUDIENCE` | Expected Clerk access-token audience; defaults to the canonical MCP URL |
| `COO_MCP_AUTHORIZATION_SERVER` | Clerk OAuth/OIDC issuer advertised in protected-resource metadata |
| `COO_MCP_AUTHORIZED_PARTIES` | Required in production; comma-separated allow-list of the founder/plugin OAuth client IDs |
| `CLERK_JWT_KEY` | Optional network-independent Clerk JWT verification key |
| `VERCEL_OIDC_TOKEN` or `AI_GATEWAY_API_KEY` | Vercel AI Gateway authentication |

Every MCP request verifies the token issuer, audience, optional authorized party,
requested scopes, and the existing active `AdminUser` allow-list.

The in-process MCP and AI rate limiter is defense-in-depth for each application
instance. Production must pair it with Vercel Firewall rate limiting for
distributed enforcement across regions and instances.

## Database rollout

Run the complete Prisma migration history against an isolated branch first, then
apply it additively to the production database:

```powershell
npx prisma validate
npx prisma generate
npx prisma migrate deploy
```

The migration defaults existing CRM monetary values to explicit `USD`. New
operations invoices and payments require `JMD` or `USD`. Database checks and the
payment-allocation trigger reject negative amounts, cross-company or
cross-currency allocation, and over-allocation.

No production project, invoice, payment, or prospect data is seeded.

## Verification

Run these checks before preview deployment:

```powershell
npm run lint
npm run typecheck
npm run test:coo
npm audit --omit=dev
npm run build
```

The optional database integration suite must run only against an isolated or
disposable database branch:

```powershell
$env:COO_DOMAIN_DB_TEST = "1"
npm run test:coo:db
Remove-Item Env:COO_DOMAIN_DB_TEST
```

Preview acceptance covers: sign in, enter a project and milestone, request an
invoice and payment approval, run safe operations, approve and execute a
supported action, run prospecting, generate a brief, and fetch the same stored
result through MCP. Also verify empty, stale, partial, failed, expired,
stale-target, no-permission, mobile, and keyboard states.

## Private plugin and OAuth handoff

The personal plugin source is at `C:\Users\trexi\plugins\trexiti-coo` and points
to `https://trexiti.com/mcp`. Register it only after the production endpoint,
protected-resource metadata, and Clerk OAuth issuer are reachable.

Configure Clerk OAuth 2.1 with PKCE and the three Trexiti scopes. Prefer Clerk
Client ID Metadata Documents for the founder connection; if that is unavailable,
allow Dynamic Client Registration only under a restricted deterministic policy.
Complete the founder's one-time OAuth consent and verify that an inactive or
non-allow-listed Clerk identity is denied.

After three successful reviewed shadow cycles:

1. Change `COO_AUTOMATION_MODE` to `guarded`.
2. Connect `trexiti-coo` to the existing Trexiti COO conversation.
3. Change the existing morning task to a 07:05 Jamaica delivery-only task that
   calls `get_daily_summary` and posts that stored brief into the same
   conversation.
4. Disable the old standalone 06:00 ChatGPT prospecting task because Vercel now
   owns that workflow.
5. Retain `off` as the immediate kill switch and keep rollback additive.

Gmail, Calendar, Drive, accounting/payment providers, WhatsApp, outbound email,
CSV import, team access, automatic FX, and customer-facing Service OS changes
remain intentionally deferred.
