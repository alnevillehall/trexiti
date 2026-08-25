export type AiUsageSummary = {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  costUsd: number | null;
};

function gatewayCost(providerMetadata: unknown): number | null {
  if (
    !providerMetadata ||
    typeof providerMetadata !== "object" ||
    Array.isArray(providerMetadata)
  ) {
    return null;
  }
  const gatewayMetadata = (providerMetadata as Record<string, unknown>).gateway;
  if (
    !gatewayMetadata ||
    typeof gatewayMetadata !== "object" ||
    Array.isArray(gatewayMetadata)
  ) {
    return null;
  }
  const raw = (gatewayMetadata as Record<string, unknown>).cost;
  const value =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? Number(raw)
        : Number.NaN;
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function summarizeAiUsage(
  usage: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  },
  steps: ReadonlyArray<{ providerMetadata?: unknown }> = [],
): AiUsageSummary {
  const costs = steps
    .map((step) => gatewayCost(step.providerMetadata))
    .filter((value): value is number => value !== null);
  return {
    inputTokens: usage.inputTokens ?? null,
    outputTokens: usage.outputTokens ?? null,
    totalTokens: usage.totalTokens ?? null,
    costUsd: costs.length
      ? costs.reduce((total, value) => total + value, 0)
      : null,
  };
}
