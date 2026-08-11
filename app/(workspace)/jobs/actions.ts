"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
  AssetStatus,
  CustomerType,
  JobSource,
  Prisma,
  WorkOrderPaymentStatus,
  WorkOrderPriority,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/service-os/assets";
import {
  defaultWorkOrderStatuses,
  jobSourceOptions,
  paymentStatusOptions,
  priorityOptions,
} from "@/lib/service-os/jobs";
import { requireTenantContext } from "@/lib/tenant/guard";

const CREATE_CUSTOMER_VALUE = "__new_customer";
const CREATE_LOCATION_VALUE = "__new_location";
const CREATE_ASSET_VALUE = "__new_asset";
const NONE_VALUE = "__none";

const allowedPriorities = new Set<string>(priorityOptions.map((priority) => priority.value));
const allowedSources = new Set<string>(jobSourceOptions.map((source) => source.value));
const allowedPaymentStatuses = new Set<string>(
  paymentStatusOptions.map((status) => status.value),
);

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

function optionalValue(formData: FormData, key: string) {
  const raw = value(formData, key);
  return raw && raw !== NONE_VALUE ? raw : null;
}

function requiredValue(formData: FormData, key: string) {
  const raw = optionalValue(formData, key);

  if (!raw) {
    throw new Error(`${key} is required.`);
  }

  return raw;
}

function parsePriority(raw: string): WorkOrderPriority {
  return (allowedPriorities.has(raw) ? raw : "NORMAL") as WorkOrderPriority;
}

function parseSource(raw: string): JobSource {
  return (allowedSources.has(raw) ? raw : "PHONE") as JobSource;
}

function parsePaymentStatus(raw: string): WorkOrderPaymentStatus {
  return (
    allowedPaymentStatuses.has(raw) ? raw : "NOT_INVOICED"
  ) as WorkOrderPaymentStatus;
}

