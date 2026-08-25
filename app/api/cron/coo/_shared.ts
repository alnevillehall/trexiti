export function authorizeCron(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[coo:cron] CRON_SECRET is not configured");
    return Response.json(
      { error: "cron_not_configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json(
      { error: "unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  return null;
}

