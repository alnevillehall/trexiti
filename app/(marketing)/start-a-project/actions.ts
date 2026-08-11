"use server";

import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import { cookies, headers } from "next/headers";

import { prisma } from "@/lib/prisma";
import { projectLeadSubmissionSchema } from "@/lib/validation/project-lead";

const FORM_COOKIE = "trexiti_project_form";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 2;
const MINIMUM_COMPLETION_MS = 4_000;
const RATE_WINDOW_MS = 60 * 60 * 1_000;
const RATE_LIMIT = 5;

export type ProjectFormSessionResult =
  | { ok: true; token: string }
  | { ok: false; message: string };

export type ProjectLeadActionResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string>;
    };

function getFormSecret() {
  const configuredSecret = process.env.PROJECT_LEAD_FORM_SECRET?.trim();

  if (configuredSecret && configuredSecret.length >= 32) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV !== "production") {
    return "trexiti-local-project-form-secret-2026";
  }

  throw new Error("PROJECT_LEAD_FORM_SECRET is not configured.");
}

function signTokenPayload(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function createFormToken(secret: string) {
  const issuedAt = Date.now().toString(36);
  const nonce = randomBytes(18).toString("base64url");
  const payload = `${issuedAt}.${nonce}`;
  return `${payload}.${signTokenPayload(payload, secret)}`;
}

function verifyFormToken(token: string, secret: string) {
  const [issuedAt, nonce, suppliedSignature, extra] = token.split(".");

  if (!issuedAt || !nonce || !suppliedSignature || extra) {
    return { valid: false, age: 0 };
  }

  const issuedAtMs = Number.parseInt(issuedAt, 36);
  const payload = `${issuedAt}.${nonce}`;
  const expectedSignature = signTokenPayload(payload, secret);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  const signaturesMatch =
    supplied.length === expected.length && timingSafeEqual(supplied, expected);

  return {
    valid: signaturesMatch && Number.isFinite(issuedAtMs),
    age: Date.now() - issuedAtMs,
  };
}

function isSameOrigin(origin: string | null, host: string | null) {
  if (!origin || !host) {
    return false;
  }

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function createRequestFingerprint(
  ipAddress: string,
  userAgent: string,
  secret: string,
) {
  return createHash("sha256")
    .update(`${ipAddress}|${userAgent}|${secret}`)
    .digest("hex");
}

async function consumeRateLimit(fingerprint: string) {
  const now = new Date();
  const windowCutoff = new Date(now.getTime() - RATE_WINDOW_MS);

  return prisma.$transaction(async (transaction) => {
    const current = await transaction.projectLeadRateLimit.findUnique({
      where: { fingerprint },
    });

    if (!current) {
      await transaction.projectLeadRateLimit.create({
        data: { fingerprint },
      });
      return true;
    }

    if (current.blockedUntil && current.blockedUntil > now) {
      return false;
    }

    if (current.windowStartedAt < windowCutoff) {
      await transaction.projectLeadRateLimit.update({
        where: { fingerprint },
        data: {
          windowStartedAt: now,
          requestCount: 1,
          blockedUntil: null,
        },
      });
      return true;
    }

    if (current.requestCount >= RATE_LIMIT) {
      await transaction.projectLeadRateLimit.update({
        where: { fingerprint },
        data: { blockedUntil: new Date(now.getTime() + RATE_WINDOW_MS) },
      });
      return false;
    }

    await transaction.projectLeadRateLimit.update({
      where: { fingerprint },
      data: { requestCount: { increment: 1 } },
    });
    return true;
  });
}

function firstFieldErrors(
  issues: readonly { path: PropertyKey[]; message: string }[],
) {
  const errors: Record<string, string> = {};

  for (const issue of issues) {
    const field = String(issue.path[0] ?? "form");
    errors[field] ??= issue.message;
  }

  return errors;
}

export async function createProjectFormSession(): Promise<ProjectFormSessionResult> {
  try {
    const secret = getFormSecret();
    const token = createFormToken(secret);
    const cookieStore = await cookies();

    cookieStore.set(FORM_COOKIE, token, {
      httpOnly: true,
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    return { ok: true, token };
  } catch {
    return {
      ok: false,
      message:
        "The project form could not be prepared. Please refresh and try again.",
    };
  }
}

export async function submitProjectLead(
  input: unknown,
): Promise<ProjectLeadActionResult> {
  const rawInput =
    typeof input === "object" && input !== null
      ? (input as Record<string, unknown>)
      : {};

  if (typeof rawInput.companyFax === "string" && rawInput.companyFax.trim()) {
    return { ok: true };
  }

  try {
    const secret = getFormSecret();
    const requestHeaders = await headers();
    const host =
      requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

    if (!isSameOrigin(requestHeaders.get("origin"), host)) {
      return {
        ok: false,
        message: "This submission could not be verified. Please refresh and try again.",
      };
    }

    const cookieStore = await cookies();
    const cookieToken = cookieStore.get(FORM_COOKIE)?.value;
    const suppliedToken =
      typeof rawInput.formToken === "string" ? rawInput.formToken : "";

    if (!cookieToken || !suppliedToken || cookieToken !== suppliedToken) {
      return {
        ok: false,
        message: "Your secure form session expired. Refresh the page and try again.",
      };
    }

    const tokenState = verifyFormToken(suppliedToken, secret);
    if (
      !tokenState.valid ||
      tokenState.age < MINIMUM_COMPLETION_MS ||
      tokenState.age > SESSION_MAX_AGE_SECONDS * 1_000
    ) {
      return {
        ok: false,
        message: "This submission could not be verified. Please review it and try again.",
      };
    }

    const forwardedFor = requestHeaders.get("x-forwarded-for") ?? "unknown";
    const ipAddress = forwardedFor.split(",")[0]?.trim() || "unknown";
    const userAgent = requestHeaders.get("user-agent")?.slice(0, 240) ?? "unknown";
    const fingerprint = createRequestFingerprint(ipAddress, userAgent, secret);
    const withinLimit = await consumeRateLimit(fingerprint);

    if (!withinLimit) {
      return {
        ok: false,
        message:
          "This form has received several submissions. Please wait before trying again.",
      };
    }

    const parsed = projectLeadSubmissionSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        ok: false,
        message: "Please review the highlighted details before submitting.",
        fieldErrors: firstFieldErrors(parsed.error.issues),
      };
    }

    const value = parsed.data;
    const email = value.email.toLowerCase();
    const recentDuplicate = await prisma.projectLead.findFirst({
      where: {
        email,
        companyName: value.companyName,
        projectType: value.projectType,
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1_000) },
      },
      select: { id: true },
    });

    if (!recentDuplicate) {
      await prisma.projectLead.create({
        data: {
          name: value.name,
          email,
          phone: value.phone || null,
          role: value.role,
          companyName: value.companyName,
          companyWebsite: value.companyWebsite,
          industry: value.industry,
          companySize: value.companySize,
          location: value.location,
          projectType: value.projectType,
          objectives: value.objectives.map((objective) =>
            objective === "Other"
              ? `Other: ${value.otherObjective}`
              : objective,
          ),
          challenge: value.challenge,
          existingSystems: value.existingSystems.map((system) =>
            system === "Other" ? `Other: ${value.otherSystem}` : system,
          ),
          budgetRange: value.budgetRange,
          timeline: value.timeline,
          consentedAt: new Date(),
          source: "trexiti_website",
          utmSource: value.utmSource || null,
          utmMedium: value.utmMedium || null,
          utmCampaign: value.utmCampaign || null,
          requestFingerprint: fingerprint,
        },
      });
    }

    cookieStore.delete(FORM_COOKIE);
    return { ok: true };
  } catch (error) {
    console.error(
      "Project lead submission failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return {
      ok: false,
      message:
        "We could not save your project details. Your answers are still here—please try again.",
    };
  }
}
