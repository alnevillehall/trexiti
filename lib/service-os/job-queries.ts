import type {
  JobSource,
  Prisma,
  WorkOrderLifecycle,
  WorkOrderPaymentStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { compactAddress } from "@/lib/service-os/customers";
import { slugify } from "@/lib/service-os/assets";
import { getIndustryTemplate, type IndustryTemplateKey } from "@/lib/service-os/industry-templates";
import {
  decimalToNumber,
  defaultWorkOrderStatuses,
  filterDemoJobs,
  getDemoJobFormOptions,
  getDemoJobProfile,
  isJobOverdue,
  type JobFilters,
  type JobFormOptions,
  type JobListRow,
  type JobProfile,
  type JobTypeOption,
  type ServiceCategoryOption,
  type TechnicianOption,
  type WorkOrderStatusOption,
} from "@/lib/service-os/jobs";

export async function loadJobStatuses(
  organizationId: string,
): Promise<WorkOrderStatusOption[]> {
  try {
    const [workOrderStatuses, companyStatuses] = await Promise.all([
      prisma.workOrderStatus.findMany({
        where: { organizationId },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          lifecycle: true,
          color: true,
          sortOrder: true,
          isDefault: true,
          isTerminal: true,
        },
      }),
      prisma.companyJobStatus.findMany({
        where: { organizationId },
        orderBy: { sortOrder: "asc" },
        select: {
          name: true,
          slug: true,
          lifecycle: true,
          color: true,
          sortOrder: true,
          isDefault: true,
          isTerminal: true,
        },
      }),
    ]);

    return mergeStatusOptions([
      ...workOrderStatuses,
      ...companyStatuses,
      ...defaultWorkOrderStatuses,
    ]);
  } catch {
    return [...defaultWorkOrderStatuses];
  }
}

export async function loadJobs(
  organizationId: string,
  filters: JobFilters,
): Promise<JobListRow[]> {
  try {
    const where: Prisma.WorkOrderWhereInput = { organizationId };

    if (filters.q?.trim()) {
      const q = filters.q.trim();
      where.OR = [
        { number: { contains: q, mode: "insensitive" } },
        { title: { contains: q, mode: "insensitive" } },
        { customerComplaint: { contains: q, mode: "insensitive" } },
        { customer: { displayName: { contains: q, mode: "insensitive" } } },
        { customerLocation: { addressLine1: { contains: q, mode: "insensitive" } } },
        { asset: { name: { contains: q, mode: "insensitive" } } },
        { serviceCategory: { name: { contains: q, mode: "insensitive" } } },
        {
          assignments: {
            some: {
              technicianProfile: {
                displayName: { contains: q, mode: "insensitive" },
              },
            },
          },
        },
      ];
    }

    if (filters.status && filters.status !== "all") {
      where.status = { slug: filters.status };
    }

    if (filters.priority && filters.priority !== "all") {
      where.priority = filters.priority as Prisma.EnumWorkOrderPriorityFilter["equals"];
    }

    if (filters.payment && filters.payment !== "all") {
      where.paymentStatus = filters.payment as WorkOrderPaymentStatus;
    }

    applySmartFilter(where, filters.smart);

    const jobs = await prisma.workOrder.findMany({
      where,
      orderBy: [{ scheduledStart: "asc" }, { requestedAt: "desc" }],
      include: {
        customer: { select: { id: true, displayName: true, phone: true, whatsapp: true } },
        customerLocation: true,
        asset: { select: { name: true } },
        serviceCategory: { select: { name: true } },
        status: true,
        assignments: {
          include: {
            technicianProfile: { select: { displayName: true } },
          },
        },
        quotes: { select: { id: true } },
        invoices: { select: { id: true, balanceDue: true } },
      },
    });

    return jobs.map((job) => mapJobListRow(job));
  } catch {
    return filterDemoJobs(filters);
  }
}

