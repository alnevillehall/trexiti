"use server";

import { notFound, redirect } from "next/navigation";

import { isWorkspaceDemoMode } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { copyIndustryTemplateToOrganization } from "@/lib/service-os/template-copy";

const industryKeyMap = {
  "appliance-hvac": "APPLIANCE_HVAC",
  plumbing: "PLUMBING",
  electrical: "ELECTRICAL",
} as const;

function requiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${key} is required.`);
  }

  return value.trim();
}

function optionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
}

async function uniqueOrganizationSlug(companyName: string) {
  const baseSlug = slugify(companyName) || "company";
  const existing = await prisma.organization.findUnique({
    where: { slug: baseSlug },
    select: { id: true },
  });

  if (!existing) {
    return baseSlug;
  }

  return `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function createOrganizationOnboarding(formData: FormData) {
  if (!isWorkspaceDemoMode()) {
    notFound();
  }

  const companyName = requiredString(formData, "companyName");
  const industryTemplateValue = requiredString(formData, "industryTemplate");
  const industryTemplateKey =
    industryKeyMap[industryTemplateValue as keyof typeof industryKeyMap];

  if (!industryTemplateKey) {
    throw new Error("A valid industry template is required.");
  }

  const industryTemplate = await prisma.industryTemplate.findUnique({
    where: { key: industryTemplateKey },
    select: { id: true, key: true },
  });

  if (!industryTemplate) {
    throw new Error("Seed industry templates before onboarding a company.");
  }

  const businessPhone = requiredString(formData, "businessPhone");
  const businessEmail = requiredString(formData, "businessEmail");
  const addressLine1 = requiredString(formData, "addressLine1");
  const addressLine2 = optionalString(formData, "addressLine2");
  const city = optionalString(formData, "city");
  const parish = optionalString(formData, "parish");
  const currency = optionalString(formData, "currency") ?? "JMD";
  const taxEnabled = formData.get("taxEnabled") === "on";
  const taxLabel = optionalString(formData, "taxLabel") ?? "GCT";
  const taxRate = optionalString(formData, "taxRate") ?? "15";
  const numberOfTechnicians = Number(requiredString(formData, "numberOfTechnicians"));
  const weekdayOpen = requiredString(formData, "weekdayOpen");
  const weekdayClose = requiredString(formData, "weekdayClose");
  const saturdayOpen = optionalString(formData, "saturdayOpen") ?? "09:00";
  const saturdayClose = optionalString(formData, "saturdayClose") ?? "13:00";

  if (!Number.isInteger(numberOfTechnicians) || numberOfTechnicians < 0) {
    throw new Error("Number of technicians must be a positive whole number.");
  }

  const businessHours = {
    monday: { open: weekdayOpen, close: weekdayClose, closed: false },
    tuesday: { open: weekdayOpen, close: weekdayClose, closed: false },
    wednesday: { open: weekdayOpen, close: weekdayClose, closed: false },
    thursday: { open: weekdayOpen, close: weekdayClose, closed: false },
    friday: { open: weekdayOpen, close: weekdayClose, closed: false },
    saturday: { open: saturdayOpen, close: saturdayClose, closed: false },
    sunday: { open: "00:00", close: "00:00", closed: true },
    emergencyAfterHours: formData.get("emergencyAfterHours") === "on",
  };

  const slug = await uniqueOrganizationSlug(companyName);

  const organization = await prisma.organization.create({
    data: {
      name: companyName,
      slug,
      status: "TRIAL",
      phone: businessPhone,
      email: businessEmail,
      addressLine1,
      addressLine2,
      city,
      parish,
      currency,
      taxLabel,
      taxRate,
      industryTemplateId: industryTemplate.id,
      settings: {
        create: {
          businessPhone,
          businessEmail,
          addressLine1,
          addressLine2,
          city,
          parish,
          currency,
          taxEnabled,
          taxLabel,
          taxRate,
          businessHours,
          numberOfTechnicians,
          onboardingCompletedAt: new Date(),
        },
      },
    },
    select: { id: true, slug: true, name: true },
  });

  await prisma.activityLog.create({
    data: {
      organizationId: organization.id,
      entityType: "ORGANIZATION",
      entityId: organization.id,
      action: "organization.onboarded",
      message: `${organization.name} completed onboarding.`,
      metadata: { industryTemplate: industryTemplate.key },
    },
  });

  await copyIndustryTemplateToOrganization({
    organizationId: organization.id,
    industryTemplateId: industryTemplate.id,
  });

  redirect(`/dashboard?onboarded=${organization.slug}`);
}
