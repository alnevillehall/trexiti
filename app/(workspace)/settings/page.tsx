import { Copy, Save, Settings2 } from "lucide-react";

import {
  applyCompanyIndustryTemplate,
  saveCompanyTemplateCopy,
} from "@/app/(workspace)/settings/actions";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  industryTemplates,
  type IndustryTemplateConfig,
} from "@/lib/service-os/industry-templates";
import { requireCompanyAdmin } from "@/lib/tenant/guard";

export default async function SettingsPage() {
  const { session } = await requireCompanyAdmin();
  const template = session.industryTemplate;

  return (
    <>
      <PageHeader
        eyebrow="Company settings"
        title="Industry workflow"
        badge={template.name}
        description="Company-owned workflow defaults are copied from global templates, then customized inside this tenant."
      />

      <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <div className="mb-2 grid size-10 place-items-center rounded-md border bg-muted">
              <Copy className="size-4 text-muted-foreground" />
            </div>
            <CardTitle>Template source</CardTitle>
            <p className="text-sm text-muted-foreground">
              Applying a template refreshes this company&apos;s copy. The global template is unchanged.
            </p>
          </CardHeader>
          <CardContent>
            <form action={applyCompanyIndustryTemplate} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="industryTemplate">Industry template</Label>
                <Select name="industryTemplate" defaultValue={template.key}>
                  <SelectTrigger id="industryTemplate" className="w-full">
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {industryTemplates.map((industryTemplate) => (
                      <SelectItem key={industryTemplate.key} value={industryTemplate.key}>
                        {industryTemplate.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit">
                <Settings2 className="size-4" />
                Apply template copy
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Company copy</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  These edits belong to {session.organization.name}.
                </p>
              </div>
              <Badge variant="outline">{session.role}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <form action={saveCompanyTemplateCopy} className="grid gap-5">
              <Tabs defaultValue="services">
                <TabsList className="grid w-full grid-cols-3 sm:w-fit">
                  <TabsTrigger value="services">Services</TabsTrigger>
                  <TabsTrigger value="assets">Assets</TabsTrigger>
                  <TabsTrigger value="workflow">Workflow</TabsTrigger>
                </TabsList>

                <TabsContent value="services" className="mt-4 grid gap-4 lg:grid-cols-2">
                  <SettingsTextarea
                    label="Service categories"
                    name="serviceCategories"
                    value={template.serviceCategories.join("\n")}
                    rows={12}
                  />
                  <SettingsTextarea
                    label="Common job types"
                    name="jobTypes"
                    value={template.jobTypes.join("\n")}
                    rows={12}
                  />
                </TabsContent>

                <TabsContent value="assets" className="mt-4 grid gap-4 lg:grid-cols-2">
                  <SettingsTextarea
                    label="Asset types"
                    name="assetTypes"
                    value={template.assetTypes.map((asset) => asset.name).join("\n")}
                    rows={12}
                  />
                  <SettingsTextarea
                    label="Asset custom fields"
                    name="assetFields"
                    value={assetFieldsValue(template)}
                    rows={12}
                  />
                </TabsContent>

                <TabsContent value="workflow" className="mt-4 grid gap-4 lg:grid-cols-2">
                  <SettingsTextarea
                    label="Job statuses"
                    name="jobStatuses"
                    value={jobStatusesValue(template)}
                    rows={9}
                  />
                  <SettingsTextarea
                    label="Priority labels"
                    name="priorityLabels"
                    value={priorityLabelsValue(template)}
                    rows={9}
                  />
                </TabsContent>
              </Tabs>

              <div className="flex justify-end">
                <Button type="submit">
                  <Save className="size-4" />
                  Save company copy
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function SettingsTextarea({
  label,
  name,
  value,
  rows,
}: {
  label: string;
  name: string;
  value: string;
  rows: number;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea
        id={name}
        name={name}
        defaultValue={value}
        rows={rows}
        className="font-mono text-xs leading-5"
      />
    </div>
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

function priorityLabelsValue(template: IndustryTemplateConfig) {
  return template.priorityLabels
    .map((priority) =>
      [priority.name, priority.level, priority.color, priority.description].join("|"),
    )
    .join("\n");
}
