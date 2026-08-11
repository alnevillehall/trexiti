import type { NavigationItem } from "@/lib/content/types";

export const siteConfig = {
  name: "Trexiti",
  tagline: "Digital systems for ambitious businesses.",
  description:
    "Trexiti understands how businesses work, identifies what is slowing them down, and builds the digital systems they need to operate better.",
  url: "https://trexiti.com",
  email: "hello@trexiti.com",
  serviceArea: "Jamaica-based. Working with ambitious businesses globally.",
  linkedInLabel: "LinkedIn — profile forthcoming",
} as const;

export const primaryNavigation = [
  { label: "Work", href: "/work" },
  { label: "Capabilities", href: "/services" },
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
    { label: "Digital experiences", href: "/services/digital-experiences" },
    { label: "Custom software", href: "/services/custom-software" },
    { label: "Business systems", href: "/services/business-systems" },
    { label: "Automation", href: "/services/automation" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Insights", href: "/insights" },
    { label: "Start a project", href: "/start-a-project" },
  ],
} as const satisfies Record<string, readonly NavigationItem[]>;
