import type { DiscoveredProspect } from "@/lib/coo/ai/schemas";

export type ObservedWebSource = {
  url: string;
  title: string;
};

function normalizedSourceUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = "";
    if (url.pathname !== "/") {
      url.pathname = url.pathname.replace(/\/+$/, "");
    }
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Retains only citations whose URLs were actually emitted by the Gateway search
 * tool. The application supplies observation time and source title so model
 * output cannot manufacture either field.
 */
export function bindProspectCitationsToObservedSources(input: {
  prospects: DiscoveredProspect[];
  observedSources: readonly ObservedWebSource[];
  observedAt: string;
}) {
  const observed = new Map<string, ObservedWebSource>();
  for (const source of input.observedSources) {
    const key = normalizedSourceUrl(source.url);
    if (key) observed.set(key, source);
  }

  return input.prospects.map((prospect) => ({
    ...prospect,
    citations: prospect.citations.flatMap((citation) => {
      const key = normalizedSourceUrl(citation.url);
      const source = key ? observed.get(key) : null;
      if (!source) return [];
      return [
        {
          url: source.url,
          title: (source.title || source.url).slice(0, 240),
          observedAt: input.observedAt,
        },
      ];
    }),
  }));
}
