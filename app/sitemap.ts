import type { MetadataRoute } from "next";

import { industries } from "@/lib/content/industries";
import {
  getInsightPublicationDate,
  getPublishedInsights,
  isInsightFeatured,
} from "@/lib/content/insights";
import { projects } from "@/lib/content/projects";
import { services } from "@/lib/content/services";
import { siteConfig } from "@/lib/content/site";

const staticRoutes = [
  "",
  "/work",
  "/services",
  "/capabilities/overview",
  "/media-kit",
  "/privacy",
  "/about",
  "/start-a-project",
  "/systems-review",
  "/resources/business-systems-friction-checklist",
  "/insights",
  "/propertyos",
  "/service-businesses",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/start-a-project" ? 0.9 : 0.8,
  }));

  const servicePages: MetadataRoute.Sitemap = services.map((service) => ({
    url: `${siteConfig.url}/services/${service.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const projectPages: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${siteConfig.url}/work/${project.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const industryPages: MetadataRoute.Sitemap = industries.map((industry) => ({
    url: `${siteConfig.url}/industries/${industry.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const insightPages: MetadataRoute.Sitemap = getPublishedInsights().map(
    (article) => ({
      url: `${siteConfig.url}/insights/${article.slug}`,
      lastModified: getInsightPublicationDate(
        article.updatedAt ?? article.publishedAt,
      ),
      changeFrequency: "monthly",
      priority: isInsightFeatured(article) ? 0.8 : 0.7,
    }),
  );

  return [
    ...pages,
    ...servicePages,
    ...industryPages,
    ...projectPages,
    ...insightPages,
  ];
}
