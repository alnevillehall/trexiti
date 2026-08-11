import type { NavigationItem } from "@/lib/content/types";
import { TREXITI_CONTACT_EMAIL } from "@/lib/marketing/contact";

export const siteConfig = {
  name: "Trexiti",
  tagline: "Digital systems for ambitious businesses.",
  description:
    "Trexiti combines business analysis, design and engineering to build websites, software, operational systems and automation around how a business actually works.",
  url: "https://www.trexiti.com",
  email: TREXITI_CONTACT_EMAIL,
  serviceArea: "Jamaica-based. Working with ambitious businesses globally.",
} as const;

export const primaryNavigation = [
  { label: "Work", href: "/work" },
  { label: "Capabilities", href: "/services" },
  { label: "Systems Review", href: "/systems-review" },
  { label: "About", href: "/about" },
  { label: "Insights", href: "/insights" },
] as const satisfies readonly NavigationItem[];

export const footerNavigation = {
  work: [
    { label: "Selected work", href: "/work" },
    { label: "PropertyOS", href: "/propertyos" },
    { label: "ServiceOS", href: "/service-businesses" },
  ],
  capabilities: [
    { label: "Capability statement", href: "/capabilities/overview" },
    { label: "Digital experiences", href: "/services/digital-experiences" },
    { label: "Custom software", href: "/services/custom-software" },
    { label: "Business systems", href: "/services/business-systems" },
    { label: "Automation", href: "/services/automation" },
  ],
  company: [
    { label: "Media kit", href: "/media-kit" },
    { label: "Privacy", href: "/privacy" },
    { label: "Systems Review", href: "/systems-review" },
    { label: "About", href: "/about" },
    { label: "Insights", href: "/insights" },
    { label: "Start a project", href: "/start-a-project" },
  ],
} as const satisfies Record<string, readonly NavigationItem[]>;
