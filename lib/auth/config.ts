export function isServiceOsEnabled(
  environment: NodeJS.ProcessEnv = process.env,
) {
  return environment.TREXITI_SERVICE_OS_ENABLED === "true";
}

export function isWorkspaceDemoMode(
  environment: NodeJS.ProcessEnv = process.env,
) {
  return (
    isServiceOsEnabled(environment) &&
    environment.NODE_ENV !== "production" &&
    (environment.NEXT_PUBLIC_AUTH_PROVIDER ?? "development") === "development"
  );
}
