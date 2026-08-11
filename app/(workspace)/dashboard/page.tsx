import Link from "next/link";
import {
  CalendarClock,
  FilePlus2,
  Plus,
  UserPlus,
  UserCog,
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
import {
  dashboardMetrics,
  jobBoard,
  recentCustomers,
  upcomingSchedule,
} from "@/lib/service-os/demo-data";
import { requireTenantContext } from "@/lib/tenant/guard";

export default async function DashboardPage() {
  const { session } = await requireTenantContext();
  const template = session.industryTemplate;

  return (
    <>
      <PageHeader
        eyebrow="Operations dashboard"
        title="Service command center"
        badge={template.name}
        description="Foundation workspace for tenant-scoped jobs, customers, schedules, quotes, invoices, inventory, assets, technicians, reports, and settings."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/customers">
                <UserPlus className="size-4" />
                Customer
              </Link>
            </Button>
            <Button asChild>
              <Link href="/jobs">
                <Plus className="size-4" />
                Job
              </Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-3">
                <p className="text-3xl font-semibold tracking-normal">
                  {metric.value}
                </p>
                <Badge variant="outline">{metric.trend}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {metric.helper}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Job board</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Configurable workflow labels from the selected industry template.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/jobs">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 lg:grid-cols-4">
              {jobBoard.map((column) => (
                <div
                  key={column.status}
                  className="min-h-[220px] rounded-lg border bg-muted/35 p-3"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`size-2.5 rounded-full ${column.color}`}
                        aria-hidden="true"
                      />
                      <h2 className="text-sm font-semibold">{column.status}</h2>
                    </div>
                    <Badge variant="secondary">{column.jobs.length}</Badge>
                  </div>
                  <div className="grid gap-2">
                    {column.jobs.map((job) => (
                      <article
                        key={job.id}
                        className="rounded-md border bg-card p-3 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium">{job.title}</p>
                          <StatusBadge
                            tone={
                              job.priority === "Urgent"
                                ? "red"
                                : job.priority === "High"
                                  ? "amber"
                                  : "neutral"
                            }
                          >
                            {job.priority}
                          </StatusBadge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {job.customer}
                        </p>
                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-mono">{job.id}</span>
                          <span>{job.window}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s schedule</CardTitle>
            <p className="text-sm text-muted-foreground">
              Dispatch view for technician assignments and promised windows.
            </p>
          </CardHeader>
          <CardContent className="grid gap-3">
            {upcomingSchedule.map((item) => (
              <div
                key={`${item.time}-${item.job}`}
                className="grid grid-cols-[56px_minmax(0,1fr)] gap-3 rounded-md border p-3"
              >
                <div className="font-mono text-sm font-semibold">
                  {item.time}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{item.technician}</p>
                    <Badge variant="outline">{item.type}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.job} - {item.area}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(360px,0.8fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Industry template</CardTitle>
            <p className="text-sm text-muted-foreground">
              The tenant starts from a template, then customizes fields and labels.
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="services">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="assets">Assets</TabsTrigger>
                <TabsTrigger value="workflow">Workflow</TabsTrigger>
              </TabsList>
              <TabsContent value="services" className="mt-4 grid gap-2">
                {template.serviceCategories.map((category) => (
                  <div
                    key={category}
                    className="rounded-md border px-3 py-2 text-sm"
                  >
                    {category}
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="assets" className="mt-4 grid gap-2">
                {template.assetTypes.map((asset) => (
                  <div key={asset.name} className="rounded-md border p-3">
                    <p className="font-medium">{asset.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {asset.fields.join(", ")}
                    </p>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="workflow" className="mt-4 grid gap-2">
                {template.jobTypes.map((jobType) => (
                  <div key={jobType} className="rounded-md border p-3">
                    <p className="font-medium">{jobType}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Configured by the selected industry template
                    </p>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Recent customers</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Customer records will connect jobs, assets, quotes, invoices, inventory usage, and reports.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/customers">Open CRM</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Assets</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCustomers.map((customer) => (
                  <TableRow key={customer.name}>
                    <TableCell>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {customer.type}
                      </div>
                    </TableCell>
                    <TableCell>{customer.location}</TableCell>
                    <TableCell>{customer.assets}</TableCell>
                    <TableCell className="text-right font-medium">
                      {customer.balance}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <Button variant="outline" className="h-auto justify-start p-4" asChild>
          <Link href="/schedule">
            <CalendarClock className="size-5" />
            <span className="ml-2 text-left">
              <span className="block font-medium">Plan dispatch</span>
              <span className="block text-xs text-muted-foreground">
                Assign techs and service windows
              </span>
            </span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto justify-start p-4" asChild>
          <Link href="/quotes">
            <FilePlus2 className="size-5" />
            <span className="ml-2 text-left">
              <span className="block font-medium">Create quote</span>
              <span className="block text-xs text-muted-foreground">
                Pull from price book defaults
              </span>
            </span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto justify-start p-4" asChild>
          <Link href="/technicians">
            <UserCog className="size-5" />
            <span className="ml-2 text-left">
              <span className="block font-medium">Manage technicians</span>
              <span className="block text-xs text-muted-foreground">
                Keep field access role-based
              </span>
            </span>
          </Link>
        </Button>
      </section>
    </>
  );
}
