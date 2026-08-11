import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { loadJobs, loadJobStatuses } from "@/lib/service-os/job-queries";
import {
  formatTimeWindow,
  priorityLabel,
  priorityTone,
} from "@/lib/service-os/jobs";
import { requireTenantContext } from "@/lib/tenant/guard";

export const dynamic = "force-dynamic";

export default async function JobBoardPage() {
  const { session, organizationId } = await requireTenantContext();
  const [jobs, statuses] = await Promise.all([
    loadJobs(organizationId, {}),
    loadJobStatuses(organizationId),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Dispatch board"
        title="Job board"
        badge={session.organization.name}
        description="Kanban-style workflow view grouped by each company's customizable job statuses."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/jobs">
                <ArrowLeft className="size-4" />
                List
              </Link>
            </Button>
            <Button asChild>
              <Link href="/jobs/new">
                <Plus className="size-4" />
                Create job
              </Link>
            </Button>
          </>
        }
      />

      <div className="overflow-x-auto pb-4">
        <div className="grid min-w-[1040px] gap-4 xl:grid-cols-4 2xl:grid-cols-6">
          {statuses.map((status) => {
            const columnJobs = jobs.filter((job) => job.statusSlug === status.slug);

            return (
              <Card key={status.slug} className="h-fit">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: status.color ?? "#64748b" }}
                        aria-hidden="true"
                      />
                      {status.name}
                    </CardTitle>
                    <Badge variant="secondary">{columnJobs.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {columnJobs.length ? (
                    columnJobs.map((job) => (
                      <Link
                        key={job.id}
                        href={`/jobs/${job.id}`}
                        className="rounded-md border bg-background p-3 shadow-sm transition hover:bg-muted/40"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-mono text-xs text-muted-foreground">
                              {job.number}
                            </p>
                            <p className="mt-1 line-clamp-2 font-medium">{job.title}</p>
                          </div>
                          <StatusBadge tone={priorityTone(job.priority)}>
                            {priorityLabel(job.priority)}
                          </StatusBadge>
                        </div>
                        <p className="mt-2 truncate text-sm text-muted-foreground">
                          {job.customerName}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {job.location}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Badge variant="outline">
                            {formatTimeWindow(job.scheduledStart, job.scheduledEnd)}
                          </Badge>
                          {job.assignedTechnicians.length ? (
                            <Badge variant="secondary">
                              {job.assignedTechnicians[0]}
                            </Badge>
                          ) : (
                            <StatusBadge tone="amber">Unassigned</StatusBadge>
                          )}
                          {job.isOverdue ? (
                            <StatusBadge tone="red">Overdue</StatusBadge>
                          ) : null}
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                      No jobs in {status.name.toLowerCase()}.
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
