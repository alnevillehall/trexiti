import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CheckSquare,
  ClipboardList,
  FileImage,
  FileText,
  History,
  MapPin,
  PackageSearch,
  Phone,
  ReceiptText,
  Save,
  UserRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { changeWorkOrderStatus } from "@/app/(workspace)/jobs/actions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatDate,
  formatMoney,
  formatPhone,
} from "@/lib/service-os/customers";
import { loadJobProfile, loadJobStatuses } from "@/lib/service-os/job-queries";
import {
  formatDateTime,
  formatDuration,
  formatTimeWindow,
  paymentStatusLabel,
  paymentStatusTone,
  priorityLabel,
  priorityTone,
  sourceLabel,
  statusTone,
  type JobProfile,
} from "@/lib/service-os/jobs";
import { requireTenantContext } from "@/lib/tenant/guard";

type JobDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const { session, organizationId } = await requireTenantContext();
  const [job, statuses] = await Promise.all([
    loadJobProfile(organizationId, id),
    loadJobStatuses(organizationId),
  ]);

  if (!job) {
    notFound();
  }

  const currency = session.organization.currency;

  return (
    <>
      <PageHeader
        eyebrow="Work order"
        title={`${job.number} - ${job.title}`}
        badge={job.serviceCategory}
        description={job.customerComplaint || "Customer request, dispatch state, technician updates, billing links, and activity timeline."}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/jobs">
                <ArrowLeft className="size-4" />
                Back
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/jobs/board">
                <ClipboardList className="size-4" />
                Board
              </Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="grid h-fit gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="size-4" />
                  Job status
                </CardTitle>
                <StatusBadge tone={statusTone(job.statusLifecycle, job.statusSlug)}>
                  {job.statusName}
                </StatusBadge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm">
              <Metric label="Priority" value={priorityLabel(job.priority)} tone={priorityTone(job.priority)} />
              <Metric label="Payment" value={paymentStatusLabel(job.paymentStatus)} tone={paymentStatusTone(job.paymentStatus)} />
              <DetailLine icon={CalendarClock} label="Scheduled" value={formatTimeWindow(job.scheduledStart, job.scheduledEnd)} />
              <DetailLine icon={CalendarClock} label="Preferred" value={formatTimeWindow(job.preferredStart, job.preferredEnd)} />
              <DetailLine icon={ClipboardList} label="Source" value={sourceLabel(job.source)} />
              <DetailLine icon={CalendarClock} label="Estimated duration" value={formatDuration(job.estimatedDurationMin)} />
              {statuses.some((status) => status.id) ? (
                <>
                  <Separator />
                  <form action={changeWorkOrderStatus} className="grid gap-3">
                    <input type="hidden" name="workOrderId" value={job.id} />
                    <Select name="statusId" defaultValue={statuses.find((status) => status.slug === job.statusSlug)?.id}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Change status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses
                          .filter((status) => status.id)
                          .map((status) => (
                            <SelectItem key={status.id} value={status.id!}>
                              {status.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button type="submit">
                      <Save className="size-4" />
                      Update status
                    </Button>
                  </form>
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="size-4" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm">
              <DetailLine icon={UserRound} label="Name" value={job.customer.name} href={`/customers/${job.customer.id}`} />
              <DetailLine icon={Phone} label="Phone" value={formatPhone(job.customer.phone)} />
              <DetailLine icon={Phone} label="WhatsApp" value={formatPhone(job.customer.whatsapp)} />
              <DetailLine icon={FileText} label="Email" value={job.customer.email || "No email"} />
              <Badge variant="outline" className="w-fit">
                {job.customer.type.replaceAll("_", " ")}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="size-4" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              {job.customerLocation ? (
                <>
                  <p className="font-medium">{job.customerLocation.address}</p>
                  <Detail label="Access" value={job.customerLocation.accessNotes || "No access notes"} />
                  <Detail label="Contact" value={job.customerLocation.contactName || "No site contact"} />
                  <Detail label="Contact phone" value={formatPhone(job.customerLocation.contactPhone)} />
                  <Detail label="Security" value={job.customerLocation.securityNotes || "No security notes"} />
                  <Detail label="Preferred times" value={job.customerLocation.preferredTimes || "No preference"} />
                  {job.customerLocation.mapUrl ? (
                    <Button variant="outline" asChild>
                      <Link href={job.customerLocation.mapUrl}>Open map</Link>
                    </Button>
                  ) : null}
                </>
              ) : (
                <p className="text-muted-foreground">No location attached.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageSearch className="size-4" />
                Asset
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              {job.asset ? (
                <>
                  <DetailLine icon={PackageSearch} label="Asset" value={job.asset.name} href={`/assets/${job.asset.id}`} />
                  <Detail label="Type" value={job.asset.assetType} />
                  <Detail label="Brand" value={job.asset.manufacturer || "Unknown"} />
                  <Detail label="Model" value={job.asset.modelNumber || "Unknown"} />
                  <Detail label="Serial" value={job.asset.serialNumber || "Unknown"} />
                  <Detail label="Warranty" value={job.asset.warrantyStatus || "Unknown"} />
                  <Detail label="Last service" value={formatDate(job.asset.lastServiceAt)} />
                </>
              ) : (
                <p className="text-muted-foreground">No asset linked to this work order.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Request and notes</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm">
                <Detail label="Customer complaint/request" value={job.customerComplaint || job.description || "No complaint captured"} />
                <Detail label="Internal notes" value={job.internalNotes || "No internal notes"} />
                <Detail label="Created by" value={job.createdBy || "Unknown"} />
                <Detail label="Requested" value={formatDateTime(job.requestedAt)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assignment</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {job.assignments.length ? (
                  job.assignments.map((assignment) => (
                    <div key={assignment.id} className="rounded-md border p-3 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{assignment.technicianName}</p>
                          <p className="mt-1 text-muted-foreground">
                            {formatPhone(assignment.technicianPhone)}
                          </p>
                        </div>
                        <Badge variant="outline">{assignment.status.replaceAll("_", " ")}</Badge>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">
                        Assigned {formatDateTime(assignment.assignedAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No technician is assigned yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="size-4" />
                Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              {job.checklist ? (
                <div className="grid gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{job.checklist.name}</p>
                    <Badge variant="outline">{job.checklist.items.length} items</Badge>
                  </div>
                  {job.checklist.items.map((item) => (
                    <div
                      key={item.id}
                      className="grid gap-2 rounded-md border p-3 text-sm md:grid-cols-[minmax(0,1fr)_160px]"
                    >
                      <div>
                        <p className="font-medium">{item.label}</p>
                        {item.note ? (
                          <p className="mt-1 text-muted-foreground">{item.note}</p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 md:justify-end">
                        <Badge variant={item.required ? "default" : "outline"}>
                          {item.required ? "Required" : "Optional"}
                        </Badge>
                        <StatusBadge tone={item.response === "FAIL" ? "red" : item.response ? "green" : "neutral"}>
                          {item.response || "Open"}
                        </StatusBadge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No checklist is attached to this work order yet.
                </p>
              )}
            </CardContent>
          </Card>

          <section className="grid gap-6 lg:grid-cols-2">
            <SupportCard job={job} />
            <BillingCard job={job} currency={currency} />
          </section>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="size-4" />
                Activity timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {job.activity.length ? (
                job.activity.map((item) => (
                  <div key={item.id} className="grid grid-cols-[24px_minmax(0,1fr)] gap-3">
                    <span className="mt-1 size-2.5 rounded-full bg-primary" aria-hidden="true" />
                    <div>
                      <p className="font-medium">{item.action}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.message || "No message"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(item.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No activity recorded for this work order.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}

function DetailLine({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
}) {
  const body = (
    <>
      <Icon className="mt-0.5 size-4 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-medium">{value}</p>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-start gap-3 rounded-md transition hover:text-primary">
        {body}
      </Link>
    );
  }

  return <div className="flex items-start gap-3">{body}</div>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 leading-6">{value}</p>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "neutral" | "blue" | "green" | "amber" | "red";
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/25 p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <StatusBadge tone={tone}>{value}</StatusBadge>
    </div>
  );
}

function SupportCard({ job }: { job: JobProfile }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileImage className="size-4" />
          Notes and attachments
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {job.notes.length ? (
          job.notes.map((note) => (
            <div key={note.id} className="rounded-md border p-3 text-sm">
              <div className="mb-2 flex items-center justify-between gap-3">
                <Badge variant={note.pinned ? "default" : "outline"}>
                  {note.pinned ? "Pinned" : "Note"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(note.createdAt)}
                </span>
              </div>
              <p className="leading-6">{note.body}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No notes captured yet.</p>
        )}

        <Separator />

        {job.attachments.length ? (
          job.attachments.map((attachment) => (
            <Button
              key={attachment.id}
              variant="outline"
              className="justify-start"
              asChild
            >
              <Link href={attachment.url}>
                <FileText className="size-4" />
                {attachment.fileName}
              </Link>
            </Button>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No photos or files have been attached.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function BillingCard({
  job,
  currency,
}: {
  job: JobProfile;
  currency: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ReceiptText className="size-4" />
          Quote and invoice links
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {job.quotes.map((quote) => (
              <TableRow key={quote.id}>
                <TableCell>Quote</TableCell>
                <TableCell className="font-mono">{quote.number}</TableCell>
                <TableCell>{quote.status}</TableCell>
                <TableCell className="text-right">
                  {formatMoney(quote.total, currency)}
                </TableCell>
              </TableRow>
            ))}
            {job.invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>Invoice</TableCell>
                <TableCell className="font-mono">{invoice.number}</TableCell>
                <TableCell>{invoice.status}</TableCell>
                <TableCell className="text-right">
                  {formatMoney(invoice.total, currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!job.quotes.length && !job.invoices.length ? (
          <p className="text-sm text-muted-foreground">
            No quote or invoice is linked yet.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/quotes">Open quotes</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/invoices">Open invoices</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
