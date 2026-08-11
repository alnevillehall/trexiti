import type { AssetStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  customFieldsFromJson,
  demoAssetCustomers,
  filterDemoAssets,
  getAssetTypeOptions,
  getDemoAsset,
  slugify,
  type AssetCustomerOption,
  type AssetFilters,
  type AssetListRow,
  type AssetProfile,
  type AssetTypeOption,
} from "@/lib/service-os/assets";
import { compactAddress } from "@/lib/service-os/customers";
import type { IndustryTemplateKey } from "@/lib/service-os/industry-templates";

export async function loadAssetTypeOptions(
  organizationId: string,
  industryKey: IndustryTemplateKey,
): Promise<AssetTypeOption[]> {
  try {
    const [assetTypes, companyAssetTypes] = await Promise.all([
      prisma.assetType.findMany({
        where: { organizationId },
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
      }),
      prisma.companyAssetType.findMany({
        where: { organizationId, active: true },
        orderBy: { sortOrder: "asc" },
        select: { name: true, slug: true },
      }),
    ]);

    const rawOptions: AssetTypeOption[] = [
      ...assetTypes.map((assetType) => ({
        id: assetType.id,
        name: assetType.name,
        slug: assetType.slug,
      })),
      ...companyAssetTypes.map((assetType) => ({
        name: assetType.name,
        slug: assetType.slug,
      })),
      ...getAssetTypeOptions(industryKey),
    ];

    const seen = new Set<string>();
    const options = rawOptions
      .filter((assetType) => {
        const key = slugify(assetType.name);
        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      })
      .map((assetType) => ({
        id: assetType.id,
        name: assetType.name,
        slug: assetType.slug || slugify(assetType.name),
      }));

    return options;
  } catch {
    return getAssetTypeOptions(industryKey);
  }
}

export async function loadAssetCustomerOptions(
  organizationId: string,
): Promise<AssetCustomerOption[]> {
  try {
    const customers = await prisma.customer.findMany({
      where: { organizationId },
      orderBy: { displayName: "asc" },
      include: {
        locations: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!customers.length) {
      return demoAssetCustomers;
    }

    return customers.map((customer) => ({
      id: customer.id,
      name: customer.displayName,
      locations: customer.locations.map((location) => ({
        id: location.id,
        label: location.label,
        address: compactAddress(location),
      })),
    }));
  } catch {
    return demoAssetCustomers;
  }
}

export async function loadAssets(
  organizationId: string,
  filters: AssetFilters,
): Promise<AssetListRow[]> {
  try {
    const where: Prisma.AssetWhereInput = { organizationId };

    if (filters.q?.trim()) {
      const q = filters.q.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { manufacturer: { contains: q, mode: "insensitive" } },
        { modelNumber: { contains: q, mode: "insensitive" } },
        { serialNumber: { contains: q, mode: "insensitive" } },
        { customer: { displayName: { contains: q, mode: "insensitive" } } },
        { customerLocation: { addressLine1: { contains: q, mode: "insensitive" } } },
        { assetType: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    if (filters.type && filters.type !== "all") {
      where.assetType = { slug: filters.type };
    }

    if (filters.status && filters.status !== "all") {
      where.status = filters.status as AssetStatus;
    }

    const assets = await prisma.asset.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        customer: { select: { displayName: true } },
        customerLocation: true,
        assetType: { select: { name: true, slug: true } },
        workOrders: {
          orderBy: [{ completedAt: "desc" }, { requestedAt: "desc" }],
          take: 1,
          select: { completedAt: true, requestedAt: true },
        },
        _count: { select: { workOrders: true } },
      },
    });

    return assets.map((asset) => {
      const lastWorkOrder = asset.workOrders[0];

      return {
        id: asset.id,
        name: asset.name,
        assetType: asset.assetType?.name ?? "Uncategorized",
        customer: asset.customer.displayName,
        location: compactAddress(asset.customerLocation),
        brand: asset.manufacturer,
        modelNumber: asset.modelNumber,
        serialNumber: asset.serialNumber,
        warrantyStatus: asset.warrantyStatus,
        lastServiceAt: asset.lastServiceAt ?? lastWorkOrder?.completedAt ?? lastWorkOrder?.requestedAt,
        status: asset.status,
        jobsCount: asset._count.workOrders,
      };
    });
  } catch {
    return filterDemoAssets(filters);
  }
}

export async function loadAssetProfile(
  organizationId: string,
  id: string,
): Promise<AssetProfile | null> {
  try {
    const [asset, attachments, activity] = await Promise.all([
      prisma.asset.findFirst({
        where: { id, organizationId },
        include: {
          customer: { select: { id: true, displayName: true } },
          customerLocation: true,
          assetType: true,
          workOrders: {
            orderBy: { requestedAt: "desc" },
            include: { status: true },
          },
        },
      }),
      prisma.attachment.findMany({
        where: { organizationId, entityType: "ASSET", entityId: id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.activityLog.findMany({
        where: { organizationId, entityType: "ASSET", entityId: id },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!asset) {
      return null;
    }

    const lastWorkOrder = asset.workOrders[0];

    return {
      id: asset.id,
      name: asset.name,
      assetType: asset.assetType?.name ?? "Uncategorized",
      customerId: asset.customerId,
      customer: asset.customer.displayName,
      locationId: asset.customerLocationId,
      location: compactAddress(asset.customerLocation),
      assetTypeId: asset.assetTypeId,
      brand: asset.manufacturer,
      modelNumber: asset.modelNumber,
      serialNumber: asset.serialNumber,
      installedAt: asset.installedAt,
      warrantyStatus: asset.warrantyStatus,
      warrantyExpiresAt: asset.warrantyExpiresAt,
      lastServiceAt: asset.lastServiceAt ?? lastWorkOrder?.completedAt ?? lastWorkOrder?.requestedAt,
      notesSummary: asset.notesSummary,
      status: asset.status,
      jobsCount: asset.workOrders.length,
      customFields: customFieldsFromJson(asset.customFields),
      attachments,
      jobs: asset.workOrders.map((workOrder) => ({
        id: workOrder.id,
        number: workOrder.number,
        title: workOrder.title,
        lifecycle: workOrder.status.lifecycle,
        priority: workOrder.priority,
        requestedAt: workOrder.requestedAt,
        completedAt: workOrder.completedAt,
      })),
      activity,
    };
  } catch {
    return getDemoAsset(id);
  }
}