function parseIntValue(formData: FormData, key: string) {
  const raw = value(formData, key);

  if (!raw) {
    return null;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseDateTime(date: string | null, time: string | null) {
  if (!date || !time) {
    return null;
  }

  const parsed = new Date(`${date}T${time}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseWindow(date: string | null, window: string | null) {
  if (!date || !window) {
    return { start: null, end: null };
  }

  const ranges: Record<string, [string, string]> = {
    morning: ["08:00", "12:00"],
    afternoon: ["12:00", "16:00"],
    evening: ["16:00", "19:00"],
    "8-12": ["08:00", "12:00"],
    "12-4": ["12:00", "16:00"],
  };
  const range = ranges[window];

  if (!range) {
    return { start: null, end: null };
  }

  return {
    start: parseDateTime(date, range[0]),
    end: parseDateTime(date, range[1]),
  };
}

export async function createWorkOrder(formData: FormData) {
  const context = await requireTenantContext([
    "PLATFORM_OWNER",
    "COMPANY_ADMIN",
    "DISPATCHER",
    "SALES",
  ]);

  const workOrderId = await prisma.$transaction(async (tx) => {
    const statuses = await ensureDefaultWorkOrderStatuses(tx, context.organizationId);
    const technicianProfileId = optionalValue(formData, "technicianProfileId");
    const status =
      statuses.get(technicianProfileId ? "assigned" : "new-request") ??
      statuses.get("new-request");

    if (!status) {
      throw new Error("No default work order status is configured.");
    }

    const customer = await resolveCustomer(tx, context.organizationId, formData);
    const location = await resolveLocation(tx, context.organizationId, customer.id, formData);
    const asset = await resolveAsset(
      tx,
      context.organizationId,
      customer.id,
      location.id,
      formData,
    );
    const serviceCategory = await upsertServiceCategory(
      tx,
      context.organizationId,
      requiredValue(formData, "serviceCategoryName"),
    );
    const checklistTemplate = await findChecklistTemplate(
      tx,
      context.organizationId,
      value(formData, "jobType"),
      serviceCategory.id,
    );
    const scheduledStart = parseDateTime(
      optionalValue(formData, "scheduledDate"),
      optionalValue(formData, "scheduledTime"),
    );
    const estimatedDurationMin = parseIntValue(formData, "estimatedDurationMin") ?? 90;
    const scheduledEnd =
      scheduledStart && estimatedDurationMin
        ? new Date(scheduledStart.getTime() + estimatedDurationMin * 60 * 1000)
        : null;
    const preferred = parseWindow(
      optionalValue(formData, "preferredDate"),
      optionalValue(formData, "preferredWindow"),
    );
    const title =
      optionalValue(formData, "title") ??
      `${serviceCategory.name} for ${customer.displayName}`;

    const workOrder = await tx.workOrder.create({
      data: {
        organizationId: context.organizationId,
        number: await nextWorkOrderNumber(tx, context.organizationId),
        customerId: customer.id,
        customerLocationId: location.id,
        assetId: asset?.id,
        serviceCategoryId: serviceCategory.id,
        statusId: status.id,
        checklistTemplateId: checklistTemplate?.id,
        createdById: context.userId,
        title,
        description: optionalValue(formData, "description"),
        customerComplaint: requiredValue(formData, "customerComplaint"),
        internalNotes: optionalValue(formData, "internalNotes"),
        jobType: optionalValue(formData, "jobType"),
        priority: parsePriority(value(formData, "priority")),
        source: parseSource(value(formData, "source")),
        paymentStatus: parsePaymentStatus(value(formData, "paymentStatus")),
        preferredStart: preferred.start,
        preferredEnd: preferred.end,
        scheduledStart,
        scheduledEnd,
        estimatedDurationMin,
        customFields: {
          intakeMode: customer.id === CREATE_CUSTOMER_VALUE ? "new-customer" : "existing-customer",
          createdFrom: "office-form",
        },
      },
    });

    if (technicianProfileId) {
      await assertTechnician(tx, context.organizationId, technicianProfileId);
      await tx.workOrderAssignment.create({
        data: {
          organizationId: context.organizationId,
          workOrderId: workOrder.id,
          technicianProfileId,
          assignedById: context.userId,
          status: "ASSIGNED",
        },
      });
    }

    await createOptionalAttachment(tx, context.organizationId, workOrder.id, formData);

    await tx.activityLog.create({
      data: {
        organizationId: context.organizationId,
        actorId: context.userId,
        entityType: "WORK_ORDER",
        entityId: workOrder.id,
        action: "job.created",
        message: `${workOrder.number} was created for ${customer.displayName}.`,
        metadata: {
          customerId: customer.id,
          locationId: location.id,
          assetId: asset?.id,
          status: status.slug,
        },
      },
    });

    return workOrder.id;
  });

  revalidatePath("/jobs");
  revalidatePath("/jobs/board");
  redirect(`/jobs/${workOrderId}`);
}

export async function changeWorkOrderStatus(formData: FormData) {
  const context = await requireTenantContext([
    "PLATFORM_OWNER",
    "COMPANY_ADMIN",
    "DISPATCHER",
    "TECHNICIAN",
  ]);

  const workOrderId = requiredValue(formData, "workOrderId");
  const statusId = requiredValue(formData, "statusId");

  const updatedWorkOrder = await prisma.$transaction(async (tx) => {
    const workOrder = await tx.workOrder.findFirst({
      where: { id: workOrderId, organizationId: context.organizationId },
      include: { status: true },
    });

    if (!workOrder) {
      throw new Error("Work order not found for this organization.");
    }

    const nextStatus = await tx.workOrderStatus.findFirst({
      where: { id: statusId, organizationId: context.organizationId },
    });

    if (!nextStatus) {
      throw new Error("Selected status does not belong to this organization.");
    }

    const paymentStatus =
      nextStatus.slug === "paid"
        ? "PAID"
        : nextStatus.slug === "invoiced"
          ? "INVOICED"
          : workOrder.paymentStatus;

    const updated = await tx.workOrder.update({
      where: { id: workOrder.id },
      data: {
        statusId: nextStatus.id,
        completedAt:
          nextStatus.lifecycle === "COMPLETED"
            ? workOrder.completedAt ?? new Date()
            : workOrder.completedAt,
        paymentStatus,
      },
      include: { status: true },
    });

    await tx.activityLog.create({
      data: {
        organizationId: context.organizationId,
        actorId: context.userId,
        entityType: "WORK_ORDER",
        entityId: workOrder.id,
        action: "job.status_changed",
        message: `${workOrder.number} moved from ${workOrder.status.name} to ${nextStatus.name}.`,
        metadata: {
          fromStatusId: workOrder.statusId,
          toStatusId: nextStatus.id,
          fromStatus: workOrder.status.slug,
          toStatus: nextStatus.slug,
        },
      },
    });

    return updated;
  });

  revalidatePath("/jobs");
  revalidatePath("/jobs/board");
  revalidatePath(`/jobs/${updatedWorkOrder.id}`);
}

async function resolveCustomer(
  tx: Prisma.TransactionClient,
  organizationId: string,
  formData: FormData,
) {
  const customerId = value(formData, "customerId");

  if (customerId === CREATE_CUSTOMER_VALUE) {
    const displayName = requiredValue(formData, "newCustomerName");

    return tx.customer.create({
      data: {
        organizationId,
        displayName,
        primaryName: optionalValue(formData, "newCustomerContactName") ?? displayName,
        type: (optionalValue(formData, "newCustomerType") ?? "RESIDENTIAL") as CustomerType,
        phone: optionalValue(formData, "newCustomerPhone"),
        whatsapp: optionalValue(formData, "newCustomerWhatsApp") ?? optionalValue(formData, "newCustomerPhone"),
        email: optionalValue(formData, "newCustomerEmail"),
        source: "Job intake",
        notesSummary: optionalValue(formData, "newCustomerNotes"),
      },
    });
  }

  const customer = await tx.customer.findFirst({
    where: { id: customerId, organizationId },
  });

  if (!customer) {
    throw new Error("Selected customer does not belong to this organization.");
  }

  return customer;
}

async function resolveLocation(
  tx: Prisma.TransactionClient,
  organizationId: string,
  customerId: string,
  formData: FormData,
) {
  const locationId = value(formData, "customerLocationId");

  if (locationId === CREATE_LOCATION_VALUE || value(formData, "customerId") === CREATE_CUSTOMER_VALUE) {
    return tx.customerLocation.create({
      data: {
        organizationId,
        customerId,
        label: optionalValue(formData, "newLocationLabel") ?? "Main site",
        addressLine1: requiredValue(formData, "newLocationAddressLine1"),
        addressLine2: optionalValue(formData, "newLocationAddressLine2"),
        city: optionalValue(formData, "newLocationCity"),
        parish: optionalValue(formData, "newLocationParish"),
        country: optionalValue(formData, "newLocationCountry") ?? "Jamaica",
        mapUrl: optionalValue(formData, "newLocationMapUrl"),
        accessNotes: optionalValue(formData, "newLocationAccessNotes"),
        contactName: optionalValue(formData, "newLocationContactName"),
        contactPhone: optionalValue(formData, "newLocationContactPhone"),
        securityNotes: optionalValue(formData, "newLocationSecurityNotes"),
        preferredTimes: optionalValue(formData, "newLocationPreferredTimes"),
      },
    });
  }

  const location = await tx.customerLocation.findFirst({
    where: { id: locationId, customerId, organizationId },
  });

  if (!location) {
    throw new Error("Selected location does not belong to this customer and organization.");
  }

  return location;
}

async function resolveAsset(
  tx: Prisma.TransactionClient,
  organizationId: string,
  customerId: string,
  customerLocationId: string,
  formData: FormData,
) {
  const assetId = value(formData, "assetId");

  if (!assetId || assetId === NONE_VALUE) {
    return null;
  }

  if (assetId === CREATE_ASSET_VALUE) {
    const assetTypeName = requiredValue(formData, "newAssetTypeName");
    const assetType = await tx.assetType.upsert({
      where: {
        organizationId_slug: {
          organizationId,
          slug: slugify(assetTypeName),
        },
      },
      update: { name: assetTypeName },
      create: {
        organizationId,
        name: assetTypeName,
        slug: slugify(assetTypeName),
      },
    });

    return tx.asset.create({
      data: {
        organizationId,
        customerId,
        customerLocationId,
        assetTypeId: assetType.id,
        name: requiredValue(formData, "newAssetName"),
        manufacturer: optionalValue(formData, "newAssetManufacturer"),
        modelNumber: optionalValue(formData, "newAssetModelNumber"),
        serialNumber: optionalValue(formData, "newAssetSerialNumber"),
        status: "ACTIVE" as AssetStatus,
        customFields: {
          createdFrom: "job-intake",
        },
      },
    });
  }

  const asset = await tx.asset.findFirst({
    where: {
      id: assetId,
      organizationId,
      customerId,
      customerLocationId,
    },
  });

  if (!asset) {
    throw new Error("Selected asset does not belong to this customer location.");
  }

  return asset;
}

async function upsertServiceCategory(
  tx: Prisma.TransactionClient,
  organizationId: string,
  name: string,
) {
  const slug = slugify(name);

  return tx.serviceCategory.upsert({
    where: {
      organizationId_slug: {
        organizationId,
        slug,
      },
    },
    update: { name },
    create: {
      organizationId,
      name,
      slug,
    },
  });
}

async function findChecklistTemplate(
  tx: Prisma.TransactionClient,
  organizationId: string,
  jobType: string,
  serviceCategoryId: string,
) {
  const jobTypeSlug = slugify(jobType);

  return tx.checklistTemplate.findFirst({
    where: {
      organizationId,
      active: true,
      OR: [
        { jobType },
        { jobType: jobTypeSlug },
        { serviceCategoryId },
      ],
    },
    select: { id: true },
    orderBy: { required: "desc" },
  });
}

async function assertTechnician(
  tx: Prisma.TransactionClient,
  organizationId: string,
  technicianProfileId: string,
) {
  const technician = await tx.technicianProfile.findFirst({
    where: { id: technicianProfileId, organizationId, active: true },
    select: { id: true },
  });

  if (!technician) {
    throw new Error("Selected technician does not belong to this organization.");
  }
}

async function ensureDefaultWorkOrderStatuses(
  tx: Prisma.TransactionClient,
  organizationId: string,
) {
  const statuses = new Map<string, { id: string; name: string; slug: string }>();

  for (const [sortOrder, status] of defaultWorkOrderStatuses.entries()) {
    const saved = await tx.workOrderStatus.upsert({
      where: {
        organizationId_slug: {
          organizationId,
          slug: status.slug,
        },
      },
      update: {
        name: status.name,
        lifecycle: status.lifecycle,
        color: status.color,
        sortOrder,
        isDefault: status.isDefault,
        isTerminal: status.isTerminal,
      },
      create: {
        organizationId,
        name: status.name,
        slug: status.slug,
        lifecycle: status.lifecycle,
        color: status.color,
        sortOrder,
        isDefault: status.isDefault,
        isTerminal: status.isTerminal,
      },
      select: { id: true, name: true, slug: true },
    });

    statuses.set(saved.slug, saved);
  }

  return statuses;
}

async function nextWorkOrderNumber(
  tx: Prisma.TransactionClient,
  organizationId: string,
) {
  const count = await tx.workOrder.count({ where: { organizationId } });
  const year = new Date().getFullYear();

  return `WO-${year}-${String(count + 1).padStart(4, "0")}`;
}

async function createOptionalAttachment(
  tx: Prisma.TransactionClient,
  organizationId: string,
  workOrderId: string,
  formData: FormData,
) {
  const fileName = optionalValue(formData, "attachmentFileName");
  const url = optionalValue(formData, "attachmentUrl");

  if (!fileName || !url) {
    return;
  }

  await tx.attachment.create({
    data: {
      organizationId,
      entityType: "WORK_ORDER",
      entityId: workOrderId,
      fileName,
      mimeType: fileName.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg",
      url,
    },
  });
}
