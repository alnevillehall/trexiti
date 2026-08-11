import Link from "next/link";
import { ArrowRight, LockKeyhole, Plus, Settings2 } from "lucide-react";

import { createIndustryTemplate } from "@/app/(workspace)/industry-templates/actions";
import { PageHeader } from "@/components/page-header";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { prisma } from "@/lib/prisma";
import { industryTemplates, templateCounts } from "@/lib/service-os/industry-templates";
import {
  dbTemplateToConfig,
  templateAdminInclude,
} from "@/lib/service-os/template-admin-views";
import { requireTenantContext } from "@/lib/tenant/guard";

export const dynamic = "force-dynamic";

export default async function IndustryTemplatesPage() {
  const { session } = await requireTenantContext();
  const canEdit = session.roleKey === "PLATFORM_OWNER";
  const templates = await loadTemplates();

  return (
    <>
      <PageHeader
        eyebrow="Platform administration"
        title="Industry templates"
        description="Global reusable industry defaults for service categories, asset fields, workflows, quote items, invoice terms, inventory categories, symptoms, priorities, and SLA targets."
        actions={
          <Button asChild>
            <Link href="/industry-templates/appliance-hvac">
              <Settings2 className="size-4" />
              Manage templates
            </Link>
          </Button>
        }
      />

      {!canEdit ? (
        <div className="mb-5 flex items-start gap-3 rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
          <LockKeyhole className="mt-0.5 size-4 shrink-0" />
          <p>
            You can review the template library from this demo session. Create
            and edit actions are restricted to the PLATFORM_OWNER role.
          </p>
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        {templates.map((template) => {
          const counts = templateCounts(template);

          return (
            <Card key={template.key}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{template.name}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Version {template.version}
                    </p>
                  </div>
                  <Badge variant="outline">{counts.serviceCategories} services</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="min-h-16 text-sm leading-6 text-muted-foreground">
                  {template.description}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <Metric label="Asset types" value={counts.assetTypes} />
                  <Metric label="Fields" value={counts.assetFields} />
                  <Metric label="Statuses" value={counts.jobStatuses} />
                  <Metric label="SLA rules" value={counts.slaResponseTimes} />
                </div>
                <Button className="mt-4 w-full" variant="outline" asChild>
                  <Link href={`/industry-templates/${template.key}`}>
                    Edit template
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Configuration coverage</CardTitle>
            <p className="text-sm text-muted-foreground">
              Each template is a full configuration bundle, not a separate app.
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead>Job types</TableHead>
                  <TableHead>Assets</TableHead>
                  <TableHead>Checklists</TableHead>
                  <TableHead>Quote items</TableHead>
                  <TableHead>SLA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => {
                  const counts = templateCounts(template);

                  return (
                    <TableRow key={template.key}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>{counts.serviceCategories}</TableCell>
                      <TableCell>{counts.jobTypes}</TableCell>
                      <TableCell>{counts.assetTypes}</TableCell>
                      <TableCell>{counts.checklists}</TableCell>
                      <TableCell>{counts.quoteLineItems}</TableCell>
                      <TableCell>{counts.slaResponseTimes}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="mb-2 grid size-10 place-items-center rounded-md border bg-muted">
              <Plus className="size-4 text-muted-foreground" />
            </div>
            <CardTitle>Create template</CardTitle>
            <p className="text-sm text-muted-foreground">
              New templates use a string key so Trexiti can add industries without duplicating the app.
            </p>
          </CardHeader>
          <CardContent>
            <form action={createIndustryTemplate} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="key">Template key</Label>
                <Input
                  id="key"
                  name="key"
                  placeholder="SOLAR_INSTALLATION"
                  disabled={!canEdit}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Solar installation"
                  disabled={!canEdit}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Reusable defaults for..."
                  disabled={!canEdit}
                  rows={4}
                />
              </div>
              <Button type="submit" disabled={!canEdit}>
                Create template
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-muted/25 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

async function loadTemplates() {
  try {
    const templates = await prisma.industryTemplate.findMany({
      orderBy: [{ active: "desc" }, { name: "asc" }],
      include: templateAdminInclude,
    });

    if (templates.length) {
      return templates.map(dbTemplateToConfig);
    }
  } catch {
    return industryTemplates;
  }

  return industryTemplates;
}
