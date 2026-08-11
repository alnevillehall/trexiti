"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { CustomerStatus, CustomerType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { customerStatuses, customerTypes } from "@/lib/service-os/customers";
import { requireTenantContext } from "@/lib/tenant/guard";

const allowedCustomerTypes = new Set<string>(customerTypes.map((type) => type.value));
const allowedCustomerStatuses = new Set<string>(customerStatuses.map((status) => status.value));

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

function parseCustomerType(raw: string): CustomerType {
  return (allowedCustomerTypes.has(raw) ? raw : "RESIDENTIAL") as CustomerType;
}

function parseCustomerStatus(raw: string): CustomerStatus {
  return (allowedCustomerStatuses.has(raw) ? raw : "ACTIVE") as CustomerStatus;
}

export async function createCustomer(formData: FormData) {
  const context = await requireTenantContext([
    "PLATFORM_OWNER",
    "COMPANY_ADMIN",
    "DISPATCHER",
    "SALES",
  ]);

  const displayName = requiredValue(formData, "displayName");
  const locationAddress = requiredValue(formData, "addressLine1");

  const customer = await prisma.$transaction(async (tx) => {
    const createdCustomer = await tx.customer.create({
      data: {
        organizationId: context.organizationId,
        displayName,
        type: parseCustomerType(requiredValue(formData, "type")),
        status: parseCustomerStatus(value(formData, "status")),
        primaryName: optionalValue(formData, "primaryName"),
        email: optionalValue(formData, "email"),
        phone: optionalValue(formData, "phone"),
        whatsapp: optionalValue(formData, "whatsapp"),
        source: optionalValue(formData, "source"),
        notesSummary: optionalValue(formData, "notesSummary"),
      },
    });

    await tx.customerLocation.create({
      data: {
        organizationId: context.organizationId,
        customerId: createdCustomer.id,
        label: requiredValue(formData, "locationLabel"),
        addressLine1: locationAddress,
        addressLine2: optionalValue(formData, "addressLine2"),
        city: optionalValue(formData, "city"),
        parish: optionalValue(formData, "parish"),
        country: optionalValue(formData, "country") ?? "Jamaica",
        mapUrl: optionalValue(formData, "mapUrl"),
        accessNotes: optionalValue(formData, "accessNotes"),
        contactName: optionalValue(formData, "contactName"),
        contactPhone: optionalValue(formData, "contactPhone"),
        securityNotes: optionalValue(formData, "securityNotes"),
        preferredTimes: optionalValue(formData, "preferredTimes"),
      },
    });

    await tx.activityLog.create({
      data: {
        organizationId: context.organizationId,
        entityType: "CUSTOMER",
        entityId: createdCustomer.id,
        action: "customer.created",
        message: `${displayName} was created.`,
      },
    });

    return createdCustomer;
  });

  revalidatePath("/customers");
  redirect(`/customers/${customer.id}`);
}
