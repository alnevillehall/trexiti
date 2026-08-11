export type InsightSocialVisual =
  | {
      variant: "human-layer";
      sources: readonly string[];
      layer: readonly [string, string];
      outcomes: readonly string[];
    }
  | {
      variant: "decision";
      choices: readonly {
        label: string;
        detail: string;
      }[];
    }
  | {
      variant: "journey";
      stages: readonly string[];
    };

export const insightSocialVisuals: Record<string, InsightSocialVisual> = {
  "your-employees-shouldnt-be-your-api": {
    variant: "human-layer",
    sources: ["WhatsApp", "Spreadsheet", "Calendar"],
    layer: ["Human", "Manual connection layer"],
    outcomes: ["Work", "Money", "Status"],
  },
  "you-probably-dont-need-custom-software": {
    variant: "decision",
    choices: [
      { label: "Keep", detail: "Proven tools" },
      { label: "Connect", detail: "Shared context" },
      { label: "Build", detail: "Strategic boundary" },
    ],
  },
  "the-website-is-not-the-end-of-the-customer-journey": {
    variant: "journey",
    stages: ["Visitor", "Website", "Sales", "Operations", "Payment"],
  },
};

export function getInsightSocialVisual(slug: string) {
  return insightSocialVisuals[slug];
}
