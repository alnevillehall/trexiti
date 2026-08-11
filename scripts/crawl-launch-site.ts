import assert from "node:assert/strict";

const origin = process.env.LAUNCH_AUDIT_ORIGIN ?? "http://127.0.0.1:3010";

async function response(path: string) {
  return fetch(new URL(path, origin), {
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  });
}

async function run() {
const sitemapResponse = await response("/sitemap.xml");
assert.equal(sitemapResponse.status, 200, "sitemap.xml must return 200");
const sitemapXml = await sitemapResponse.text();
const sitemapPaths = Array.from(
  sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g),
  (match) => new URL(match[1]).pathname,
);
assert.ok(sitemapPaths.length > 20, "The public sitemap should expose the complete site.");

const routePaths = new Set<string>(["/", ...sitemapPaths]);
const pageBodies = new Map<string, string>();

for (const path of routePaths) {
  const pageResponse = await response(path);
  assert.equal(pageResponse.status, 200, `${path} returned ${pageResponse.status}`);
  const contentType = pageResponse.headers.get("content-type") ?? "";
  assert.match(contentType, /text\/html/, `${path} should return HTML.`);
  const html = await pageResponse.text();
  pageBodies.set(path, html);
  assert.match(html, /<title>[^<]+<\/title>/i, `${path} is missing a title.`);
  assert.match(
    html,
    /<meta[^>]+name="description"[^>]+content="[^"]+"/i,
    `${path} is missing a meta description.`,
  );
  assert.match(
    html,
    /<link[^>]+rel="canonical"[^>]+href="[^"]+"/i,
    `${path} is missing a canonical URL.`,
  );
  assert.match(
    html,
    /<meta[^>]+property="og:title"[^>]+content="[^"]+"/i,
    `${path} is missing Open Graph title metadata.`,
  );
}

const linkedPaths = new Set<string>();
for (const html of pageBodies.values()) {
  for (const match of html.matchAll(/<a\s[^>]*href="([^"]+)"/gi)) {
    const href = match[1].replaceAll("&amp;", "&");
    if (/^(?:mailto:|tel:|#)/i.test(href)) continue;
    const url = new URL(href, origin);
    if (url.origin !== origin || url.pathname.startsWith("/_next/")) continue;
    linkedPaths.add(url.pathname);
  }
}

for (const path of linkedPaths) {
  const linkedResponse = await response(path);
  assert.equal(
    linkedResponse.status,
    200,
    `Internal link ${path} returned ${linkedResponse.status}.`,
  );
}

const robotsResponse = await response("/robots.txt");
assert.equal(robotsResponse.status, 200);
assert.match(await robotsResponse.text(), /Disallow: \/admin/);

for (const [path, schemaType] of [
  ["/", "Organization"],
  ["/insights", "CollectionPage"],
  ["/capabilities/overview", "ProfessionalService"],
] as const) {
  assert.match(
    pageBodies.get(path) ?? "",
    new RegExp(`application/ld\\+json[\\s\\S]+?${schemaType}`),
    `${path} is missing ${schemaType} structured data.`,
  );
}

assert.equal(
  (await response("/insights/your-employees-shouldnt-be-your-api")).status,
  404,
  "Article 01 must remain unavailable before its August 14 release.",
);
assert.equal(
  (await response("/admin")).status,
  404,
  "Admin must fail closed when production Clerk credentials are absent.",
);

console.log(
  `Runtime crawl passed: ${routePaths.size} sitemap routes, ${linkedPaths.size} unique internal links, metadata, structured data, robots, scheduled content and admin fail-closed behavior.`,
);
}

void run();
