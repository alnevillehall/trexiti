"use server";

import { prisma } from "@/lib/prisma";

type CopyTemplateInput = {
  organizationId: string;
  industryTemplateId: string;
  actorId?: string;
};

export async function copyIndustryTemplateToOrganization({
  organizationId,
  industryTemplateId,
  actorId,
}: CopyTemplateInput) {
  const template = await prisma.industryTemplate.findUniqueOrThrow({
    where: { id: industryTemplateId },
    include: {
      templateServiceCategories: true,
      templateJobTypes: true,
      templateAssetTypes: { include: { fields: true } },
      templateAssetFields: { where: { assetTypeId: null } },
      templateChecklistTemplates: { include: { items: true } },
      templateJobStatuses: true,
      templateQuoteLineItems: true,
      templateInvoiceTerms: true,
      templateInventoryCategories: true,
      templateIssueSymptoms: true,
      templatePriorityLabels: true,
      templateSlaResponseTimes: true,
    },
  });

  const companyChecklists = await prisma.companyTechnicianChecklistTemplate.findMany({
    where: { organizationId },
    select: { id: true },
  });
  const companyChecklistIds = companyChecklists.map((checklist) => checklist.id);

  await prisma.$transaction(async (tx) => {
    await tx.companyTechnicianChecklistItem.deleteMany({
      where: { checklistTemplateId: { in: companyChecklistIds } },
    });
    await tx.companyTechnicianChecklistTemplate.deleteMany({ where: { organizationId } });
    await tx.companyAssetField.deleteMany({ where: { organizationId } });
    await tx.companyAssetType.deleteMany({ where: { organizationId } });
    await tx.companyServiceCategory.deleteMany({ where: { organizationId } });
    await tx.companyJobType.deleteMany({ where: { organizationId } });
    await tx.companyJobStatus.deleteMany({ where: { organizationId } });
    await tx.companyQuoteLineItem.deleteMany({ where: { organizationId } });
    await tx.companyInvoiceTerm.deleteMany({ where: { organizationId } });
    await tx.companyInventoryCategory.deleteMany({ where: { organizationId } });
    await tx.companyIssueSymptom.deleteMany({ where: { organizationId } });
    await tx.companyPriorityLabel.deleteMany({ where: { organizationId } });
    await tx.companySlaResponseTime.deleteMany({ where: { organizationId } });

    await tx.organization.update({
      where: { id: organizationId },
      data: { industryTemplateId },
    });

    await tx.companyIndustrySettings.upsert({
      where: { organizationId },
      update: {
        sourceIndustryTemplateId: industryTemplateId,
        sourceTemplateVersion: template.version,
        copiedAt: new Date(),
      },
      create: {
        organizationId,
        sourceIndustryTemplateId: industryTemplateId,
        sourceTemplateVersion: template.version,
      },
    });

    for (const category of template.templateServiceCategories) {
      await tx.companyServiceCategory.create({
        data: {
          organizationId,
          sourceTemplateConfigId: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          sortOrder: category.sortOrder,
          active: category.active,
        },
      });
    }

    for (const jobType of template.templateJobTypes) {
      await tx.companyJobType.create({
        data: {
          organizationId,
          sourceTemplateConfigId: jobType.id,
          name: jobType.name,
          slug: jobType.slug,
          description: jobType.description,
          defaultDurationMin: jobType.defaultDurationMin,
          sortOrder: jobType.sortOrder,
          active: jobType.active,
        },
      });
    }

    for (const assetType of template.templateAssetTypes) {
      const copiedAssetType = await tx.companyAssetType.create({
        data: {
          organizationId,
          sourceTemplateConfigId: assetType.id,
          name: assetType.name,
          slug: assetType.slug,
          description: assetType.description,
          sortOrder: assetType.sortOrder,
          active: assetType.active,
        },
      });

      for (const field of assetType.fields) {
        await tx.companyAssetField.create({
          data: {
            organizationId,
            companyAssetTypeId: copiedAssetType.id,
            sourceTemplateConfigId: field.id,
            name: field.name,
            slug: field.slug,
            type: field.type,
            required: field.required,
            options: field.options ?? undefined,
            sortOrder: field.sortOrder,
            active: field.active,
          },
        });
      }
    }

    for (const field of template.templateAssetFields) {
      await tx.companyAssetField.create({
        data: {
          organizationId,
          sourceTemplateConfigId: field.id,
          name: field.name,
          slug: field.slug,
          type: field.type,
          required: field.required,
          options: field.options ?? undefined,
          sortOrder: field.sortOrder,
          active: field.active,
        },
      });
    }

    for (const checklist of template.templateChecklistTemplates) {
      const copiedChecklist = await tx.companyTechnicianChecklistTemplate.create({
        data: {
          organizationId,
          sourceTemplateConfigId: checklist.id,
          name: checklist.name,
          slug: checklist.slug,
          description: checklist.description,
          jobTypeSlug: checklist.jobTypeSlug,
          sortOrder: checklist.sortOrder,
          active: checklist.active,
        },
      });

      for (const item of checklist.items) {
        await tx.companyTechnicianChecklistItem.create({
          data: {
            checklistTemplateId: copiedChecklist.id,
            sourceTemplateConfigId: item.id,
            label: item.label,
            helpText: item.helpText,
            type: item.type,
            required: item.required,
            sortOrder: item.sortOrder,
            options: item.options ?? undefined,
          },
        });
      }
    }

    for (const status of template.templateJobStatuses) {
      await tx.companyJobStatus.create({
        data: {
          organizationId,
          sourceTemplateConfigId: status.id,
          name: status.name,
          slug: status.slug,
          lifecycle: status.lifecycle,
          color: status.color,
          sortOrder: status.sortOrder,
          isDefault: status.isDefault,
          isTerminal: status.isTerminal,
        },
      });
    }

    for (const item of template.templateQuoteLineItems) {
      await tx.companyQuoteLineItem.create({
        data: {
          organizationId,
          sourceTemplateConfigId: item.id,
          name: item.name,
          slug: item.slug,
          description: item.description,
          defaultQuantity: item.defaultQuantity,
          defaultUnitPrice: item.defaultUnitPrice,
          taxable: item.taxable,
          sortOrder: item.sortOrder,
          active: item.active,
        },
      });
    }

    for (const term of template.templateInvoiceTerms) {
      await tx.companyInvoiceTerm.create({
        data: {
          organizationId,
          sourceTemplateConfigId: term.id,
          name: term.name,
          slug: term.slug,
          terms: term.terms,
          dueDays: term.dueDays,
          sortOrder: term.sortOrder,
          active: term.active,
        },
      });
    }

    for (const category of template.templateInventoryCategories) {
      await tx.companyInventoryCategory.create({
        data: {
          organizationId,
          sourceTemplateConfigId: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          sortOrder: category.sortOrder,
          active: category.active,
        },
      });
    }

    for (const symptom of template.templateIssueSymptoms) {
      await tx.companyIssueSymptom.create({
        data: {
          organizationId,
          sourceTemplateConfigId: symptom.id,
          name: symptom.name,
          slug: symptom.slug,
          description: symptom.description,
          serviceCategorySlug: symptom.serviceCategorySlug,
          priorityHint: symptom.priorityHint,
          sortOrder: symptom.sortOrder,
          active: symptom.active,
        },
      });
    }

    for (const priority of template.templatePriorityLabels) {
      await tx.companyPriorityLabel.create({
        data: {
          organizationId,
          sourceTemplateConfigId: priority.id,
          name: priority.name,
          slug: priority.slug,
          color: priority.color,
          level: priority.level,
          description: priority.description,
          sortOrder: priority.sortOrder,
          active: priority.active,
        },
      });
    }

    for (const sla of template.templateSlaResponseTimes) {
      await tx.companySlaResponseTime.create({
        data: {
          organizationId,
          sourceTemplateConfigId: sla.id,
          name: sla.name,
          slug: sla.slug,
          prioritySlug: sla.prioritySlug,
          responseMinutes: sla.responseMinutes,
          resolutionMinutes: sla.resolutionMinutes,
          description: sla.description,
          sortOrder: sla.sortOrder,
          active: sla.active,
        },
      });
    }

    await tx.activityLog.create({
      data: {
        organizationId,
        actorId,
        entityType: "ORGANIZATION",
        entityId: organizationId,
        action: "industry_template.copied",
        message: `${template.name} template copied into company settings.`,
        metadata: {
          industryTemplateId,
          sourceTemplateVersion: template.version,
        },
      },
    });
  });
}
