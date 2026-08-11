"use server";

import { revalidatePath } from "next/cache";
import type { ConfigFieldType, WorkOrderLifecycle } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { slugify, templateKeyToPrismaKey } from "@/lib/service-os/industry-templates";
import { copyIndustryTemplateToOrganization } from "@/lib/service-os/template-copy";
import { requireCompanyAdmin } from "@/lib/tenant/guard";

const fieldTypes = new Set([
  "TEXT",
  "NUMBER",
  "DATE",
  "BOOLEAN",
  "SELECT",
  "MULTI_SELECT",
]);

const lifecycleValues = new Set([
  "REQUESTED",
  "SCHEDULED",
  "IN_PROGRESS",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
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

function lines(raw: string) {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function bool(raw?: string) {
  return raw === "true" || raw === "yes" || raw === "1" || raw === "required";
}

export async function applyCompanyIndustryTemplate(formData: FormData) {
  const context = await requireCompanyAdmin();
  const selectedTemplate = requiredValue(formData, "industryTemplate");
  const prismaKey = templateKeyToPrismaKey(selectedTemplate);

  const template = await prisma.industryTemplate.findUniqueOrThrow({
    where: { key: prismaKey },
    select: { id: true },
  });

  await copyIndustryTemplateToOrganization({
    organizationId: context.organizationId,
    industryTemplateId: template.id,
  });

  revalidatePath("/settings");
}

export async function saveCompanyTemplateCopy(formData: FormData) {
  const context = await requireCompanyAdmin();

  await prisma.$transaction(async (tx) => {
    await tx.companyAssetField.deleteMany({
      where: { organizationId: context.organizationId },
    });
    await tx.companyAssetType.deleteMany({
      where: { organizationId: context.organizationId },
    });
    await tx.companyServiceCategory.deleteMany({
      where: { organizationId: context.organizationId },
    });
    await tx.companyJobType.deleteMany({
      where: { organizationId: context.organizationId },
    });
    await tx.companyJobStatus.deleteMany({
      where: { organizationId: context.organizationId },
    });
    await tx.companyPriorityLabel.deleteMany({
      where: { organizationId: context.organizationId },
    });

    for (const [sortOrder, name] of lines(value(formData, "serviceCategories")).entries()) {
      await tx.companyServiceCategory.create({
        data: {
          organizationId: context.organizationId,
          name,
          slug: slugify(name),
          sortOrder,
        },
      });
    }

    for (const [sortOrder, name] of lines(value(formData, "assetTypes")).entries()) {
      await tx.companyAssetType.create({
        data: {
          organizationId: context.organizationId,
          name,
          slug: slugify(name),
          sortOrder,
        },
      });
    }

    for (const [sortOrder, line] of lines(value(formData, "assetFields")).entries()) {
      const [name = "", typeRaw = "TEXT", requiredRaw = "", optionsRaw = ""] = line.split("|").map((part) => part.trim());
      const options = lines(optionsRaw.replaceAll(",", "\n"));

      await tx.companyAssetField.create({
        data: {
          organizationId: context.organizationId,
          name,
          slug: slugify(name),
          type: (fieldTypes.has(typeRaw) ? typeRaw : "TEXT") as ConfigFieldType,
          required: bool(requiredRaw),
          options: options.length ? { values: options } : undefined,
          sortOrder,
        },
      });
    }

    for (const [sortOrder, name] of lines(value(formData, "jobTypes")).entries()) {
      await tx.companyJobType.create({
        data: {
          organizationId: context.organizationId,
          name,
          slug: slugify(name),
          sortOrder,
        },
      });
    }

    for (const [sortOrder, line] of lines(value(formData, "jobStatuses")).entries()) {
      const [name = "", lifecycleRaw = "REQUESTED", color = "", defaultRaw = "", terminalRaw = ""] = line
        .split("|")
        .map((part) => part.trim());

      await tx.companyJobStatus.create({
        data: {
          organizationId: context.organizationId,
          name,
          slug: slugify(name),
          lifecycle: (lifecycleValues.has(lifecycleRaw) ? lifecycleRaw : "REQUESTED") as WorkOrderLifecycle,
          color: color || null,
          isDefault: bool(defaultRaw),
          isTerminal: bool(terminalRaw),
          sortOrder,
        },
      });
    }

    for (const [sortOrder, line] of lines(value(formData, "priorityLabels")).entries()) {
      const [name = "", levelRaw = "0", color = "", description = ""] = line.split("|").map((part) => part.trim());
      const level = Number(levelRaw);

      await tx.companyPriorityLabel.create({
        data: {
          organizationId: context.organizationId,
          name,
          slug: slugify(name),
          color: color || null,
          level: Number.isFinite(level) ? level : 0,
          description: description || null,
          sortOrder,
        },
      });
    }

    await tx.activityLog.create({
      data: {
        organizationId: context.organizationId,
        entityType: "ORGANIZATION",
        entityId: context.organizationId,
        action: "company_template_copy.updated",
        message: "Company-owned industry workflow defaults were updated.",
      },
    });
  });

  revalidatePath("/settings");
}