export async function loadJobProfile(
  organizationId: string,
  id: string,
): Promise<JobProfile | null> {
  try {
    const [job, notes, attachments, activity] = await Promise.all([
      prisma.workOrder.findFirst({
        where: { id, organizationId },
        include: {
          customer: true,
          customerLocation: true,
          asset: { include: { assetType: true } },
          serviceCategory: true,
          serviceItem: true,
          status: true,
          createdBy: { select: { name: true } },
          assignments: {
            orderBy: { assignedAt: "desc" },
            include: {
              technicianProfile: {
                select: { displayName: true, phone: true },
              },
            },
          },
          checklistTemplate: {
            include: {
              items: { orderBy: { sortOrder: "asc" } },
            },
          },
          checklistResponses: true,
          quotes: { orderBy: { createdAt: "desc" } },
          invoices: { orderBy: { createdAt: "desc" } },
        },
      }),
      prisma.note.findMany({
        where: { organizationId, entityType: "WORK_ORDER", entityId: id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.attachment.findMany({
        where: { organizationId, entityType: "WORK_ORDER", entityId: id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.activityLog.findMany({
        where: { organizationId, entityType: "WORK_ORDER", entityId: id },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!job) {
      return null;
    }

    const row = mapJobListRow(job);
    const responsesByItemId = new Map(
      job.checklistResponses.map((response) => [response.checklistItemId, response]),
    );

    return {
      ...row,
      description: job.description,
      customerComplaint: job.customerComplaint,
      internalNotes: job.internalNotes,
      requestedAt: job.requestedAt,
      completedAt: job.completedAt,
      estimatedDurationMin: job.estimatedDurationMin,
      createdBy: job.createdBy?.name,
      customer: {
        id: job.customer.id,
        name: job.customer.displayName,
        primaryName: job.customer.primaryName,
        phone: job.customer.phone,
        whatsapp: job.customer.whatsapp,
        email: job.customer.email,
        type: job.customer.type,
      },
      customerLocation: job.customerLocation
        ? {
            id: job.customerLocation.id,
            label: job.customerLocation.label,
            address: compactAddress(job.customerLocation),
            mapUrl: job.customerLocation.mapUrl,
            accessNotes: job.customerLocation.accessNotes,
            contactName: job.customerLocation.contactName,
            contactPhone: job.customerLocation.contactPhone,
            securityNotes: job.customerLocation.securityNotes,
            preferredTimes: job.customerLocation.preferredTimes,
          }
        : null,
      asset: job.asset
        ? {
            id: job.asset.id,
            name: job.asset.name,
            assetType: job.asset.assetType?.name ?? "Uncategorized",
            manufacturer: job.asset.manufacturer,
            modelNumber: job.asset.modelNumber,
            serialNumber: job.asset.serialNumber,
            warrantyStatus: job.asset.warrantyStatus,
            lastServiceAt: job.asset.lastServiceAt,
          }
        : null,
      assignments: job.assignments.map((assignment) => ({
        id: assignment.id,
        technicianName: assignment.technicianProfile.displayName,
        technicianPhone: assignment.technicianProfile.phone,
        status: assignment.status,
        assignedAt: assignment.assignedAt,
      })),
      checklist: job.checklistTemplate
        ? {
            id: job.checklistTemplate.id,
            name: job.checklistTemplate.name,
            items: job.checklistTemplate.items.map((item) => {
              const response = responsesByItemId.get(item.id);

              return {
                id: item.id,
                label: item.label,
                type: item.type,
                required: item.required,
                response: response?.status,
                note: response?.note,
                completedAt: response?.completedAt,
              };
            }),
          }
        : null,
      notes,
      attachments,
      quotes: job.quotes.map((quote) => ({
        id: quote.id,
        number: quote.number,
        title: quote.title,
        status: quote.status,
        total: decimalToNumber(quote.total),
      })),
      invoices: job.invoices.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        total: decimalToNumber(invoice.total),
        balanceDue: decimalToNumber(invoice.balanceDue),
      })),
      activity,
    };
  } catch {
    return getDemoJobProfile(id);
  }
}

export async function loadJobFormOptions(
  organizationId: string,
  industryKey: IndustryTemplateKey,
): Promise<JobFormOptions> {
  try {
    const [customers, serviceCategories, companyCategories, companyJobTypes, technicians, statuses] =
      await Promise.all([
        prisma.customer.findMany({
          where: { organizationId },
          orderBy: { displayName: "asc" },
          include: {
            locations: { orderBy: { createdAt: "asc" } },
            assets: {
              orderBy: { name: "asc" },
              include: { assetType: true },
            },
          },
        }),
        prisma.serviceCategory.findMany({
          where: { organizationId, active: true },
          orderBy: { sortOrder: "asc" },
          select: { id: true, name: true, slug: true },
        }),
        prisma.companyServiceCategory.findMany({
          where: { organizationId, active: true },
          orderBy: { sortOrder: "asc" },
          select: { name: true, slug: true },
        }),
        prisma.companyJobType.findMany({
          where: { organizationId, active: true },
          orderBy: { sortOrder: "asc" },
          select: { name: true, slug: true, defaultDurationMin: true },
        }),
        prisma.technicianProfile.findMany({
          where: { organizationId, active: true },
          orderBy: { displayName: "asc" },
          select: { id: true, displayName: true, phone: true, serviceArea: true },
        }),
        loadJobStatuses(organizationId),
      ]);

    const template = getIndustryTemplate(industryKey);
    const categoryOptions = mergeServiceCategories([
      ...serviceCategories,
      ...companyCategories,
      ...template.serviceCategories.map((name) => ({ name, slug: slugify(name) })),
    ]);
    const jobTypeOptions = mergeJobTypes([
      ...companyJobTypes,
      ...template.jobTypeDefaults.map((jobType) => ({
        name: jobType.name,
        slug: jobType.slug,
        defaultDurationMin: jobType.defaultDurationMin,
      })),
    ]);
    const technicianOptions: TechnicianOption[] = technicians.map((technician) => ({
      id: technician.id,
      name: technician.displayName,
      phone: technician.phone,
      serviceArea: technician.serviceArea,
    }));

    if (!customers.length) {
      return {
        ...getDemoJobFormOptions(),
        serviceCategories: categoryOptions,
        jobTypes: jobTypeOptions,
        statuses,
        technicians: technicianOptions.length ? technicianOptions : getDemoJobFormOptions().technicians,
      };
    }

    return {
      customers: customers.map((customer) => ({
        id: customer.id,
        name: customer.displayName,
        phone: customer.phone,
        email: customer.email,
        locations: customer.locations.map((location) => ({
          id: location.id,
          label: location.label,
          address: compactAddress(location),
          city: location.city,
          parish: location.parish,
        })),
        assets: customer.assets.map((asset) => ({
          id: asset.id,
          name: asset.name,
          locationId: asset.customerLocationId,
          assetType: asset.assetType?.name,
        })),
      })),
      serviceCategories: categoryOptions,
      jobTypes: jobTypeOptions,
      statuses,
      technicians: technicianOptions,
    };
  } catch {
    return getDemoJobFormOptions();
  }
}

function applySmartFilter(where: Prisma.WorkOrderWhereInput, smart?: string) {
  switch (smart) {
    case "unassigned":
      where.assignments = { none: {} };
      break;
    case "overdue":
      where.OR = [
        { scheduledStart: { lt: new Date() } },
        { preferredStart: { lt: new Date() } },
      ];
      where.status = { lifecycle: { notIn: ["COMPLETED", "CANCELLED"] } };
      break;
    case "awaiting-parts":
      where.status = { slug: "awaiting-parts" };
      break;
    case "awaiting-quote-approval":
      where.status = { slug: "awaiting-quote-approval" };
      break;
    case "completed-not-invoiced":
      where.status = { lifecycle: "COMPLETED" };
      where.invoices = { none: {} };
      where.paymentStatus = "NOT_INVOICED";
      break;
    case "invoiced-unpaid":
      where.OR = [
        { paymentStatus: { in: ["INVOICED", "PARTIALLY_PAID"] } },
        { invoices: { some: { balanceDue: { gt: 0 } } } },
      ];
      break;
  }
}

function mapJobListRow(job: {
  id: string;
  number: string;
  title: string;
  customerId: string;
  customer: { id: string; displayName: string; phone?: string | null; whatsapp?: string | null };
  customerLocation?: {
    addressLine1: string;
    addressLine2?: string | null;
    city?: string | null;
    parish?: string | null;
    country?: string | null;
  } | null;
  asset?: { name: string } | null;
  serviceCategory?: { name: string } | null;
  jobType?: string | null;
  priority: JobListRow["priority"];
  source: JobSource;
  paymentStatus: WorkOrderPaymentStatus;
  status: {
    name: string;
    slug: string;
    lifecycle: WorkOrderLifecycle;
    color?: string | null;
  };
  scheduledStart?: Date | null;
  scheduledEnd?: Date | null;
  preferredStart?: Date | null;
  preferredEnd?: Date | null;
  assignments: { technicianProfile: { displayName: string } }[];
  quotes: { id: string }[];
  invoices: { id: string; balanceDue: Prisma.Decimal }[];
}): JobListRow {
  const row = {
    id: job.id,
    number: job.number,
    title: job.title,
    customerId: job.customerId,
    customerName: job.customer.displayName,
    customerPhone: job.customer.whatsapp ?? job.customer.phone,
    location: compactAddress(job.customerLocation),
    assetName: job.asset?.name,
    serviceCategory: job.serviceCategory?.name ?? "Uncategorized",
    jobType: job.jobType,
    priority: job.priority,
    statusName: job.status.name,
    statusSlug: job.status.slug,
    statusLifecycle: job.status.lifecycle,
    statusColor: job.status.color,
    scheduledStart: job.scheduledStart,
    scheduledEnd: job.scheduledEnd,
    preferredStart: job.preferredStart,
    preferredEnd: job.preferredEnd,
    assignedTechnicians: job.assignments.map(
      (assignment) => assignment.technicianProfile.displayName,
    ),
    paymentStatus: job.paymentStatus,
    source: job.source,
    hasQuote: job.quotes.length > 0,
    hasInvoice: job.invoices.length > 0,
    balanceDue: job.invoices.reduce(
      (total, invoice) => total + decimalToNumber(invoice.balanceDue),
      0,
    ),
    isOverdue: false,
  };

  return {
    ...row,
    isOverdue: isJobOverdue(row),
  };
}

function mergeStatusOptions(options: WorkOrderStatusOption[]) {
  const seen = new Set<string>();

  return options
    .sort((first, second) => first.sortOrder - second.sortOrder)
    .filter((option) => {
      if (seen.has(option.slug)) {
        return false;
      }

      seen.add(option.slug);
      return true;
    });
}

function mergeServiceCategories(options: ServiceCategoryOption[]) {
  const seen = new Set<string>();

  return options.filter((option) => {
    const key = option.slug || slugify(option.name);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function mergeJobTypes(options: JobTypeOption[]) {
  const seen = new Set<string>();

  return options.filter((option) => {
    const key = option.slug || slugify(option.name);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
