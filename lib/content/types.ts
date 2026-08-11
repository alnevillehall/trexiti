export type NavigationItem = {
  label: string;
  href: string;
};

export type ServiceSlug =
  | "digital-experiences"
  | "custom-software"
  | "business-systems"
  | "automation";

export type Service = {
  slug: ServiceSlug;
  index: string;
  title: string;
  shortTitle: string;
  summary: string;
  proposition: string;
  capabilities: readonly string[];
  outcomes: readonly string[];
  process: readonly {
    title: string;
    description: string;
  }[];
};

export type ProjectSlug = "propertyos" | "serviceos";

export type Project = {
  slug: ProjectSlug;
  title: string;
  descriptor: string;
  sector: string;
  year: string;
  summary: string;
  challenge: string;
  response: string;
  impact: string;
  services: readonly string[];
  systemLayers: readonly string[];
  visual: "property" | "service";
  productHref: string;
};
