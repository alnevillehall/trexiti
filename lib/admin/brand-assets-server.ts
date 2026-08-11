import "server-only";

import type { MarketingAsset, Prisma } from "@prisma/client";

import {
  brandAssetFormats,
  brandAssetTemplates,
  type BrandAssetDraft,
  type BrandAssetSlide,
} from "@/lib/admin/brand-assets";

function isSlide(value: Prisma.JsonValue): value is Prisma.JsonObject & { title: string; body: string } {
  return Boolean(
    value
    && typeof value === "object"
    && !Array.isArray(value)
    && typeof value.title === "string"
    && typeof value.body === "string",
  );
}

function getSlides(value: Prisma.JsonValue | null): BrandAssetSlide[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isSlide).map((slide) => ({
    title: slide.title,
    body: slide.body,
    ...(typeof slide.copy === "string" ? { copy: slide.copy } : {}),
  }));
}

export function marketingAssetToDraft(asset: MarketingAsset): BrandAssetDraft | null {
  const template = brandAssetTemplates.find((option) => option.id === asset.template)?.id;
  const format = brandAssetFormats.find((option) => option.id === asset.format)?.id;
  if (!template || !format) return null;

  return {
    id: asset.id,
    name: asset.name,
    status: asset.status,
    template,
    format,
    variant: asset.variant ?? "LIGHT",
    title: asset.title ?? "",
    eyebrow: asset.eyebrow ?? "",
    body: asset.body ?? "",
    cta: asset.cta ?? "",
    altText: asset.altText ?? "",
    slideCount: asset.slideCount,
    slides: getSlides(asset.slides),
    systemNodes: asset.systemNodes,
    destinationUrl: asset.destinationUrl ?? "",
    campaignId: asset.campaignId ?? "",
    contentId: asset.contentId ?? "",
    notes: asset.notes ?? "",
  };
}
