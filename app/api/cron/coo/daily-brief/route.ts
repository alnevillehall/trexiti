import { authorizeCron } from "@/app/api/cron/coo/_shared";
import { startDailyBriefWorkflow } from "@/lib/coo/tools/workflow-launchers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = authorizeCron(request);
  if (unauthorized) return unauthorized;

  try {
    const launch = await startDailyBriefWorkflow({ trigger: "cron" });
    console.info("[coo:cron] daily brief workflow accepted", launch);
    return Response.json(
      { accepted: true, workflow: "daily_brief", ...launch },
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[coo:cron] failed to start daily brief workflow", error);
    return Response.json(
      { accepted: false, error: "workflow_start_failed" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

