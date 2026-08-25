export type AutomationMode = "OFF" | "SHADOW" | "GUARDED";

export function getRuntimeAutomationMode(): AutomationMode {
  const configured = process.env.COO_AUTOMATION_MODE?.trim().toUpperCase();
  if (configured === "OFF" || configured === "SHADOW" || configured === "GUARDED") {
    return configured;
  }
  return "SHADOW";
}

export function getEffectiveAutomationMode(
  policyMode: AutomationMode,
): AutomationMode {
  const runtimeMode = getRuntimeAutomationMode();
  if (runtimeMode === "OFF" || policyMode === "OFF") return "OFF";
  if (runtimeMode === "SHADOW" || policyMode === "SHADOW") return "SHADOW";
  return "GUARDED";
}
