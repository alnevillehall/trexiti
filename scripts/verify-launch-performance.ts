import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";

const origin = process.env.LAUNCH_AUDIT_ORIGIN ?? "http://127.0.0.1:3010";
const routes = [
  "/",
  "/services",
  "/systems-review",
  "/insights",
  "/start-a-project",
] as const;

async function run() {
  const pages = [];
  const assetUrls = new Set<string>();

  for (const route of routes) {
    const startedAt = performance.now();
    const response = await fetch(new URL(route, origin), {
      signal: AbortSignal.timeout(15_000),
    });
    const html = await response.text();
    const responseMs = Math.round(performance.now() - startedAt);
    assert.equal(response.status, 200, `${route} must return 200.`);
    assert.ok(responseMs < 2_000, `${route} took ${responseMs}ms locally.`);
    pages.push({ route, responseMs, htmlKb: Math.round(Buffer.byteLength(html) / 1024) });

    for (const match of html.matchAll(
      /(?:src|href)="([^\"]+\.(?:js|css)(?:\?[^\"]*)?)"/g,
    )) {
      const url = new URL(match[1].replaceAll("&amp;", "&"), origin);
      if (url.origin === origin && url.pathname.startsWith("/_next/static/")) {
        assetUrls.add(url.href);
      }
    }
  }

  const assets = [];
  for (const url of assetUrls) {
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    assert.equal(response.status, 200, `${url} must return 200.`);
    const bytes = (await response.arrayBuffer()).byteLength;
    assets.push({ path: new URL(url).pathname, bytes });
  }

  const totalAssetBytes = assets.reduce((sum, asset) => sum + asset.bytes, 0);
  const largestAsset = assets.toSorted((left, right) => right.bytes - left.bytes)[0];
  assert.ok(totalAssetBytes < 3_000_000, "Shared launch JS/CSS exceeds 3 MB uncompressed.");
  assert.ok(
    !largestAsset || largestAsset.bytes < 1_000_000,
    `${largestAsset?.path} exceeds 1 MB uncompressed.`,
  );

  console.log(
    JSON.stringify(
      {
        pages,
        uniqueJsCssAssets: assets.length,
        totalJsCssKb: Math.round(totalAssetBytes / 1024),
        largestAsset: largestAsset
          ? {
              path: largestAsset.path,
              kb: Math.round(largestAsset.bytes / 1024),
            }
          : null,
      },
      null,
      2,
    ),
  );
  console.log("Local response and launch JS/CSS performance budgets passed.");
}

void run();
