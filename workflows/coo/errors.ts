export function workflowErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown workflow failure";
}
