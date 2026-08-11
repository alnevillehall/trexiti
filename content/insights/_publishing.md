# Trexiti Insights publishing workflow

Articles live in this directory as Markdown with validated YAML frontmatter.

Required fields:

- `title`
- `slug` — must match the filename
- `description`
- `publishedAt` — `YYYY-MM-DD`
- `author`
- `category` — one of the categories defined in `lib/content/insights.ts`
- `tags`
- `featured`
- `featureOnPublish` — promotes a scheduled article in the featured position once it becomes public
- `draft`
- `socialExcerpt` — the approved social hook
- `socialStatus` — `Not scheduled`, `Scheduled`, or `Distributed`
- `cta` — the article-specific eyebrow, title, description, label, and tracked destination

Optional fields:

- `updatedAt`
- `ogImage`
- `canonicalUrl`

Publishing sequence:

1. Add or edit the Markdown file.
2. Keep `draft: true` during review. Drafts never appear on public routes, in the sitemap, or in RSS.
3. Set the intended `publishedAt` date.
4. Set `draft: false` only after editorial approval. A future date becomes `SCHEDULED` and stays excluded from public routes, internal links, the sitemap, RSS, and generated social images.
5. Trigger the production build and deployment on or after midnight Jamaica time on the release date. That build publishes the eligible article and its contextual internal links.
6. Run `npm run test:insights` and `npm run build` before every release deployment.

Launch release builds:

- 14 August 2026 — `Your Employees Shouldn't Be Your API`
- 21 August 2026 — `You Probably Don't Need Custom Software`
- 28 August 2026 — `The Website Is Not the End of the Customer Journey`

Trexiti OS exposes a read-only register at `/admin/marketing/content`. Article copy remains source-controlled; there is intentionally no WYSIWYG editor or newsletter form.
