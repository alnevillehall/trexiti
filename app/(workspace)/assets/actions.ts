"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AssetStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { assetStatuses, slugify } from "@/lib/service-os/assets";
import { requireTenantContext } from "@/lib/tenant/guard";

const allowedAssetStatuses = new Set<string>(assetStatuses.map((status) => status.value));

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

function optionalValue(formData: FormData, key: string) {
  const raw = value(formData, key);
  return raw || null;
}

function optionalDate(formData: FormData, key: string) {
  const raw = value(formData, key);

  if (!raw) {
    return null;
  }

  const parsed = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseStatus(raw: string): AssetStatus {
  return (allowedAssetStatuses.has(raw) ? raw : "ACTIVE") as AssetStatus;
}

function collectCustomFields(formData: FormData) {
  const customFields: Record<string, string> = {};

  for (const [key, rawValue] of formData.entries()) {
    if (!key.startsWith("custom.") || typeof rawValue !== "string") {
      continue;
    }

    const fieldKey = key.replace("custom.", "");
    const fieldValue = rawValue.trim();

    if (fieldKey && fieldValue) {
      customFields[fieldKey] = fieldValue;
    }
  }

  return customFields;
}

async function requireCustomerLocation(
  organizationId: string,
  customerId: string,
  customerLocationId: string,
) {
  const location = await prisma.customerLocation.findFirst({
    where: {
      id: customerLocationId,
      customerId,
      organizationId,
    },
    select: { id: true },
  });

  if (!location) {
    throw new Error("Selected location does not belong to this customer and organization.");
  }
}

async function upsertAssetType(organizationId: string, assetTypeName: string) {
  const slug = slugify(assetTypeName);

  return prisma.assetType.upsert({
    where: {
      organizationId_slug: {
        organizationId,
        slug,
      },
    },
    update: {
      name: assetTypeName,
    },
    create: {
      organizationId,
      name: assetTypeName,
      slug,
    },
    select: { id: true },
  });
}

export async function createAsset(formData: FormData) {
  const context = await requireTenantContext([
    "PLATFORM_OWNER",
    "COMPANY_ADMIN",
    "DISPATCHER",
    "SALES",
  ]);

  const customerId = requiredValue(formData, "customerId");
  const customerLocationId = requiredValue(formData, "customerLocationId");
  const assetTypeName = requiredValue(formData, "assetTypeName");

  await requireCustomerLocation(context.organizationId, customerId, customerLocationId);
  const assetType = await upsertAssetType(context.organizationId, assetTypeName);

  const asset = await prisma.$transaction(async (tx) => {
    const createdAsset = await tx.asset.create({
      data: {
        organizationId: context.organizationId,
        customerId,
        customerLocationId,
        assetTypeId: assetType.id,
        name: requiredValue(formData, "name"),
        manufacturer: optionalValue(formData, "manufacturer"),
        modelNumber: optionalValue(formData, "modelNumber"),
        serialNumber: optionalValue(formData, "serialNumber"),
        installedAt: optionalDate(formData, "installedAt"),
        warrantyExpiresAt: optionalDate(formData, "warrantyExpiresAt"),
        warrantyStatus: optionalValue(formData, "warrantyStatus"),
        lastServiceAt: optionalDate(formData, "lastServiceAt"),
        notesSummary: optionalValue(formData, "notesSummary"),
        status: parseStatus(value(formData, "status")),
        customFields: collectCustomFields(formData),
      },
    });

    await createOptionalAttachment(tx, context.organizationId, createdAsset.id, formData);

    await tx.activityLog.create({
      data: {
        organizationId: context.organizationId,
        entityType: "ASSET",
        entityId: createdAsset.id,
        action: "asset.created",
        message: `${createdAsset.name} was registered.`,
      },
    });

    return createdAsset;
  });

  revalidatePath("/assets");
  redirect(`/assets/${asset.id}`);
}

export async function updateAsset(formData: FormData) {
  const context = await requireTenantContext([
    "PLATFORM_OWNER",
    "COMPANY_ADMIN",
    "DISPATCHER",
    "SALES",
  ]);

  const assetId = requiredValue(formData, "assetId");
  const customerId = requiredValue(formData, "customerId");
  const customerLocationId = requiredValue(formData, "customerLocationId");
  const assetTypeName = requiredValue(formData, "assetTypeName");

  const existingAsset = await prisma.asset.findFirst({
    where: { id: assetId, organizationId: context.organizationId },
    select: { id: true },
  });

  if (!existingAsset) {
    throw new Error("Asset not found for this organization.");
  }

  await requireCustomerLocation(context.organizationId, customerId, customerLocationId);
  const assetType = await upsertAssetType(context.organizationId, assetTypeName);

  await prisma.$transaction(async (tx) => {
    const updatedAsset = await tx.asset.update({
      where: { id: assetId },
      data: {
        customerId,
        customerLocationId,
        assetTypeId: assetType.id,
        name: requiredValue(formData, "name"),
        manufacturer: optionalValue(formData, "manufacturer"),
        modelNumber: optionalValue(formData, "modelNumber"),
        serialNumber: optionalValue(formData, "serialNumber"),
        installedAt: optionalDate(formData, "installedAt"),
        warrantyExpiresAt: optionalDate(formData, "warrantyExpiresAt"),
        warrantyStatus: optionalValue(formData, "warrantyStatus"),
        lastServiceAt: optionalDate(formData, "lastServiceAt"),
        notesSummary: optionalValue(formData, "notesSummary"),
        status: parseStatus(value(formData, "status")),
        customFields: collectCustomFields(formData),
      },
    });

    await createOptionalAttachment(tx, context.organizationId, updatedAsset.id, formData);

    await tx.activityLog.create({
      data: {
        organizationId: context.organizationId,
        entityType: "ASSET",
        entityId: updatedAsset.id,
        action: "asset.updated",
        message: `${updatedAsset.name} was updated.`,
      },
    });
  });

  revalidatePath("/assets");
  revalidatePath(`/assets/${assetId}`);
  redirect(`/assets/${assetId}`);
}

async function createOptionalAttachment(
  tx: Prisma.TransactionClient,
  organizationId: string,
  assetId: string,
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
      entityType: "ASSET",
      entityId: assetId,
      fileName,
      mimeType: fileName.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg",
      url,
    },
  });
}
