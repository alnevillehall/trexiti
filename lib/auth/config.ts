export function isWorkspaceDemoMode(
  environment: NodeJS.ProcessEnv = process.env,
) {
  return (
    environment.NODE_ENV !== "production" &&
    (environment.NEXT_PUBLIC_AUTH_PROVIDER ?? "development") === "development"
  );
}
