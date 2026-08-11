import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  BriefcaseBusiness,
  CalendarDays,
  History,
  Mail,
  MapPin,
  PackageSearch,
  Paperclip,
  Phone,
  ReceiptText,
  StickyNote,
  UserRound,
  Wrench,
  type LucideIcon,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { prisma } from "@/lib/prisma";
import {
  compactAddress,
  customerStatusLabel,
  customerTypeLabel,
  formatDate,
  formatMoney,
  formatPhone,
  getDemoCustomer,
  statusTone,
  type CustomerProfile,
} from "@/lib/service-os/customers";
import { requireTenantContext } from "@/lib/tenant/guard";

type CustomerProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function CustomerProfilePage({ params }: CustomerProfilePageProps) {
  const { id } = await params;
  const { session, organizationId } = await requireTenantContext();
  const customer = await loadCustomerProfile(organizationId, id);

  if (!customer) {
    notFound();
  }

  const currency = session.organization.currency;

  return (
    <>
      <PageHeader
        eyebrow="Customer profile"
        title={customer.displayName}
        badge={customerTypeLabel(customer.type)}
        description={customer.notesSummary || "Customer record, sites, assets, service history, documents, and account activity."}
        actions={
          <Button variant="outline" asChild>
            <Link href="/customers">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="grid h-fit gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <UserRound className="size-4" />
                  Contact info
                </CardTitle>
                <StatusBadge tone={statusTone(customer.status)}>
                  {customerStatusLabel(customer.status)}
                </StatusBadge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm">
              <ContactLine icon={UserRound} label="Primary contact" value={customer.primaryName || customer.displayName} />
              <ContactLine icon={Phone} label="Phone" value={formatPhone(customer.phone)} />
              <ContactLine icon={Phone} label="WhatsApp" value={formatPhone(customer.whatsapp)} />
              <ContactLine icon={Mail} label="Email" value={customer.email || "No email"} />
              <ContactLine icon={BriefcaseBusiness} label="Source" value={customer.source || "Not captured"} />
              {customer.taxId ? (
                <ContactLine icon={ReceiptText} label="Tax ID" value={customer.taxId} />
              ) : null}
              <div className="flex flex-wrap gap-2 pt-2">
                {customer.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <SummaryMetric label="Jobs" value={customer.jobsCount.toString()} />
              <SummaryMetric
                label="Outstanding balance"
                value={formatMoney(customer.outstandingBalance, currency)}
              />
              <SummaryMetric
                label="Last service"
                value={formatDate(customer.lastServiceDate)}
              />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="locations">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 xl:w-fit">
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="locations" className="mt-4 grid gap-4">
            <SectionHeader icon={MapPin} title="Locations and sites" count={customer.locations.length} />
            <div className="grid gap-4 lg:grid-cols-2">
              {customer.locations.map((location) => (
                <Card key={location.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-3">
                      <span>{location.label}</span>
                      {location.mapUrl ? (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={location.mapUrl}>Map</Link>
                        </Button>
                      ) : null}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 text-sm">
                    <p className="font-medium">{compactAddress(location)}</p>
                    <Detail label="Contact" value={location.contactName || "Not set"} />
                    <Detail label="Contact phone" value={formatPhone(location.contactPhone)} />
                    <Detail label="Access" value={location.accessNotes || "No access notes"} />
                    <Detail label="Security" value={location.securityNotes || "No security notes"} />
                    <Detail label="Preferred times" value={location.preferredTimes || "No preference"} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="assets" className="mt-4 grid gap-4">
            <SectionHeader icon={PackageSearch} title="Assets and equipment" count={customer.assets.length} />
            <DataTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Serial</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>{asset.locationLabel || "No location"}</TableCell>
                    <TableCell>{asset.manufacturer || "Unknown"}</TableCell>
                    <TableCell>{asset.modelNumber || "Unknown"}</TableCell>
                    <TableCell>{asset.serialNumber || "Unknown"}</TableCell>
                    <TableCell>{asset.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          </TabsContent>

          <TabsContent value="jobs" className="mt-4 grid gap-4">
            <SectionHeader icon={Wrench} title="Job history" count={customer.jobs.length} />
            <DataTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Work order</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono">{job.number}</TableCell>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell>{job.priority}</TableCell>
                    <TableCell>{job.lifecycle.replaceAll("_", " ")}</TableCell>
                    <TableCell>{formatDate(job.requestedAt)}</TableCell>
                    <TableCell>{formatDate(job.completedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          </TabsContent>

          <TabsContent value="billing" className="mt-4 grid gap-6">
            <SectionHeader icon={Banknote} title="Quotes, invoices, and payments" count={customer.quotes.length + customer.invoices.length + customer.payments.length} />
            <BillingTables customer={customer} currency={currency} />
          </TabsContent>

          <TabsContent value="activity" className="mt-4 grid gap-6">
            <SectionHeader icon={History} title="Notes, attachments, and activity timeline" count={customer.activity.length} />
            <SupportTables customer={customer} />
          </TabsContent>
        </Tabs>
      </section>
    </>
  );
}

function ContactLine({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-medium">{value}</p>
      </div>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/25 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  count,
}: {
  icon: LucideIcon;
  title: string;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <Icon className="size-4" />
        {title}
      </h2>
      <Badge variant="outline">{count}</Badge>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 leading-6">{value}</p>
    </div>
  );
}

function DataTable({ children }: { children: React.ReactNode }) {
  return (
    <Card>
      <CardContent>
        <Table>{children}</Table>
      </CardContent>
    </Card>
  );
}

function BillingTables({
  customer,
  currency,
}: {
  customer: CustomerProfile;
  currency: string;
}) {
  return (
    <div className="grid gap-6">
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Quote</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Expires</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customer.quotes.map((quote) => (
            <TableRow key={quote.id}>
              <TableCell className="font-mono">{quote.number}</TableCell>
              <TableCell>{quote.title}</TableCell>
              <TableCell>{quote.status}</TableCell>
              <TableCell>{formatMoney(quote.total, currency)}</TableCell>
              <TableCell>{formatDate(quote.expiresAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTable>

      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Issued</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customer.invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-mono">{invoice.number}</TableCell>
              <TableCell>{invoice.status}</TableCell>
              <TableCell>{formatMoney(invoice.total, currency)}</TableCell>
              <TableCell className="font-medium">
                {formatMoney(invoice.balanceDue, currency)}
              </TableCell>
              <TableCell>{formatDate(invoice.issuedAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTable>

      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Payment</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Paid</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customer.payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-mono">{payment.reference || payment.id}</TableCell>
              <TableCell>{payment.method.replaceAll("_", " ")}</TableCell>
              <TableCell>{payment.status}</TableCell>
              <TableCell>{formatMoney(payment.amount, currency)}</TableCell>
              <TableCell>{formatDate(payment.paidAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTable>
    </div>
  );
}

function SupportTables({ customer }: { customer: CustomerProfile }) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StickyNote className="size-4" />
            Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {customer.notes.map((note) => (
            <div key={note.id} className="rounded-md border p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <Badge variant={note.pinned ? "default" : "outline"}>
                  {note.pinned ? "Pinned" : "Note"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDate(note.createdAt)}
                </span>
              </div>
              <p className="text-sm leading-6">{note.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Attachment</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Added</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customer.attachments.map((attachment) => (
            <TableRow key={attachment.id}>
              <TableCell>
                <Button variant="link" className="h-auto p-0" asChild>
                  <Link href={attachment.url}>
                    <Paperclip className="size-4" />
                    {attachment.fileName}
                  </Link>
                </Button>
              </TableCell>
              <TableCell>{attachment.mimeType}</TableCell>
              <TableCell>{formatFileSize(attachment.sizeBytes)}</TableCell>
              <TableCell>{formatDate(attachment.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTable>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="size-4" />
            Activity timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {customer.activity.map((item) => (
            <div key={item.id} className="grid grid-cols-[24px_minmax(0,1fr)] gap-3">
              <span className="mt-1 size-2.5 rounded-full bg-primary" aria-hidden="true" />
              <div>
                <p className="font-medium">{item.action}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.message || "No message"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(item.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function formatFileSize(value?: number | null) {
  if (!value) {
    return "Unknown";
  }

  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`;
  }

  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

async function loadCustomerProfile(
  organizationId: string,
  id: string,
): Promise<CustomerProfile | null> {
  try {
    const [customer, notes, attachments, activity] = await Promise.all([
      prisma.customer.findFirst({
        where: { id, organizationId },
        include: {
          locations: { orderBy: { createdAt: "asc" } },
          assets: {
            orderBy: { createdAt: "asc" },
            include: { customerLocation: true },
          },
          workOrders: {
            orderBy: { requestedAt: "desc" },
            include: { status: true },
          },
          quotes: { orderBy: { createdAt: "desc" } },
          invoices: { orderBy: { createdAt: "desc" } },
          payments: { orderBy: { createdAt: "desc" } },
          _count: { select: { workOrders: true } },
        },
      }),
      prisma.note.findMany({
        where: { organizationId, entityType: "CUSTOMER", entityId: id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.attachment.findMany({
        where: { organizationId, entityType: "CUSTOMER", entityId: id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.activityLog.findMany({
        where: { organizationId, entityType: "CUSTOMER", entityId: id },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!customer) {
      return null;
    }

    const lastWorkOrder = customer.workOrders[0];
    const outstandingBalance = customer.invoices.reduce(
      (total, invoice) => total + Number(invoice.balanceDue.toString()),
      0,
    );

    return {
      id: customer.id,
      displayName: customer.displayName,
      type: customer.type,
      status: customer.status,
      primaryName: customer.primaryName,
      phone: customer.phone,
      whatsapp: customer.whatsapp,
      email: customer.email,
      taxId: customer.taxId,
      source: customer.source,
      tags: customer.tags,
      notesSummary: customer.notesSummary,
      mainLocation: compactAddress(customer.locations[0]),
      jobsCount: customer._count.workOrders,
      outstandingBalance,
      lastServiceDate: lastWorkOrder?.completedAt ?? lastWorkOrder?.requestedAt,
      locations: customer.locations,
      assets: customer.assets.map((asset) => ({
        id: asset.id,
        name: asset.name,
        manufacturer: asset.manufacturer,
        modelNumber: asset.modelNumber,
        serialNumber: asset.serialNumber,
        status: asset.status,
        locationLabel: asset.customerLocation.label,
      })),
      jobs: customer.workOrders.map((job) => ({
        id: job.id,
        number: job.number,
        title: job.title,
        lifecycle: job.status.lifecycle,
        priority: job.priority,
        requestedAt: job.requestedAt,
        completedAt: job.completedAt,
      })),
      quotes: customer.quotes.map((quote) => ({
        id: quote.id,
        number: quote.number,
        title: quote.title,
        status: quote.status,
        total: Number(quote.total.toString()),
        expiresAt: quote.expiresAt,
      })),
      invoices: customer.invoices.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        total: Number(invoice.total.toString()),
        balanceDue: Number(invoice.balanceDue.toString()),
        issuedAt: invoice.issuedAt,
      })),
      payments: customer.payments.map((payment) => ({
        id: payment.id,
        status: payment.status,
        method: payment.method,
        amount: Number(payment.amount.toString()),
        paidAt: payment.paidAt,
        reference: payment.reference,
      })),
      notes,
      attachments,
      activity,
    };
  } catch {
    return getDemoCustomer(id);
  }
}
