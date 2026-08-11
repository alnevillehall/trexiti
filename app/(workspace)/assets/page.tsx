import Link from "next/link";
import { PackageSearch, Plus, Search, SlidersHorizontal, X } from "lucide-react";

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
import {
  assetStatusLabel,
  assetStatuses,
  assetStatusTone,
  type AssetFilters,
} from "@/lib/service-os/assets";
import {
  loadAssets,
  loadAssetTypeOptions,
} from "@/lib/service-os/asset-queries";
import { formatDate } from "@/lib/service-os/customers";
import { requireTenantContext } from "@/lib/tenant/guard";

type AssetsPageProps = {
  searchParams: Promise<AssetFilters>;
};

export const dynamic = "force-dynamic";

export default async function AssetsPage({ searchParams }: AssetsPageProps) {
  const filters = await searchParams;
  const { session, organizationId } = await requireTenantContext();
  const [assets, assetTypes] = await Promise.all([
    loadAssets(organizationId, filters),
    loadAssetTypeOptions(organizationId, session.industryTemplate.key),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Assets and equipment"
        title="Equipment registry"
        badge={session.industryTemplate.name}
        description="Track the equipment, fixture, or system being serviced at each customer location with dynamic fields from the industry template."
        actions={
          <Button asChild>
            <Link href="/assets/new">
              <Plus className="size-4" />
              Register asset
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="size-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 lg:grid-cols-[minmax(240px,1fr)_220px_180px_auto_auto] lg:items-end">
            <div className="grid gap-2">
              <Label htmlFor="q">Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="q"
                  name="q"
                  defaultValue={filters.q}
                  placeholder="Asset, brand, serial, customer"
                  className="pl-8"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Asset type</Label>
              <Select name="type" defaultValue={filters.type || "all"}>
                <SelectTrigger id="type" className="w-full">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {assetTypes.map((assetType) => (
                    <SelectItem key={assetType.slug} value={assetType.slug}>
                      {assetType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={filters.status || "all"}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {assetStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">Apply</Button>
            <Button variant="outline" asChild>
              <Link href="/assets">
                <X className="size-4" />
                Clear
              </Link>
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Assets</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {assets.length} records in the active organization.
              </p>
            </div>
            <Badge variant="outline">JSON custom fields</Badge>
          </CardHeader>
          <CardContent>
            {assets.length ? (
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Serial</TableHead>
                        <TableHead>Warranty</TableHead>
                        <TableHead>Last service</TableHead>
                        <TableHead>Jobs</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assets.map((asset) => (
                        <TableRow key={asset.id}>
                          <TableCell>
                            <Button variant="link" className="h-auto p-0" asChild>
                              <Link href={`/assets/${asset.id}`}>{asset.name}</Link>
                            </Button>
                          </TableCell>
                          <TableCell>{asset.assetType}</TableCell>
                          <TableCell>{asset.customer}</TableCell>
                          <TableCell className="max-w-[220px] truncate">
                            {asset.location}
                          </TableCell>
                          <TableCell>{asset.brand || "Unknown"}</TableCell>
                          <TableCell>{asset.modelNumber || "Unknown"}</TableCell>
                          <TableCell>{asset.serialNumber || "Unknown"}</TableCell>
                          <TableCell>{asset.warrantyStatus || "Unknown"}</TableCell>
                          <TableCell>{formatDate(asset.lastServiceAt)}</TableCell>
                          <TableCell>{asset.jobsCount}</TableCell>
                          <TableCell>
                            <StatusBadge tone={assetStatusTone(asset.status)}>
                              {assetStatusLabel(asset.status)}
                            </StatusBadge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="grid gap-3 md:hidden">
                  {assets.map((asset) => (
                    <Link
                      key={asset.id}
                      href={`/assets/${asset.id}`}
                      className="rounded-lg border p-4 transition hover:bg-muted/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{asset.name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {asset.assetType}
                          </p>
                        </div>
                        <StatusBadge tone={assetStatusTone(asset.status)}>
                          {assetStatusLabel(asset.status)}
                        </StatusBadge>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {asset.customer} - {asset.location}
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <span>{asset.brand || "Unknown brand"}</span>
                        <span className="text-right">{formatDate(asset.lastServiceAt)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                <div className="mb-4 grid size-12 place-items-center rounded-md border bg-muted">
                  <PackageSearch className="size-5 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold">No assets found</h2>
                <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                  Try a different filter or register the first equipment record for this tenant.
                </p>
                <Button className="mt-5" asChild>
                  <Link href="/assets/new">Register asset</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
