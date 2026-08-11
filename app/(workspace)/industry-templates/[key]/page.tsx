import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";

import { saveIndustryTemplate } from "@/app/(workspace)/industry-templates/actions";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { prisma } from "@/lib/prisma";
import {
  industryTemplates,
  type IndustryTemplateConfig,
} from "@/lib/service-os/industry-templates";
import {
  dbTemplateToConfig,
  routeKeyToTemplateKey,
  templateAdminInclude,
} from "@/lib/service-os/template-admin-views";
import { requireTenantContext } from "@/lib/tenant/guard";

type PageProps = {
  params: Promise<{
    key: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function IndustryTemplateDetailPage({ params }: PageProps) {
  const { key } = await params;
  const { session } = await requireTenantContext();
  const canEdit = session.roleKey === "PLATFORM_OWNER";
  const template = await loadTemplate(key);

  if (!template) {
    notFound();
  }

  return (
    <>
      <PageHeader
        eyebrow="Template editor"
        title={template.name}
        badge={`Version ${template.version}`}
        description={template.description}
        actions={
          <Button variant="outline" asChild>
            <Link href="/industry-templates">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
        }
      />

      <form action={saveIndustryTemplate} className="grid gap-6">
        <input type="hidden" name="key" value={template.prismaKey} />

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Template profile</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Global defaults copied into tenant-owned settings at selection time.
                </p>
              </div>
              <Badge variant={canEdit ? "default" : "secondary"}>
                {canEdit ? "Platform owner" : "Read only"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_120px_140px]">
              <div className="grid gap-2">
                <Label htmlFor="name">Template name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={template.name}
                  disabled={!canEdit}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  name="version"
                  type="number"
                  min="1"
                  defaultValue={template.version}
                  disabled={!canEdit}
                  required
                />
              </div>
              <label className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
                <Checkbox name="active" defaultChecked disabled={!canEdit} />
                <span>Active</span>
              </label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={template.description}
                disabled={!canEdit}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="core">
          <TabsList className="grid w-full grid-cols-3 sm:w-fit">
            <TabsTrigger value="core">Core</TabsTrigger>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
            <TabsTrigger value="commercial">Commercial</TabsTrigger>
          </TabsList>

          <TabsContent value="core" className="mt-4 grid gap-6 lg:grid-cols-2">
            <TemplateTextarea
              label="Service categories"
              name="serviceCategories"
              value={template.serviceCategories.join("\n")}
              rows={12}
              disabled={!canEdit}
            />
            <TemplateTextarea
              label="Asset types"
              name="assetTypes"
              value={template.assetTypes.map((asset) => asset.name).join("\n")}
              rows={12}
              disabled={!canEdit}
            />
            <TemplateTextarea
              label="Asset custom fields"
              name="assetFields"
              value={assetFieldsValue(template)}
              rows={12}
              disabled={!canEdit}
            />
            <TemplateTextarea
              label="Common issue symptoms"
              name="issueSymptoms"
              value={issueSymptomsValue(template)}
              rows={12}
              disabled={!canEdit}
            />
          </TabsContent>

          <TabsContent value="workflow" className="mt-4 grid gap-6 lg:grid-cols-2">
            <WorkflowLabels template={template} disabled={!canEdit} />
            <TemplateTextarea
              label="Common job types"
              name="jobTypes"
              value={jobTypesValue(template)}
              rows={9}
              disabled={!canEdit}
            />
            <TemplateTextarea
              label="Technician checklist templates"
              name="checklists"
              value={checklistsValue(template)}
              rows={9}
              disabled={!canEdit}
            />
            <TemplateTextarea
              label="Default job statuses"
              name="jobStatuses"
              value={jobStatusesValue(template)}
              rows={9}
              disabled={!canEdit}
            />
            <TemplateTextarea
              label="Priority labels"
              name="priorityLabels"
              value={priorityLabelsValue(template)}
              rows={8}
              disabled={!canEdit}
            />
            <TemplateTextarea
              label="SLA response times"
              name="slaResponseTimes"
              value={slaValue(template)}
              rows={8}
              disabled={!canEdit}
            />
          </TabsContent>

          <TabsContent value="commercial" className="mt-4 grid gap-6 lg:grid-cols-2">
            <InvoiceDefaults template={template} disabled={!canEdit} />
            <TemplateTextarea
              label="Default quote line items"
              name="quoteLineItems"
              value={quoteItemsValue(template)}
              rows={9}
              disabled={!canEdit}
            />
            <TemplateTextarea
              label="Default invoice terms"
              name="invoiceTerms"
              value={invoiceTermsValue(template)}
              rows={7}
              disabled={!canEdit}
            />
            <TemplateTextarea
              label="Recommended inventory categories"
              name="inventoryCategories"
              value={inventoryCategoriesValue(template)}
              rows={7}
              disabled={!canEdit}
            />
          </TabsContent>
        </Tabs>

        <div className="sticky bottom-0 z-20 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="mx-auto flex max-w-[1600px] justify-end">
            <Button type="submit" disabled={!canEdit}>
              <Save className="size-4" />
              Save template
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}

function TemplateTextarea({
  label,
  name,
  value,
  rows,
  disabled,
}: {
  label: string;
  name: string;
  value: string;
  rows: number;
  disabled: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          name={name}
          defaultValue={value}
          rows={rows}
          disabled={disabled}
          className="font-mono text-xs leading-5"
        />
      </CardContent>
    </Card>
  );
}

function WorkflowLabels({
  template,
  disabled,
}: {
  template: IndustryTemplateConfig;
  disabled: boolean;
}) {
  const labels = [
    ["workflowRequest", "Request", template.workflowLabels.request],
    ["workflowScheduled", "Scheduled", template.workflowLabels.scheduled],
    ["workflowInProgress", "In progress", template.workflowLabels.inProgress],
    ["workflowReview", "Review", template.workflowLabels.review],
    ["workflowComplete", "Complete", template.workflowLabels.complete],
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow labels</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {labels.map(([name, label, defaultValue]) => (
          <div key={name} className="grid gap-2">
            <Label htmlFor={name}>{label}</Label>
            <Input
              id={name}
              name={name}
              defaultValue={defaultValue}
              disabled={disabled}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function InvoiceDefaults({
  template,
  disabled,
}: {
  template: IndustryTemplateConfig;
  disabled: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice defaults</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid gap-2">
          <Label htmlFor="taxLabel">Tax label</Label>
          <Input
            id="taxLabel"
            name="taxLabel"
            defaultValue={template.invoiceDefaults.taxLabel}
            disabled={disabled}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="paymentTerms">Payment terms</Label>
          <Textarea
            id="paymentTerms"
            name="paymentTerms"
            defaultValue={template.invoiceDefaults.paymentTerms}
            disabled={disabled}
            rows={3}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="warrantyNote">Warranty note</Label>
          <Textarea
            id="warrantyNote"
            name="warrantyNote"
            defaultValue={template.invoiceDefaults.warrantyNote}
            disabled={disabled}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function assetFieldsValue(template: IndustryTemplateConfig) {
  return template.assetFields
    .map((field) =>
      [
        field.name,
        field.type,
        field.required ? "required" : "",
        field.options?.join(", ") ?? "",
      ].join("|"),
    )
    .join("\n");
}

function jobTypesValue(template: IndustryTemplateConfig) {
  return template.jobTypeDefaults
    .map((jobType) =>
      [jobType.name, jobType.defaultDurationMin, jobType.description].join("|"),
    )
    .join("\n");
}

function checklistsValue(template: IndustryTemplateConfig) {
  return template.technicianChecklists
    .map((checklist) =>
      [
        checklist.name,
        checklist.jobTypeSlug ?? "",
        checklist.items.map((item) => item.label).join("; "),
      ].join("|"),
    )
    .join("\n");
}

function jobStatusesValue(template: IndustryTemplateConfig) {
  return template.jobStatuses
    .map((status) =>
      [
        status.name,
        status.lifecycle,
        status.color,
        status.isDefault ? "true" : "",
        status.isTerminal ? "true" : "",
      ].join("|"),
    )
    .join("\n");
}

function quoteItemsValue(template: IndustryTemplateConfig) {
  return template.quoteLineItems
    .map((item) =>
      [item.name, item.description, item.defaultUnitPrice ?? ""].join("|"),
    )
    .join("\n");
}

function invoiceTermsValue(template: IndustryTemplateConfig) {
  return template.invoiceTerms
    .map((term) => [term.name, term.dueDays, term.terms].join("|"))
    .join("\n");
}

function inventoryCategoriesValue(template: IndustryTemplateConfig) {
  return template.inventoryCategories
    .map((category) => [category.name, category.description].join("|"))
    .join("\n");
}

function issueSymptomsValue(template: IndustryTemplateConfig) {
  return template.issueSymptoms
    .map((symptom) =>
      [
        symptom.name,
        symptom.serviceCategorySlug ?? "",
        symptom.priorityHint,
      ].join("|"),
    )
    .join("\n");
}

function priorityLabelsValue(template: IndustryTemplateConfig) {
  return template.priorityLabels
    .map((priority) =>
      [priority.name, priority.level, priority.color, priority.description].join("|"),
    )
    .join("\n");
}

function slaValue(template: IndustryTemplateConfig) {
  return template.slaResponseTimes
    .map((sla) =>
      [
        sla.name,
        sla.prioritySlug,
        sla.responseMinutes,
        sla.resolutionMinutes,
      ].join("|"),
    )
    .join("\n");
}

async function loadTemplate(routeKey: string) {
  const staticTemplate = industryTemplates.find((template) => template.key === routeKey);

  try {
    const template = await prisma.industryTemplate.findFirst({
      where: {
        OR: [
          { key: routeKeyToTemplateKey(routeKey) },
          { key: routeKey },
          ...(staticTemplate ? [{ key: staticTemplate.prismaKey }] : []),
        ],
      },
      include: templateAdminInclude,
    });

    if (template) {
      return dbTemplateToConfig(template);
    }
  } catch {
    return staticTemplate ?? null;
  }

  return staticTemplate ?? null;
}
