import assert from "node:assert/strict";

import robots from "../app/robots";
import {
  isServiceOsEnabled,
  isWorkspaceDemoMode,
} from "../lib/auth/config";
import { resolveSiteUrl } from "../lib/content/site";

assert.equal(resolveSiteUrl(), "https://trexiti.com");
assert.equal(
  resolveSiteUrl("https://preview.example.com/"),
  "https://preview.example.com",
);
assert.equal(
  resolveSiteUrl("javascript:alert(1)"),
  "https://trexiti.com",
);

assert.equal(
  isServiceOsEnabled({ NODE_ENV: "test" }),
  false,
  "ServiceOS must remain dormant unless it is explicitly enabled.",
);
assert.equal(
  isServiceOsEnabled({
    NODE_ENV: "test",
    TREXITI_SERVICE_OS_ENABLED: "true",
  }),
  true,
  "ServiceOS can be deliberately reactivated without restoring deleted code.",
);

assert.equal(
  isWorkspaceDemoMode({ NODE_ENV: "development" }),
  false,
  "The demo workspace must stay closed by default during local development.",
);
assert.equal(
  isWorkspaceDemoMode({
    NODE_ENV: "development",
    TREXITI_SERVICE_OS_ENABLED: "true",
  }),
  true,
  "The demo workspace can be deliberately re-enabled for local preservation work.",
);
assert.equal(
  isWorkspaceDemoMode({
    NODE_ENV: "production",
    TREXITI_SERVICE_OS_ENABLED: "true",
    NEXT_PUBLIC_AUTH_PROVIDER: "development",
  }),
  false,
  "Production must never accept the development workspace session.",
);
assert.equal(
  isWorkspaceDemoMode({
    NODE_ENV: "production",
    TREXITI_SERVICE_OS_ENABLED: "true",
    NEXT_PUBLIC_AUTH_PROVIDER: "clerk",
  }),
  false,
  "Production workspace access stays closed until tenant authentication is implemented.",
);

const robotRules = robots().rules;
const disallowed = Array.isArray(robotRules)
  ? robotRules.flatMap((rule) => rule.disallow ?? [])
  : robotRules.disallow ?? [];

for (const privatePrefix of [
  "/admin",
  "/dashboard",
  "/customers",
  "/assets",
  "/jobs",
  "/schedule",
  "/quotes",
  "/invoices",
  "/inventory",
  "/technicians",
  "/reports",
  "/settings",
  "/industry-templates",
  "/sign-in",
  "/sign-up",
]) {
  assert.equal(
    disallowed.includes(privatePrefix),
    true,
    `${privatePrefix} must be excluded from crawling.`,
  );
}

console.log("Dormant ServiceOS, production guard and crawler checks passed.");
