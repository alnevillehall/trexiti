import assert from "node:assert/strict";

import robots from "../app/robots";
import { isWorkspaceDemoMode } from "../lib/auth/config";

assert.equal(
  isWorkspaceDemoMode({ NODE_ENV: "development" }),
  true,
  "The demo workspace should remain available during local development.",
);
assert.equal(
  isWorkspaceDemoMode({
    NODE_ENV: "production",
    NEXT_PUBLIC_AUTH_PROVIDER: "development",
  }),
  false,
  "Production must never accept the development workspace session.",
);
assert.equal(
  isWorkspaceDemoMode({
    NODE_ENV: "production",
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

console.log("Production guard and crawler checks passed.");
