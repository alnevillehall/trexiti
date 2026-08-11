import Link from "next/link";
import { Plus, Search, SlidersHorizontal, UsersRound, X } from "lucide-react";
import type { CustomerStatus, CustomerType, Prisma } from "@prisma/client";

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
import { prisma } from "@/lib/prisma";
import {
  compactAddress,
  customerStatusLabel,
  customerStatuses,
  customerTypeLabel,
  customerTypes,
  filterDemoCustomers,
  formatDate,
  formatMoney,
  formatPhone,
  statusTone,
  type CustomerFilters,
  type CustomerListRow,
} from "@/lib/service-os/customers";
import { requireTenantContext } from "@/lib/tenant/guard";

type CustomersPageProps = {
  searchParams: Promise<CustomerFilters>;
};

export const dynamic = "force-dynamic";

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const filters = await searchParams;
  const { session, organizationId } = await requireTenantContext();
  const customers = await loadCustomers(organizationId, filters);
  const currency = session.organization.currency;

  return (
    <>
      <PageHeader
        eyebrow="Customers"
        title="Customer directory"
        badge={session.organization.name}
        description="Search, filter, and manage tenant-scoped customer records, service sites, balances, and recent activity."
        actions={
          <Button asChild>
            <Link href="/customers/new">
              <Plus className="size-4" />
              Add customer
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
                  placeholder="Name, phone, email, location"
                  className="pl-8"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Customer type</Label>
              <Select name="type" defaultValue={filters.type || "all"}>
                <SelectTrigger id="type" className="w-full">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {customerTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
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
                  {customerStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">Apply</Button>
            <Button variant="outline" asChild>
              <Link href="/customers">
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
              <CardTitle>Customers</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {customers.length} records in the active organization.
              </p>
            </div>
            <Badge variant="outline">{currency}</Badge>
          </CardHeader>
          <CardContent>
            {customers.length ? (
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Main location</TableHead>
                        <TableHead>Jobs</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Last service</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <Button variant="link" className="h-auto p-0" asChild>
                              <Link href={`/customers/${customer.id}`}>
                                {customer.displayName}
                              </Link>
                            </Button>
                            {customer.primaryName ? (
                              <div className="text-xs text-muted-foreground">
                                {customer.primaryName}
                              </div>
                            ) : null}
                          </TableCell>
                          <TableCell>{formatPhone(customer.phone)}</TableCell>
                          <TableCell>{customer.email || "No email"}</TableCell>
                          <TableCell>{customerTypeLabel(customer.type)}</TableCell>
                          <TableCell className="max-w-[240px] truncate">
                            {customer.mainLocation || "No location"}
                          </TableCell>
                          <TableCell>{customer.jobsCount}</TableCell>
                          <TableCell className="font-medium">
                            {formatMoney(customer.outstandingBalance, currency)}
                          </TableCell>
                          <TableCell>{formatDate(customer.lastServiceDate)}</TableCell>
                          <TableCell>
                            <StatusBadge tone={statusTone(customer.status)}>
                              {customerStatusLabel(customer.status)}
                            </StatusBadge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="grid gap-3 md:hidden">
                  {customers.map((customer) => (
                    <Link
                      key={customer.id}
                      href={`/customers/${customer.id}`}
                      className="rounded-lg border p-4 transition hover:bg-muted/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{customer.displayName}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {customerTypeLabel(customer.type)}
                          </p>
                        </div>
                        <StatusBadge tone={statusTone(customer.status)}>
                          {customerStatusLabel(customer.status)}
                        </StatusBadge>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {customer.mainLocation || "No location"}
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <span>{formatPhone(customer.phone)}</span>
                        <span className="text-right font-medium">
                          {formatMoney(customer.outstandingBalance, currency)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                <div className="mb-4 grid size-12 place-items-center rounded-md border bg-muted">
                  <UsersRound className="size-5 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold">No customers found</h2>
                <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                  Try a different search or create the first customer for this organization.
                </p>
                <Button className="mt-5" asChild>
                  <Link href="/customers/new">Add customer</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}

async function loadCustomers(
  organizationId: string,
  filters: CustomerFilters,
): Promise<CustomerListRow[]> {
  try {
    const where: Prisma.CustomerWhereInput = {
      organizationId,
    };

    if (filters.q?.trim()) {
      const q = filters.q.trim();
      where.OR = [
        { displayName: { contains: q, mode: "insensitive" } },
        { primaryName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        {
          locations: {
            some: {
              OR: [
                { addressLine1: { contains: q, mode: "insensitive" } },
                { city: { contains: q, mode: "insensitive" } },
                { parish: { contains: q, mode: "insensitive" } },
              ],
            },
          },
        },
      ];
    }

    if (filters.type && filters.type !== "all") {
      where.type = filters.type as CustomerType;
    }

    if (filters.status && filters.status !== "all") {
      where.status = filters.status as CustomerStatus;
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { displayName: "asc" },
      include: {
        locations: { orderBy: { createdAt: "asc" }, take: 1 },
        invoices: { select: { balanceDue: true } },
        workOrders: {
          orderBy: [{ completedAt: "desc" }, { requestedAt: "desc" }],
          take: 1,
          select: { completedAt: true, requestedAt: true },
        },
        _count: { select: { workOrders: true } },
      },
    });

    return customers.map((customer) => {
      const mainLocation = customer.locations[0];
      const lastWorkOrder = customer.workOrders[0];

      return {
        id: customer.id,
        displayName: customer.displayName,
        type: customer.type,
        status: customer.status,
        primaryName: customer.primaryName,
        phone: customer.phone,
        email: customer.email,
        mainLocation: compactAddress(mainLocation),
        jobsCount: customer._count.workOrders,
        outstandingBalance: customer.invoices.reduce(
          (total, invoice) => total + Number(invoice.balanceDue.toString()),
          0,
        ),
        lastServiceDate: lastWorkOrder?.completedAt ?? lastWorkOrder?.requestedAt,
      };
    });
  } catch {
    return filterDemoCustomers(filters);
  }
}
