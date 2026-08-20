export const brandAssetTokens = {
  paper: "#f1f0eb",
  paperSecondary: "#e6e5df",
  paperElevated: "#faf9f5",
  ink: "#151613",
  inkSecondary: "#454740",
  muted: "#61645c",
  olive: "#626a50",
  oliveSoft: "#dfe1d3",
  inverse: "#f7f5ef",
} as const;

export const brandAssetTemplates = [
  { id: "BRAND_STATEMENT", label: "Brand Statement", description: "One decisive statement with restrained supporting copy." },
  { id: "SYSTEM_FLOW", label: "System Flow", description: "A connected sequence of named operating nodes." },
  { id: "FRAGMENTED_CONNECTED", label: "Fragmented vs Connected", description: "A structured before-and-after systems comparison." },
  { id: "INSIGHT_ARTICLE", label: "Insight Article", description: "Editorial cover treatment for a published Trexiti Insight." },
  { id: "CAROUSEL", label: "Carousel", description: "A numbered, multi-slide narrative with consistent pacing." },
  { id: "CASE_STUDY", label: "Case Study", description: "Outcome-led client work without invented proof or logos." },
  { id: "FOCUSED_BUILD", label: "Focused Build", description: "A tightly bounded problem and the operating result." },
  { id: "SYSTEMS_REVIEW", label: "Systems Review", description: "A direct, premium offer card with one action." },
] as const;

export const brandAssetFormats = [
  { id: "LINKEDIN_FEED", label: "LinkedIn feed", width: 1200, height: 627 },
  { id: "LINKEDIN_SQUARE", label: "LinkedIn square", width: 1200, height: 1200 },
  { id: "INSTAGRAM_PORTRAIT", label: "Instagram portrait", width: 1080, height: 1350 },
  { id: "INSTAGRAM_SQUARE", label: "Instagram square", width: 1080, height: 1080 },
  { id: "INSTAGRAM_STORY", label: "Story / Reel", width: 1080, height: 1920 },
  { id: "LINKEDIN_PERSONAL_COVER", label: "LinkedIn personal cover", width: 1584, height: 396 },
  { id: "LINKEDIN_COMPANY_COVER", label: "LinkedIn company cover", width: 4200, height: 700 },
  { id: "LOGO_AVATAR", label: "Logo / avatar", width: 400, height: 400 },
  { id: "OPEN_GRAPH", label: "Open Graph", width: 1200, height: 630 },
] as const;

export type BrandAssetTemplateId = (typeof brandAssetTemplates)[number]["id"];
export type BrandAssetFormatId = (typeof brandAssetFormats)[number]["id"];
export type BrandAssetVariant = "LIGHT" | "DARK";

export type BrandAssetSlide = {
  title: string;
  body: string;
  copy?: string;
};

export type BrandAssetDraft = {
  id?: string;
  name: string;
  status: "REQUESTED" | "IN_PRODUCTION" | "REVIEW" | "READY" | "ARCHIVED";
  template: BrandAssetTemplateId;
  format: BrandAssetFormatId;
  variant: BrandAssetVariant;
  title: string;
  eyebrow: string;
  body: string;
  cta: string;
  altText: string;
  slideCount: number;
  slides: BrandAssetSlide[];
  systemNodes: string[];
  destinationUrl: string;
  campaignId: string;
  contentId: string;
  notes: string;
};

export const defaultBrandAssetDraft: BrandAssetDraft = {
  name: "Untitled Trexiti graphic",
  status: "IN_PRODUCTION",
  template: "BRAND_STATEMENT",
  format: "LINKEDIN_FEED",
  variant: "LIGHT",
  eyebrow: "TREXITI / FIELD NOTE",
  title: "What should work better in your business?",
  body: "Understand how the business works, then build what should make it work better.",
  cta: "Start a project",
  altText: "Trexiti statement graphic asking what should work better in your business.",
  slideCount: 1,
  slides: [],
  systemNodes: ["CUSTOMER", "SALES", "OPERATIONS", "FINANCE"],
  destinationUrl: "https://trexiti.com/start-a-project",
  campaignId: "",
  contentId: "",
  notes: "",
};

