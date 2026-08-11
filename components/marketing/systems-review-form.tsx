"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";

import {
  createProjectFormSession,
  submitSystemsReviewLead,
} from "@/app/(marketing)/start-a-project/actions";
import {
  companyStageOptions,
  preferredContactMethodOptions,
} from "@/lib/content/project-qualification";
import { trackMarketingEvent } from "@/lib/marketing/analytics";
import { getLeadAttribution } from "@/lib/marketing/analytics-client";

import styles from "./systems-review-form.module.css";

type FieldErrors = Record<string, string>;

let reviewFormSessionRequest: ReturnType<typeof createProjectFormSession> | null =
  null;

function getReviewFormSession() {
  reviewFormSessionRequest ??= createProjectFormSession();
  return reviewFormSessionRequest;
}

function ErrorMessage({ field, errors }: { field: string; errors: FieldErrors }) {
  const message = errors[field];
  if (!message) return null;
  return (
    <span className={styles.error} id={`${field}-error`} role="alert">
      {message}
    </span>
  );
}

export function SystemsReviewForm() {
  const [formToken, setFormToken] = useState("");
  const [sessionError, setSessionError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const startedRef = useRef(false);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    void getReviewFormSession().then((result) => {
      if (!active) return;
      if (result.ok) setFormToken(result.token);
      else setSessionError(result.message);
    });
    trackMarketingEvent("systems_review_view", "/systems-review");
    return () => {
      active = false;
    };
  }, []);

  function markStarted() {
    if (startedRef.current) return;
    startedRef.current = true;
    trackMarketingEvent("systems_review_form_started", "/systems-review");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formToken || submitting) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const context = getLeadAttribution();
    const input = {
      formToken,
      companyFax: String(formData.get("companyFax") ?? ""),
      companyName: String(formData.get("companyName") ?? ""),
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      role: String(formData.get("role") ?? ""),
      companyWebsite: String(formData.get("companyWebsite") ?? ""),
      workflowProblem: String(formData.get("workflowProblem") ?? ""),
      currentTools: String(formData.get("currentTools") ?? ""),
      desiredOutcome: String(formData.get("desiredOutcome") ?? ""),
      companyStage: String(formData.get("companyStage") ?? ""),
      preferredContactMethod: String(
        formData.get("preferredContactMethod") ?? "",
      ),
      consent: formData.get("consent") === "on",
      ...context,
    };

    setSubmitting(true);
    setSubmitError("");
    setErrors({});
    const result = await submitSystemsReviewLead(input);
    setSubmitting(false);

    if (!result.ok) {
      setSubmitError(result.message);
      setErrors(result.fieldErrors ?? {});
      const firstField = Object.keys(result.fieldErrors ?? {})[0];
      if (firstField) {
        requestAnimationFrame(() =>
          form
            .querySelector<HTMLElement>(`[name="${firstField}"]`)
            ?.focus(),
        );
      }
      return;
    }

    trackMarketingEvent("systems_review_submitted", "/systems-review", {
      company_stage: input.companyStage,
    });
    setSubmitted(true);
    requestAnimationFrame(() => successRef.current?.focus());
  }

  if (submitted) {
    return (
      <div className={styles.success} ref={successRef} tabIndex={-1}>
        <span>Systems Review enquiry / Received</span>
        <h2>The operating context has been received.</h2>
        <p>
          Trexiti will review the workflow, the current tools and the outcome
          before recommending a useful conversation or review boundary.
        </p>
      </div>
    );
  }

  return (
    <form className={styles.form} onChange={markStarted} onSubmit={handleSubmit}>
      <div className={styles.formHeading}>
        <div>
          <span>Review enquiry / Short form</span>
          <h2>What should work better?</h2>
        </div>
        <p>
          Share one workflow or a wider operating area. This is an enquiry for
          a scoped review, not a promise of a free audit.
        </p>
      </div>

      {sessionError || submitError ? (
        <p className={styles.formError} role="alert">
          {sessionError || submitError}
        </p>
      ) : null}

      <input
        aria-hidden="true"
        autoComplete="off"
        className={styles.honeypot}
        name="companyFax"
        tabIndex={-1}
      />

      <div className={styles.fieldGrid}>
        <label>
          <span>Company</span>
          <input
            aria-describedby={errors.companyName ? "companyName-error" : undefined}
            aria-invalid={Boolean(errors.companyName)}
            autoComplete="organization"
            name="companyName"
            required
          />
          <ErrorMessage errors={errors} field="companyName" />
        </label>
        <label>
          <span>Your name</span>
          <input
            aria-describedby={errors.name ? "name-error" : undefined}
            aria-invalid={Boolean(errors.name)}
            autoComplete="name"
            name="name"
            required
          />
          <ErrorMessage errors={errors} field="name" />
        </label>
        <label>
          <span>Work email</span>
          <input
            aria-describedby={errors.email ? "email-error" : undefined}
            aria-invalid={Boolean(errors.email)}
            autoComplete="email"
            name="email"
            required
            type="email"
          />
          <ErrorMessage errors={errors} field="email" />
        </label>
        <label>
          <span>Role</span>
          <input
            aria-describedby={errors.role ? "role-error" : undefined}
            aria-invalid={Boolean(errors.role)}
            autoComplete="organization-title"
            name="role"
            required
          />
          <ErrorMessage errors={errors} field="role" />
        </label>
        <label>
          <span>Website <small>Optional</small></span>
          <input
            aria-describedby={
              errors.companyWebsite ? "companyWebsite-error" : undefined
            }
            aria-invalid={Boolean(errors.companyWebsite)}
            autoComplete="url"
            name="companyWebsite"
            placeholder="https://"
            type="url"
          />
          <ErrorMessage errors={errors} field="companyWebsite" />
        </label>
        <label>
          <span>Company stage</span>
          <select
            aria-describedby={
              errors.companyStage ? "companyStage-error" : undefined
            }
            aria-invalid={Boolean(errors.companyStage)}
            defaultValue=""
            name="companyStage"
            required
          >
            <option disabled value="">Choose the closest stage</option>
            {companyStageOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <ErrorMessage errors={errors} field="companyStage" />
        </label>
        <label className={styles.wideField}>
          <span>Workflow or problem</span>
          <textarea
            aria-describedby={
              errors.workflowProblem ? "workflowProblem-error" : undefined
            }
            aria-invalid={Boolean(errors.workflowProblem)}
            name="workflowProblem"
            placeholder="Where does work, information, ownership or a decision become difficult?"
            required
            rows={5}
          />
          <ErrorMessage errors={errors} field="workflowProblem" />
        </label>
        <label className={styles.wideField}>
          <span>Current tools</span>
          <textarea
            aria-describedby={
              errors.currentTools ? "currentTools-error" : undefined
            }
            aria-invalid={Boolean(errors.currentTools)}
            name="currentTools"
            placeholder="For example: spreadsheet, WhatsApp, CRM, accounting software—or not sure."
            required
            rows={3}
          />
          <ErrorMessage errors={errors} field="currentTools" />
        </label>
        <label className={styles.wideField}>
          <span>Desired outcome</span>
          <textarea
            aria-describedby={
              errors.desiredOutcome ? "desiredOutcome-error" : undefined
            }
            aria-invalid={Boolean(errors.desiredOutcome)}
            name="desiredOutcome"
            placeholder="What would be clearer, faster, more reliable or easier to see?"
            required
            rows={3}
          />
          <ErrorMessage errors={errors} field="desiredOutcome" />
        </label>
      </div>

      <fieldset className={styles.contactMethod}>
        <legend>Preferred contact method</legend>
        {preferredContactMethodOptions.map((option) => (
          <label key={option}>
            <input name="preferredContactMethod" required type="radio" value={option} />
            <span>{option}</span>
          </label>
        ))}
        <ErrorMessage errors={errors} field="preferredContactMethod" />
      </fieldset>

      <label className={styles.consent}>
        <input name="consent" required type="checkbox" />
        <span aria-hidden="true">✓</span>
        <strong>
          I consent to Trexiti storing these details and contacting me about
          this Systems Review enquiry.
        </strong>
        <ErrorMessage errors={errors} field="consent" />
      </label>
      <p className={styles.privacyNote}>
        See the <Link href="/privacy">privacy notice</Link> for storage,
        attribution and analytics choices.
      </p>

      <div className={styles.submitRow}>
        <p>
          Trexiti reviews fit and scope before proposing an engagement. Not
          every enquiry results in a review or free audit.
        </p>
        <button disabled={!formToken || submitting || Boolean(sessionError)} type="submit">
          <span>{submitting ? "Sending…" : "Submit review enquiry"}</span>
          <span aria-hidden="true">↗</span>
        </button>
      </div>
    </form>
  );
}
