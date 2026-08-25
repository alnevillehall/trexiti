export function isApprovalExecutionModeAllowed(
  action: string,
  mode: "OFF" | "SHADOW" | "GUARDED",
) {
  return action === "CHANGE_POLICY" || mode === "GUARDED";
}
