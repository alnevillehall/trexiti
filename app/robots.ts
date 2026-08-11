import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/content/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/customers",
        "/assets",
        "/admin",
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
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
