import { authorizeCron } from "@/app/api/cron/coo/_shared";
import { startProspectingWorkflow } from "@/lib/coo/tools/workflow-launchers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = authorizeCron(request);
  if (unauthorized) return unauthorized;

  try {
    const launch = await startProspectingWorkflow({ trigger: "cron" });
    console.info("[coo:cron] prospecting workflow accepted", launch);
    return Response.json(
      { accepted: true, workflow: "prospecting", ...launch },
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[coo:cron] failed to start prospecting workflow", error);
    return Response.json(
      { accepted: false, error: "workflow_start_failed" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

