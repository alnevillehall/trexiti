export const companyDescriptions = [
  {
    label: "Short",
    text: "Trexiti designs and builds the digital systems businesses use to sell, operate and grow.",
  },
  {
    label: "Medium",
    text: "Trexiti combines business analysis, design and engineering to build websites, software, operational systems and automation around how a business actually works.",
  },
  {
    label: "Long / approved boilerplate",
    text: "Trexiti is a Jamaica-based business systems and digital engineering company. It studies how customers, employees, information and money move through a business, then determines what should be simplified, connected, automated or built. Its work spans digital experiences, custom software, business systems and automation/integration for companies at different stages of growth.",
  },
] as const;

export const mediaKitFounder = {
  name: "Al Neville Hall",
  title: "Founder / Business Systems & Software",
} as const;

export const mediaKitCapabilities = [
  "Digital Experiences",
  "Custom Software",
  "Business Systems",
  "Automation & Integration",
] as const;

export const mediaKitColors = [
  { name: "Primary background", value: "#F1F0EB" },
  { name: "Secondary background", value: "#E6E5DF" },
  { name: "Elevated surface", value: "#FAF9F5" },
  { name: "Near black", value: "#151613" },
  { name: "Olive accent", value: "#626A50" },
  { name: "Soft olive", value: "#DFE1D3" },
  { name: "Warm white", value: "#F7F5EF" },
] as const;

export const mediaKitTypography = [
  { name: "Space Grotesk", role: "Display and headings" },
  { name: "Geist", role: "Body and interface copy" },
  { name: "Geist Mono", role: "Labels and technical notation" },
] as const;

export const mediaKitAssets = [
  {
    name: "Trexiti logo mark",
    format: "SVG",
    href: "/brand/trexiti_logo_icon.svg",
    preview: "/brand/trexiti_logo_icon.svg",
    downloadName: "trexiti-logo-mark.svg",
    background: "dark",
  },
  {
    name: "Trexiti logo mark",
    format: "Transparent PNG",
    href: "/brand/trexiti_icon_transparent_1024.png",
    preview: "/brand/trexiti_icon_transparent_1024.png",
    downloadName: "trexiti-logo-mark-1024.png",
    background: "light",
  },
] as const;
