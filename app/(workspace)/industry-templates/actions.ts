"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ConfigFieldType, WorkOrderLifecycle } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/service-os/industry-templates";
import { requireTenantContext } from "@/lib/tenant/guard";

const lifecycleValues = new Set([
  "REQUESTED",
  "SCHEDULED",
  "IN_PROGRESS",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
]);

const fieldTypes = new Set([
  "TEXT",
  "NUMBER",
  "DATE",
  "BOOLEAN",
  "SELECT",
  "MULTI_SELECT",
]);

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

function requiredValue(formData: FormData, key: string) {
  const raw = value(formData, key);

  if (!raw) {
    throw new Error(`${key} is required.`);
  }

  return raw;
}

function normalizeTemplateKey(raw: string) {
  return raw
    .trim()
    .toUpperCase()
    .replace(/&/g, "AND")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/(^_|_$)+/g, "");
}

function toRouteKey(key: string) {
  return key.toLowerCase().replace(/_/g, "-");
}

function lines(raw: string) {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function bool(raw?: string) {
  return raw === "true" || raw === "yes" || raw === "1" || raw === "required";
}

function numberOrNull(raw?: string) {
  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function createIndustryTemplate(formData: FormData) {
  await requireTenantContext(["PLATFORM_OWNER"]);

  const key = normalizeTemplateKey(requiredValue(formData, "key"));
  const name = requiredValue(formData, "name");
  const description = value(formData, "description") || null;

  const template = await prisma.industryTemplate.create({
    data: {
      key,
      name,
      description,
      version: 1,
      active: true,
      workflowLabels: {
        request: "Request intake",
        scheduled: "Scheduled",
        inProgress: "In progress",
        review: "Needs review",
        complete: "Complete",
      },
      invoiceDefaults: {
        taxLabel: "GCT",
        paymentTerms: "Due on completion unless account terms are approved.",
      },
    },
  });

  revalidatePath("/industry-templates");
  redirect(`/industry-templates/${toRouteKey(template.key)}`);
}

export async function saveIndustryTemplate(formData: FormData) {
  await requireTenantContext(["PLATFORM_OWNER"]);

  const key = normalizeTemplateKey(requiredValue(formData, "key"));
  const name = requiredValue(formData, "name");
  const version = Number(requiredValue(formData, "version"));
  const description = value(formData, "description") || null;
  const active = formData.get("active") === "on";
  const taxLabel = value(formData, "taxLabel") || "GCT";
  const paymentTerms = value(formData, "paymentTerms");
  const warrantyNote = value(formData, "warrantyNote");

  const template = await prisma.industryTemplate.upsert({
    where: { key },
    update: {
      name,
      description,
      version: Number.isFinite(version) ? version : 1,
      active,
      workflowLabels: {
        request: value(formData, "workflowRequest") || "Request intake",
        scheduled: value(formData, "workflowScheduled") || "Scheduled",
        inProgress: value(formData, "workflowInProgress") || "In progress",
        review: value(formData, "workflowReview") || "Needs review",
        complete: value(formData, "workflowComplete") || "Complete",
      },
      assetFieldSchema: { fields: lines(value(formData, "assetFields")).map((line) => line.split("|")[0]?.trim()) },
      jobTypeDefaults: lines(value(formData, "jobTypes")).map((line) => line.split("|")[0]?.trim()),
      quoteItemDefaults: lines(value(formData, "quoteLineItems")).map((line) => line.split("|")[0]?.trim()),
      invoiceDefaults: { taxLabel, paymentTerms, warrantyNote },
    },
    create: {
      key,
      name,
      description,
      version: Number.isFinite(version) ? version : 1,
      active,
      workflowLabels: {
        request: value(formData, "workflowRequest") || "Request intake",
        scheduled: value(formData, "workflowScheduled") || "Scheduled",
        inProgress: value(formData, "workflowInProgress") || "In progress",
        review: value(formData, "workflowReview") || "Needs review",
        complete: value(formData, "workflowComplete") || "Complete",
      },
      assetFieldSchema: { fields: lines(value(formData, "assetFields")).map((line) => line.split("|")[0]?.trim()) },
      jobTypeDefaults: lines(value(formData, "jobTypes")).map((line) => line.split("|")[0]?.trim()),
      quoteItemDefaults: lines(value(formData, "quoteLineItems")).map((line) => line.split("|")[0]?.trim()),
      invoiceDefaults: { taxLabel, paymentTerms, warrantyNote },
    },
  });

  await replaceTemplateConfiguration(template.id, formData);

  revalidatePath("/industry-templates");
  revalidatePath(`/industry-templates/${toRouteKey(template.key)}`);
}

async function replaceTemplateConfiguration(templateId: string, formData: FormData) {
  const checklistTemplates = await prisma.industryTechnicianChecklistTemplate.findMany({
    where: { industryTemplateId: templateId },
    select: { id: true },
  });
  const checklistIds = checklistTemplates.map((item) => item.id);

  await prisma.$transaction(async (tx) => {
    await tx.industryTechnicianChecklistItem.deleteMany({
      where: { checklistTemplateId: { in: checklistIds } },
    });
    await tx.industryTechnicianChecklistTemplate.deleteMany({
      where: { industryTemplateId: templateId },
    });
    await tx.industryAssetField.deleteMany({ where: { industryTemplateId: templateId } });
    await tx.industryAssetType.deleteMany({ where: { industryTemplateId: templateId } });
    await tx.industryServiceCategory.deleteMany({ where: { industryTemplateId: templateId } });
    await tx.industryJobType.deleteMany({ where: { industryTemplateId: templateId } });
    await tx.industryJobStatus.deleteMany({ where: { industryTemplateId: templateId } });
    await tx.industryQuoteLineItem.deleteMany({ where: { industryTemplateId: templateId } });
    await tx.industryInvoiceTerm.deleteMany({ where: { industryTemplateId: templateId } });
    await tx.industryInventoryCategory.deleteMany({ where: { industryTemplateId: templateId } });
    await tx.industryIssueSymptom.deleteMany({ where: { industryTemplateId: templateId } });
    await tx.industryPriorityLabel.deleteMany({ where: { industryTemplateId: templateId } });
    await tx.industrySlaResponseTime.deleteMany({ where: { industryTemplateId: templateId } });

    for (const [sortOrder, name] of lines(value(formData, "serviceCategories")).entries()) {
      await tx.industryServiceCategory.create({
        data: { industryTemplateId: templateId, name, slug: slugify(name), sortOrder },
      });
    }

    for (const [sortOrder, name] of lines(value(formData, "assetTypes")).entries()) {
      await tx.industryAssetType.create({
        data: { industryTemplateId: templateId, name, slug: slugify(name), sortOrder },
      });
    }

    for (const [sortOrder, line] of lines(value(formData, "assetFields")).entries()) {
      const [name = "", typeRaw = "TEXT", requiredRaw = "", optionsRaw = ""] = line.split("|").map((part) => part.trim());
      const type = (fieldTypes.has(typeRaw) ? typeRaw : "TEXT") as ConfigFieldType;
      const options = lines(optionsRaw.replaceAll(",", "\n"));

      await tx.industryAssetField.create({
        data: {
          industryTemplateId: templateId,
          name,
          slug: slugify(name),
          type,
          required: bool(requiredRaw),
          options: options.length ? { values: options } : undefined,
          sortOrder,
        },
      });
    }

    for (const [sortOrder, line] of lines(value(formData, "jobTypes")).entries()) {
      const [name = "", durationRaw = "", description = ""] = line.split("|").map((part) => part.trim());
      await tx.industryJobType.create({
        data: {
          industryTemplateId: templateId,
          name,
          slug: slugify(name),
          description: description || null,
          defaultDurationMin: numberOrNull(durationRaw),
          sortOrder,
        },
      });
    }

    for (const [sortOrder, line] of lines(value(formData, "checklists")).entries()) {
      const [name = "", jobTypeSlug = "", itemRaw = ""] = line.split("|").map((part) => part.trim());
      const checklist = await tx.industryTechnicianChecklistTemplate.create({
        data: {
          industryTemplateId: templateId,
          name,
          slug: slugify(name),
          jobTypeSlug: jobTypeSlug || null,
          description: `${name} technician workflow.`,
          sortOrder,
        },
      });

      for (const [itemSortOrder, label] of itemRaw.split(";").map((item) => item.trim()).filter(Boolean).entries()) {
        await tx.industryTechnicianChecklistItem.create({
          data: {
            checklistTemplateId: checklist.id,
            label,
            type: label.toLowerCase().includes("photo")
              ? "PHOTO"
              : label.toLowerCase().includes("signature")
                ? "SIGNATURE"
                : "BOOLEAN",
            required: true,
            sortOrder: itemSortOrder,
          },
        });
      }
    }

    for (const [sortOrder, line] of lines(value(formData, "jobStatuses")).entries()) {
      const [name = "", lifecycleRaw = "REQUESTED", color = "", defaultRaw = "", terminalRaw = ""] = line
        .split("|")
        .map((part) => part.trim());
      const lifecycle = (lifecycleValues.has(lifecycleRaw) ? lifecycleRaw : "REQUESTED") as WorkOrderLifecycle;

      await tx.industryJobStatus.create({
        data: {
          industryTemplateId: templateId,
          name,
          slug: slugify(name),
          lifecycle,
          color: color || null,
          isDefault: bool(defaultRaw),
          isTerminal: bool(terminalRaw),
          sortOrder,
        },
      });
    }

    for (const [sortOrder, line] of lines(value(formData, "quoteLineItems")).entries()) {
      const [name = "", description = "", defaultUnitPrice = ""] = line.split("|").map((part) => part.trim());
      await tx.industryQuoteLineItem.create({
        data: {
          industryTemplateId: templateId,
          name,
          slug: slugify(name),
          description: description || null,
          defaultUnitPrice: defaultUnitPrice || undefined,
          taxable: true,
          sortOrder,
        },
      });
    }

    for (const [sortOrder, line] of lines(value(formData, "invoiceTerms")).entries()) {
      const [name = "", dueDaysRaw = "0", terms = ""] = line.split("|").map((part) => part.trim());
      await tx.industryInvoiceTerm.create({
        data: {
          industryTemplateId: templateId,
          name,
          slug: slugify(name),
          terms,
          dueDays: numberOrNull(dueDaysRaw) ?? 0,
          sortOrder,
        },
      });
    }

    for (const [sortOrder, line] of lines(value(formData, "inventoryCategories")).entries()) {
      const [name = "", description = ""] = line.split("|").map((part) => part.trim());
      await tx.industryInventoryCategory.create({
        data: {
          industryTemplateId: templateId,
          name,
          slug: slugify(name),
          description: description || null,
          sortOrder,
        },
      });
    }

    for (const [sortOrder, line] of lines(value(formData, "issueSymptoms")).entries()) {
      const [name = "", serviceCategorySlug = "", priorityHint = "normal"] = line.split("|").map((part) => part.trim());
      await tx.industryIssueSymptom.create({
        data: {
          industryTemplateId: templateId,
          name,
          slug: slugify(name),
          serviceCategorySlug: serviceCategorySlug || null,
          priorityHint,
          sortOrder,
        },
      });
    }

    for (const [sortOrder, line] of lines(value(formData, "priorityLabels")).entries()) {
      const [name = "", levelRaw = "0", color = "", description = ""] = line.split("|").map((part) => part.trim());
      await tx.industryPriorityLabel.create({
        data: {
          industryTemplateId: templateId,
          name,
          slug: slugify(name),
          color: color || null,
          level: numberOrNull(levelRaw) ?? 0,
          description: description || null,
          sortOrder,
        },
      });
    }

    for (const [sortOrder, line] of lines(value(formData, "slaResponseTimes")).entries()) {
      const [name = "", prioritySlug = "", responseRaw = "0", resolutionRaw = ""] = line.split("|").map((part) => part.trim());
      await tx.industrySlaResponseTime.create({
        data: {
          industryTemplateId: templateId,
          name,
          slug: slugify(name),
          prioritySlug,
          responseMinutes: numberOrNull(responseRaw) ?? 0,
          resolutionMinutes: numberOrNull(resolutionRaw),
          sortOrder,
        },
      });
    }
  });
}
