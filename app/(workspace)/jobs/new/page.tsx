import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createWorkOrder } from "@/app/(workspace)/jobs/actions";
import { JobForm } from "@/components/jobs/job-form";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { loadJobFormOptions } from "@/lib/service-os/job-queries";
import { requireTenantContext } from "@/lib/tenant/guard";

export const dynamic = "force-dynamic";

export default async function NewJobPage() {
  const { session, organizationId } = await requireTenantContext([
    "PLATFORM_OWNER",
    "COMPANY_ADMIN",
    "DISPATCHER",
    "SALES",
  ]);
  const options = await loadJobFormOptions(
    organizationId,
    session.industryTemplate.key,
  );

  return (
    <>
      <PageHeader
        eyebrow="Jobs and work orders"
        title="Create work order"
        badge={session.industryTemplate.name}
        description="Fast intake for office staff: create or select the customer, location, asset, service category, schedule, and technician assignment in one flow."
        actions={
          <Button variant="outline" asChild>
            <Link href="/jobs">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
        }
      />

      <JobForm action={createWorkOrder} options={options} submitLabel="Create job" />
    </>
  );
}
