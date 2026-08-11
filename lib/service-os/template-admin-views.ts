import type { Prisma } from "@prisma/client";

import type {
  ChecklistItemType,
  ConfigFieldType,
  IndustryTemplateConfig,
  WorkOrderLifecycle,
} from "@/lib/service-os/industry-templates";

export const templateAdminInclude = {
  templateServiceCategories: { orderBy: { sortOrder: "asc" } },
  templateJobTypes: { orderBy: { sortOrder: "asc" } },
  templateAssetTypes: { orderBy: { sortOrder: "asc" } },
  templateAssetFields: { orderBy: { sortOrder: "asc" } },
  templateChecklistTemplates: {
    orderBy: { sortOrder: "asc" },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  },
  templateJobStatuses: { orderBy: { sortOrder: "asc" } },
  templateQuoteLineItems: { orderBy: { sortOrder: "asc" } },
  templateInvoiceTerms: { orderBy: { sortOrder: "asc" } },
  templateInventoryCategories: { orderBy: { sortOrder: "asc" } },
  templateIssueSymptoms: { orderBy: { sortOrder: "asc" } },
  templatePriorityLabels: { orderBy: { sortOrder: "asc" } },
  templateSlaResponseTimes: { orderBy: { sortOrder: "asc" } },
} satisfies Prisma.IndustryTemplateInclude;

export type AdminIndustryTemplate = Prisma.IndustryTemplateGetPayload<{
  include: typeof templateAdminInclude;
}>;

export function templateKeyToRouteKey(key: string) {
  return key.toLowerCase().replace(/_/g, "-");
}

export function routeKeyToTemplateKey(routeKey: string) {
  return routeKey.toUpperCase().replace(/-/g, "_");
}

export function dbTemplateToConfig(template: AdminIndustryTemplate): IndustryTemplateConfig {
  const invoiceDefaults = recordValue(template.invoiceDefaults);
  const workflowLabels = recordValue(template.workflowLabels);
  const assetFieldNames = template.templateAssetFields.map((field) => field.name);

  return {
    key: templateKeyToRouteKey(template.key),
    prismaKey: template.key,
    name: template.name,
    description: template.description ?? "",
    version: template.version,
    serviceCategories: template.templateServiceCategories.map((category) => category.name),
    assetTypes: template.templateAssetTypes.map((assetType) => ({
      name: assetType.name,
      slug: assetType.slug,
      fields: assetFieldNames,
    })),
    assetFields: template.templateAssetFields.map((field) => ({
      name: field.name,
      slug: field.slug,
      type: field.type as ConfigFieldType,
      required: field.required,
      options: arrayFromOptions(field.options),
    })),
    jobTypes: template.templateJobTypes.map((jobType) => jobType.name),
    jobTypeDefaults: template.templateJobTypes.map((jobType) => ({
      name: jobType.name,
      slug: jobType.slug,
      description: jobType.description ?? "",
      defaultDurationMin: jobType.defaultDurationMin ?? 0,
    })),
    technicianChecklists: template.templateChecklistTemplates.map((checklist) => ({
      name: checklist.name,
      slug: checklist.slug,
      jobTypeSlug: checklist.jobTypeSlug ?? undefined,
      description: checklist.description ?? "",
      items: checklist.items.map((item) => ({
        label: item.label,
        type: item.type as ChecklistItemType,
        required: item.required,
      })),
    })),
    jobStatuses: template.templateJobStatuses.map((status) => ({
      name: status.name,
      slug: status.slug,
      lifecycle: status.lifecycle as WorkOrderLifecycle,
      color: status.color ?? "#64748b",
      isDefault: status.isDefault,
      isTerminal: status.isTerminal,
    })),
    quoteItems: template.templateQuoteLineItems.map((item) => item.name),
    quoteLineItems: template.templateQuoteLineItems.map((item) => ({
      name: item.name,
      slug: item.slug,
      description: item.description ?? "",
      defaultUnitPrice: item.defaultUnitPrice?.toString(),
      taxable: item.taxable,
    })),
    invoiceTerms: template.templateInvoiceTerms.map((term) => ({
      name: term.name,
      slug: term.slug,
      terms: term.terms,
      dueDays: term.dueDays,
    })),
    invoiceDefaults: {
      taxLabel: stringValue(invoiceDefaults.taxLabel, "GCT"),
      paymentTerms: stringValue(invoiceDefaults.paymentTerms, ""),
      warrantyNote: stringValue(invoiceDefaults.warrantyNote, ""),
    },
    inventoryCategories: template.templateInventoryCategories.map((category) => ({
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
    })),
    issueSymptoms: template.templateIssueSymptoms.map((symptom) => ({
      name: symptom.name,
      slug: symptom.slug,
      serviceCategorySlug: symptom.serviceCategorySlug ?? undefined,
      priorityHint: symptom.priorityHint ?? "normal",
    })),
    priorityLabels: template.templatePriorityLabels.map((priority) => ({
      name: priority.name,
      slug: priority.slug,
      color: priority.color ?? "#64748b",
      level: priority.level,
      description: priority.description ?? "",
    })),
    slaResponseTimes: template.templateSlaResponseTimes.map((sla) => ({
      name: sla.name,
      slug: sla.slug,
      prioritySlug: sla.prioritySlug,
      responseMinutes: sla.responseMinutes,
      resolutionMinutes: sla.resolutionMinutes ?? 0,
    })),
    workflowLabels: {
      request: stringValue(workflowLabels.request, "Request intake"),
      scheduled: stringValue(workflowLabels.scheduled, "Scheduled"),
      inProgress: stringValue(workflowLabels.inProgress, "In progress"),
      review: stringValue(workflowLabels.review, "Needs review"),
      complete: stringValue(workflowLabels.complete, "Complete"),
    },
  };
}

function recordValue(value: Prisma.JsonValue | null): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function arrayFromOptions(value: Prisma.JsonValue | null) {
  const record = recordValue(value);
  return Array.isArray(record.values)
    ? record.values.filter((item): item is string => typeof item === "string")
    : undefined;
}
