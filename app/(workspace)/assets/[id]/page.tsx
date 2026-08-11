import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Edit,
  FileText,
  History,
  MapPin,
  PackageSearch,
  Paperclip,
  ShieldCheck,
  UserRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
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
  assetStatusLabel,
  assetStatusTone,
  formatCustomFieldValue,
  getAssetFieldDefinitions,
} from "@/lib/service-os/assets";
import { loadAssetProfile } from "@/lib/service-os/asset-queries";
import { formatDate } from "@/lib/service-os/customers";
import { requireTenantContext } from "@/lib/tenant/guard";

type AssetDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function AssetDetailPage({ params }: AssetDetailPageProps) {
  const { id } = await params;
  const { session, organizationId } = await requireTenantContext();
  const asset = await loadAssetProfile(organizationId, id);

  if (!asset) {
    notFound();
  }

  const customFields = getAssetFieldDefinitions(
    session.industryTemplate.key,
    asset.assetType,
  );

  return (
    <>
      <PageHeader
        eyebrow="Asset profile"
        title={asset.name}
        badge={asset.assetType}
        description={asset.notesSummary || "Equipment record with location, warranty, custom fields, service history, and attachments."}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/assets">
                <ArrowLeft className="size-4" />
                Back
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/assets/${asset.id}/edit`}>
                <Edit className="size-4" />
                Edit
              </Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="grid h-fit gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <PackageSearch className="size-4" />
                  Asset summary
                </CardTitle>
                <StatusBadge tone={assetStatusTone(asset.status)}>
                  {assetStatusLabel(asset.status)}
                </StatusBadge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm">
              <DetailLine icon={UserRound} label="Customer" value={asset.customer} href={`/customers/${asset.customerId}`} />
              <DetailLine icon={MapPin} label="Location" value={asset.location} />
              <DetailLine icon={PackageSearch} label="Asset type" value={asset.assetType} />
              <DetailLine icon={ShieldCheck} label="Warranty" value={asset.warrantyStatus || "Unknown"} />
              <DetailLine icon={CalendarDays} label="Last service" value={formatDate(asset.lastServiceAt)} />
              <DetailLine icon={Wrench} label="Linked jobs" value={asset.jobsCount.toString()} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Common fields</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <Metric label="Brand" value={asset.brand || "Unknown"} />
              <Metric label="Model number" value={asset.modelNumber || "Unknown"} />
              <Metric label="Serial number" value={asset.serialNumber || "Unknown"} />
              <Metric label="Installed" value={formatDate(asset.installedAt)} />
              <Metric label="Warranty expires" value={formatDate(asset.warrantyExpiresAt)} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom fields</CardTitle>
              <p className="text-sm text-muted-foreground">
                Rendered from {session.industryTemplate.name} and the {asset.assetType} asset type.
              </p>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {customFields.map((field) => (
                <Metric
                  key={field.key}
                  label={field.label}
                  value={formatCustomFieldValue(asset.customFields[field.key])}
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="size-4" />
                Asset job history
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
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
                  {asset.jobs.map((job) => (
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
              </Table>
            </CardContent>
          </Card>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Paperclip className="size-4" />
                  Photos and attachments
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {asset.attachments.length ? (
                  asset.attachments.map((attachment) => (
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
                    No photos or documents have been attached yet.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="size-4" />
                  Activity timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                {asset.activity.length ? (
                  asset.activity.map((item) => (
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
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No asset activity recorded yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </section>
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/25 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
