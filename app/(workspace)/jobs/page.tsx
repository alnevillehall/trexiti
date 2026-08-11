import Link from "next/link";
import {
  ClipboardList,
  Columns3,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/service-os/customers";
import { loadJobs, loadJobStatuses } from "@/lib/service-os/job-queries";
import {
  formatTimeWindow,
  paymentStatusLabel,
  paymentStatusOptions,
  paymentStatusTone,
  priorityLabel,
  priorityOptions,
  priorityTone,
  smartFilterOptions,
  statusTone,
  type JobFilters,
} from "@/lib/service-os/jobs";
import { requireTenantContext } from "@/lib/tenant/guard";

type JobsPageProps = {
  searchParams: Promise<JobFilters>;
};

export const dynamic = "force-dynamic";

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const filters = await searchParams;
  const { session, organizationId } = await requireTenantContext();
  const [jobs, statuses] = await Promise.all([
    loadJobs(organizationId, filters),
    loadJobStatuses(organizationId),
  ]);
  const currency = session.organization.currency;

  return (
    <>
      <PageHeader
        eyebrow="Jobs and work orders"
        title="Work order command center"
        badge={session.organization.name}
        description="Track every request from intake through dispatch, technician updates, quote approval, invoicing, and payment."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/jobs/board">
                <Columns3 className="size-4" />
                Job board
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="size-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <form className="grid gap-4 xl:grid-cols-[minmax(220px,1fr)_190px_170px_190px_auto_auto] xl:items-end">
            <div className="grid gap-2">
              <Label htmlFor="q">Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="q"
                  name="q"
                  defaultValue={filters.q}
                  placeholder="Job, customer, location, technician"
                  className="pl-8"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={filters.status || "all"}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status.slug} value={status.slug}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select name="priority" defaultValue={filters.priority || "all"}>
                <SelectTrigger id="priority" className="w-full">
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  {priorityOptions.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="payment">Payment</Label>
              <Select name="payment" defaultValue={filters.payment || "all"}>
                <SelectTrigger id="payment" className="w-full">
                  <SelectValue placeholder="All payment states" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All payment states</SelectItem>
                  {paymentStatusOptions.map((payment) => (
                    <SelectItem key={payment.value} value={payment.value}>
                      {payment.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">Apply</Button>
            <Button variant="outline" asChild>
              <Link href="/jobs">
                <X className="size-4" />
                Clear
              </Link>
            </Button>
          </form>

          <div className="flex flex-wrap gap-2">
            {smartFilterOptions.map((smart) => (
              <Button
                key={smart.value}
                variant={filters.smart === smart.value ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link href={smartFilterHref(filters, smart.value)}>{smart.label}</Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <section className="mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Work orders</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {jobs.length} jobs match this tenant-scoped view.
              </p>
            </div>
            <Badge variant="outline">{currency}</Badge>
          </CardHeader>
          <CardContent>
            {jobs.length ? (
              <>
                <div className="hidden lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Assigned tech</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Scheduled</TableHead>
                        <TableHead>Payment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell>
                            <Button variant="link" className="h-auto p-0" asChild>
                              <Link href={`/jobs/${job.id}`}>{job.number}</Link>
                            </Button>
                            <div className="text-sm font-medium">{job.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {job.serviceCategory}
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge tone={statusTone(job.statusLifecycle, job.statusSlug)}>
                              {job.statusName}
                            </StatusBadge>
                          </TableCell>
                          <TableCell>{job.customerName}</TableCell>
                          <TableCell className="max-w-[220px] truncate">
                            {job.location}
                          </TableCell>
                          <TableCell>
                            {job.assignedTechnicians.length
                              ? job.assignedTechnicians.join(", ")
                              : "Unassigned"}
                          </TableCell>
                          <TableCell>
                            <StatusBadge tone={priorityTone(job.priority)}>
                              {priorityLabel(job.priority)}
                            </StatusBadge>
                          </TableCell>
                          <TableCell>
                            <div>{formatTimeWindow(job.scheduledStart, job.scheduledEnd)}</div>
                            {job.isOverdue ? (
                              <span className="text-xs font-medium text-red-600">
                                Overdue
                              </span>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            <StatusBadge tone={paymentStatusTone(job.paymentStatus)}>
                              {paymentStatusLabel(job.paymentStatus)}
                            </StatusBadge>
                            {job.balanceDue > 0 ? (
                              <div className="mt-1 text-xs text-muted-foreground">
                                {formatMoney(job.balanceDue, currency)} due
                              </div>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="grid gap-3 lg:hidden">
                  {jobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="rounded-lg border p-4 transition hover:bg-muted/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-xs text-muted-foreground">
                            {job.number}
                          </p>
                          <p className="mt-1 truncate font-medium">{job.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {job.customerName}
                          </p>
                        </div>
                        <StatusBadge tone={priorityTone(job.priority)}>
                          {priorityLabel(job.priority)}
                        </StatusBadge>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {job.location}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <StatusBadge tone={statusTone(job.statusLifecycle, job.statusSlug)}>
                          {job.statusName}
                        </StatusBadge>
                        <Badge variant="outline">
                          {formatTimeWindow(job.scheduledStart, job.scheduledEnd)}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                <div className="mb-4 grid size-12 place-items-center rounded-md border bg-muted">
                  <ClipboardList className="size-5 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold">No jobs found</h2>
                <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                  Try a different filter or create the first work order for this organization.
                </p>
                <Button className="mt-5" asChild>
                  <Link href="/jobs/new">Create job</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function smartFilterHref(filters: JobFilters, smart: string) {
  const params = new URLSearchParams();

  for (const key of ["q", "status", "priority", "payment"] as const) {
    const value = filters[key];

    if (value && value !== "all") {
      params.set(key, value);
    }
  }

  params.set("smart", smart);
  return `/jobs?${params.toString()}`;
}