export function getBrandAssetFormat(id: BrandAssetFormatId) {
  return brandAssetFormats.find((format) => format.id === id) ?? brandAssetFormats[0];
}

export function parseApprovedCarouselSlides(markdown: string): BrandAssetSlide[] {
  const normalized = markdown.replace(/\r\n/g, "\n").trim();
  const expression = /\*\*Slide\s+\d+\*\*\s*\n([\s\S]*?)(?=\n\*\*Slide\s+\d+\*\*|$)/g;
  const slides: BrandAssetSlide[] = [];
  let match: RegExpExecArray | null;

  while ((match = expression.exec(normalized))) {
    const copy = match[1].trim();
    const blocks = copy.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
    const title = (blocks.shift() ?? "").replace(/\n/g, " ");
    slides.push({ title, body: blocks.join("\n\n"), copy });
  }

  return slides;
}

export function normalizeSlides(slides: BrandAssetSlide[], count: number): BrandAssetSlide[] {
  const normalizedCount = Math.max(1, Math.min(12, Math.round(count)));
  return Array.from({ length: normalizedCount }, (_, index) => ({
    title: slides[index]?.title ?? `Slide ${index + 1}`,
    body: slides[index]?.body ?? "",
    ...(slides[index]?.copy ? { copy: slides[index].copy } : {}),
  }));
}

export type BrandAssetIssue = {
  field: "title" | "body" | "cta" | "altText" | "systemNodes" | "slides";
  level: "error" | "warning";
  message: string;
};

export function getBrandAssetIssues(draft: BrandAssetDraft): BrandAssetIssue[] {
  const issues: BrandAssetIssue[] = [];
  const format = getBrandAssetFormat(draft.format);
  const wideCover = format.width / format.height > 3;
  const titleLimit = wideCover ? 72 : draft.format === "INSTAGRAM_STORY" ? 88 : 110;
  const bodyLimit = wideCover ? 130 : 340;

  if (!draft.title.trim()) issues.push({ field: "title", level: "error", message: "Add a title before saving." });
  if (draft.title.trim().length > titleLimit) issues.push({ field: "title", level: "warning", message: `Title may overflow this format (${draft.title.trim().length}/${titleLimit} characters).` });
  if (draft.body.trim().length > bodyLimit) issues.push({ field: "body", level: "warning", message: `Body copy is dense for this format (${draft.body.trim().length}/${bodyLimit} characters).` });
  if (draft.cta.trim().length > 80) issues.push({ field: "cta", level: "warning", message: "Keep the CTA under 80 characters for reliable wrapping." });
  if (draft.status === "READY" && !draft.altText.trim()) issues.push({ field: "altText", level: "error", message: "Alt text is required before an asset can be READY." });
  if (draft.template === "SYSTEM_FLOW" && (draft.systemNodes.length < 2 || draft.systemNodes.length > 8)) issues.push({ field: "systemNodes", level: "error", message: "System Flow requires 2–8 named nodes." });
  if (draft.template === "CAROUSEL") {
    if (draft.slideCount < 2 || draft.slideCount > 12) issues.push({ field: "slides", level: "error", message: "Carousels require 2–12 slides." });
    normalizeSlides(draft.slides, draft.slideCount).forEach((slide, index) => {
      if (!slide.title.trim()) issues.push({ field: "slides", level: "error", message: `Slide ${index + 1} needs a title.` });
      if (slide.title.length > 110 || slide.body.length > 360) issues.push({ field: "slides", level: "warning", message: `Slide ${index + 1} may overflow. Shorten its title or body.` });
      if (slide.title.split(/\s+/).some((word) => word.length > 28)) issues.push({ field: "slides", level: "warning", message: `Slide ${index + 1} contains a long word that may wrap awkwardly.` });
    });
  }
  if (draft.title.split(/\s+/).some((word) => word.length > 28)) issues.push({ field: "title", level: "warning", message: "The title contains a long word that may wrap awkwardly." });

  return issues;
}

export function safeAssetFilename(name: string) {
  const normalized = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return normalized || "trexiti-asset";
}
