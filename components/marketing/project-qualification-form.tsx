"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  createProjectFormSession,
  submitProjectLead,
} from "@/app/(marketing)/start-a-project/actions";
import {
  budgetOptions,
  companySizeOptions,
  existingSystemOptions,
  projectObjectiveOptions,
  projectTypeOptions,
  qualificationSteps,
  timelineOptions,
} from "@/lib/content/project-qualification";

import styles from "./project-qualification-form.module.css";

type QualificationValues = {
  projectType: string;
  objectives: string[];
  otherObjective: string;
  companyName: string;
  companyWebsite: string;
  industry: string;
  companySize: string;
  location: string;
  challenge: string;
  existingSystems: string[];
  otherSystem: string;
  budgetRange: string;
  timeline: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  consent: boolean;
  companyFax: string;
};

type FieldErrors = Record<string, string>;

const initialValues: QualificationValues = {
  projectType: "",
  objectives: [],
  otherObjective: "",
  companyName: "",
  companyWebsite: "",
  industry: "",
  companySize: "",
  location: "",
  challenge: "",
  existingSystems: [],
  otherSystem: "",
  budgetRange: "",
  timeline: "",
  name: "",
  email: "",
  phone: "",
  role: "",
  consent: false,
  companyFax: "",
};

const stepContent = [
  {
    title: "What are you looking to build?",
    description:
      "Choose the closest fit. The first conversation can refine the shape of the engagement.",
  },
  {
    title: "What are you trying to improve?",
    description:
      "Select every objective that matters. Business outcomes help us understand the system behind the request.",
  },
  {
    title: "Tell us about the business.",
    description:
      "A little operating context helps us evaluate fit, stakeholders, and the likely scale of the work.",
  },
  {
    title: "Tell us about the challenge.",
    description:
      "Describe the current reality in plain language. A polished brief is not required.",
  },
  {
    title: "Existing systems.",
    description:
      "Understanding the current technology helps us see what should remain, connect, or change.",
  },
  {
    title: "Budget / investment range.",
    description:
      "An indicative range helps us recommend an appropriate starting point, scope, and delivery model.",
  },
  {
    title: "Timeline.",
    description:
      "Choose the timing that best reflects the business need today. It does not need to be a fixed launch date.",
  },
  {
    title: "Your contact details.",
    description:
      "Tell us who should be part of the next conversation if the project appears to be a strong fit.",
  },
] as const;

const fieldStep: Record<string, number> = {
  projectType: 0,
  objectives: 1,
  otherObjective: 1,
  companyName: 2,
  companyWebsite: 2,
  industry: 2,
  companySize: 2,
  location: 2,
  challenge: 3,
  existingSystems: 4,
  otherSystem: 4,
  budgetRange: 5,
  timeline: 6,
  name: 7,
  email: 7,
  phone: 7,
  role: 7,
  consent: 7,
};

function trackQualificationEvent(
  event: string,
  properties: Record<string, string | number | boolean> = {},
) {
  const detail = { event, route: "/start-a-project", ...properties };
  window.dispatchEvent(new CustomEvent("trexiti:analytics", { detail }));

  const analyticsWindow = window as Window & {
    dataLayer?: Array<Record<string, unknown>>;
  };
  analyticsWindow.dataLayer?.push(detail);
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <span className={styles.fieldError} id={id} role="alert">
      {message}
    </span>
  );
}

function ChoiceGrid({
  name,
  options,
  selected,
  multiple = false,
  error,
  onChange,
}: {
  name: string;
  options: readonly string[];
  selected: readonly string[];
  multiple?: boolean;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className={styles.choiceGrid}>
      {options.map((option, index) => {
        const checked = selected.includes(option);
        return (
          <label className={styles.choice} key={option}>
            <input
              aria-describedby={error ? `${name}-error` : undefined}
              aria-invalid={Boolean(error)}
              checked={checked}
              name={name}
              onChange={() => onChange(option)}
              type={multiple ? "checkbox" : "radio"}
              value={option}
            />
            <span className={styles.choiceIndex}>
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className={styles.choiceLabel}>{option}</span>
            <span className={styles.choiceControl} aria-hidden="true">
              {multiple ? (checked ? "×" : "+") : checked ? "●" : "○"}
            </span>
          </label>
        );
      })}
    </div>
  );
}

function validateStep(step: number, values: QualificationValues): FieldErrors {
  const errors: FieldErrors = {};

  if (step === 0 && !values.projectType) {
    errors.projectType = "Choose what you are looking to build.";
  }

  if (step === 1) {
    if (values.objectives.length === 0) {
      errors.objectives = "Choose at least one objective.";
    }
    if (values.objectives.includes("Other") && !values.otherObjective.trim()) {
      errors.otherObjective = "Tell us what else you want to improve.";
    }
  }

  if (step === 2) {
    if (values.companyName.trim().length < 2) {
      errors.companyName = "Enter the company name.";
    }
    try {
      const website = new URL(values.companyWebsite);
      if (!/^https?:$/.test(website.protocol)) {
        errors.companyWebsite = "Use a complete http:// or https:// address.";
      }
    } catch {
      errors.companyWebsite = "Enter a complete website address, including https://";
    }
    if (values.industry.trim().length < 2) {
      errors.industry = "Enter the business industry.";
    }
    if (!values.companySize) {
      errors.companySize = "Choose a company size.";
    }
    if (values.location.trim().length < 2) {
      errors.location = "Enter the primary location.";
    }
  }

  if (step === 3 && values.challenge.trim().length < 40) {
    errors.challenge = "Please share a little more about the challenge.";
  }

  if (step === 4) {
    if (values.existingSystems.length === 0) {
      errors.existingSystems = "Choose at least one existing system.";
    }
    if (
      values.existingSystems.includes("Other") &&
      !values.otherSystem.trim()
    ) {
      errors.otherSystem = "Tell us which other system is in use.";
    }
  }

  if (step === 5 && !values.budgetRange) {
    errors.budgetRange = "Choose an investment range.";
  }

  if (step === 6 && !values.timeline) {
    errors.timeline = "Choose a timeline.";
  }

  if (step === 7) {
    if (values.name.trim().length < 2) {
      errors.name = "Enter your name.";
    }
    if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) {
      errors.email = "Enter a valid email address.";
    }
    if (values.phone.trim().length > 40) {
      errors.phone = "Phone number is too long.";
    }
    if (values.role.trim().length < 2) {
      errors.role = "Enter your role.";
    }
    if (!values.consent) {
      errors.consent = "Consent is required before submitting.";
    }
  }

  return errors;
}

function firstErrorField(errors: FieldErrors) {
  return Object.keys(errors)[0];
}

export function ProjectQualificationForm() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<QualificationValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formToken, setFormToken] = useState("");
  const [sessionError, setSessionError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const stepTitleRef = useRef<HTMLHeadingElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const formErrorRef = useRef<HTMLParagraphElement>(null);
  const hasStartedRef = useRef(false);
  const shouldFocusFormErrorRef = useRef(false);
  const attributionRef = useRef({
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
  });

  useEffect(() => {
    let active = true;
    const search = new URLSearchParams(window.location.search);
    attributionRef.current = {
      utmSource: search.get("utm_source")?.slice(0, 120) ?? "",
      utmMedium: search.get("utm_medium")?.slice(0, 120) ?? "",
      utmCampaign: search.get("utm_campaign")?.slice(0, 160) ?? "",
    };

    void createProjectFormSession().then((result) => {
      if (!active) {
        return;
      }
      if (result.ok) {
        setFormToken(result.token);
      } else {
        setSessionError(result.message);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (submitted) {
      successRef.current?.focus();
    }
  }, [submitted]);

  useEffect(() => {
    if (submitError && shouldFocusFormErrorRef.current) {
      formErrorRef.current?.focus();
      shouldFocusFormErrorRef.current = false;
    }
  }, [submitError]);

  useEffect(() => {
    if (submitted) {
      return;
    }
    trackQualificationEvent("project_qualification_step_viewed", {
      step: step + 1,
      step_name: qualificationSteps[step].label,
    });
  }, [step, submitted]);

  function updateValue<Key extends keyof QualificationValues>(
    key: Key,
    value: QualificationValues[Key],
  ) {
    if (!hasStartedRef.current && key !== "companyFax") {
      hasStartedRef.current = true;
      trackQualificationEvent("project_qualification_started", {
        step: step + 1,
      });
    }

    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) {
        return current;
      }
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function toggleMultiValue(
    key: "objectives" | "existingSystems",
    value: string,
  ) {
    const current = values[key];
    updateValue(
      key,
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  function focusField(field?: string) {
    if (!field) {
      return;
    }
    requestAnimationFrame(() => {
      const wrapper = document.querySelector<HTMLElement>(
        `[data-field="${field}"]`,
      );
      const control = wrapper?.querySelector<HTMLElement>(
        "input:not([type='hidden']), select, textarea, button",
      );
      (control ?? wrapper)?.focus();
    });
  }

  function moveToStep(nextStep: number) {
    setErrors({});
    setSubmitError("");
    setStep(nextStep);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => stepTitleRef.current?.focus());
    });
  }

  function continueFromStep() {
    const stepErrors = validateStep(step, values);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      focusField(firstErrorField(stepErrors));
      return;
    }

    trackQualificationEvent("project_qualification_step_completed", {
      step: step + 1,
      step_name: qualificationSteps[step].label,
    });
    moveToStep(Math.min(step + 1, qualificationSteps.length - 1));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (step < qualificationSteps.length - 1) {
      continueFromStep();
      return;
    }

    const stepErrors = validateStep(step, values);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      focusField(firstErrorField(stepErrors));
      return;
    }

    if (!formToken) {
      setSubmitError(
        sessionError ||
          "The secure form session is still preparing. Please wait a moment and try again.",
      );
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    trackQualificationEvent("project_lead_submission_started", {
      project_type: values.projectType,
      budget_range: values.budgetRange,
      timeline: values.timeline,
    });

    try {
      const result = await submitProjectLead({
        ...values,
        ...attributionRef.current,
        formToken,
      });

      if (result.ok) {
        trackQualificationEvent("project_lead_submitted", {
          project_type: values.projectType,
          budget_range: values.budgetRange,
          timeline: values.timeline,
        });
        setSubmitted(true);
        return;
      }

      setSubmitError(result.message);
      trackQualificationEvent("project_lead_submission_failed", {
        has_field_errors: Boolean(result.fieldErrors),
        failure_type: result.fieldErrors ? "validation" : "server",
      });

      if (result.fieldErrors) {
        shouldFocusFormErrorRef.current = false;
        const firstField = firstErrorField(result.fieldErrors);
        const targetStep = fieldStep[firstField];
        setErrors(result.fieldErrors);
        if (typeof targetStep === "number") {
          setStep(targetStep);
        }
        focusField(firstField);
      } else {
        shouldFocusFormErrorRef.current = true;
      }
    } catch {
      shouldFocusFormErrorRef.current = true;
      setSubmitError(
        "The connection was interrupted. Your answers are still here—please try again.",
      );
      trackQualificationEvent("project_lead_submission_failed", {
        has_field_errors: false,
        failure_type: "network",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        className={styles.successPanel}
        ref={successRef}
        role="status"
        tabIndex={-1}
      >
        <span className={styles.successIndex}>08 / 08</span>
        <div className={styles.successMark} aria-hidden="true">
          ✓
        </div>
        <p className={styles.successEyebrow}>Details received</p>
        <h2>Thanks — we&apos;ve received your project details.</h2>
        <p>
          We&apos;ll review the business, the problem and what you&apos;re looking
          to build before the next conversation.
        </p>
        <div className={styles.successFooter}>
          <span>Your submission has been stored securely.</span>
          <Link href="/work">Explore selected work</Link>
        </div>
      </div>
    );
  }

  const currentContent = stepContent[step];

  return (
    <form
      aria-busy={submitting ? "true" : undefined}
      className={styles.form}
      noValidate
      onSubmit={handleSubmit}
    >
      <div className={styles.formTopline}>
        <span>
          Project qualification / {String(step + 1).padStart(2, "0")}
        </span>
        <span>{Math.round(((step + 1) / qualificationSteps.length) * 100)}%</span>
      </div>

      <nav className={styles.progress} aria-label="Project qualification progress">
        <ol>
          {qualificationSteps.map((item, index) => {
            const state = index < step ? "complete" : index === step ? "current" : "upcoming";
            return (
              <li data-state={state} key={item.number}>
                {index <= step ? (
                  <button
                    aria-current={index === step ? "step" : undefined}
                    onClick={() => moveToStep(index)}
                    type="button"
                  >
                    <span>{item.number}</span>
                    <strong>{item.label}</strong>
                  </button>
                ) : (
                  <div aria-hidden="true">
                    <span>{item.number}</span>
                    <strong>{item.label}</strong>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className={styles.stepAnnouncement} aria-live="polite">
        Step {step + 1} of {qualificationSteps.length}: {currentContent.title}
      </div>

      <div className={styles.stepHeader}>
        <span>{qualificationSteps[step].number}</span>
        <div>
          <h2 id={`step-title-${step}`} ref={stepTitleRef} tabIndex={-1}>
            {currentContent.title}
          </h2>
          <p>{currentContent.description}</p>
        </div>
      </div>

      <fieldset
        aria-labelledby={`step-title-${step}`}
        className={styles.stepFields}
        disabled={Boolean(sessionError)}
      >
        <legend className={styles.visuallyHidden}>{currentContent.title}</legend>

        {step === 0 ? (
          <div data-field="projectType" tabIndex={-1}>
            <ChoiceGrid
              error={errors.projectType}
              name="projectType"
              onChange={(value) => updateValue("projectType", value)}
              options={projectTypeOptions}
              selected={values.projectType ? [values.projectType] : []}
            />
            <FieldError id="projectType-error" message={errors.projectType} />
          </div>
        ) : null}

        {step === 1 ? (
          <div data-field="objectives" tabIndex={-1}>
            <ChoiceGrid
              error={errors.objectives}
              multiple
              name="objectives"
              onChange={(value) => toggleMultiValue("objectives", value)}
              options={projectObjectiveOptions}
              selected={values.objectives}
            />
            <FieldError id="objectives-error" message={errors.objectives} />
            {values.objectives.includes("Other") ? (
              <label className={styles.otherField} data-field="otherObjective">
                <span>What else are you trying to improve?</span>
                <input
                  aria-describedby={errors.otherObjective ? "otherObjective-error" : undefined}
                aria-invalid={Boolean(errors.otherObjective)}
                maxLength={240}
                onChange={(event) => updateValue("otherObjective", event.target.value)}
                  placeholder="Describe the objective"
                  value={values.otherObjective}
                />
                <FieldError id="otherObjective-error" message={errors.otherObjective} />
              </label>
            ) : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className={styles.fieldGrid}>
            <label data-field="companyName">
              <span>Company name</span>
              <input
                aria-describedby={errors.companyName ? "companyName-error" : undefined}
                aria-invalid={Boolean(errors.companyName)}
                autoComplete="organization"
                maxLength={160}
                onChange={(event) => updateValue("companyName", event.target.value)}
                value={values.companyName}
              />
              <FieldError id="companyName-error" message={errors.companyName} />
            </label>
            <label data-field="companyWebsite">
              <span>Website</span>
              <input
                aria-describedby={errors.companyWebsite ? "companyWebsite-error" : undefined}
                aria-invalid={Boolean(errors.companyWebsite)}
                autoCapitalize="none"
                autoComplete="url"
                inputMode="url"
                maxLength={240}
                onChange={(event) => updateValue("companyWebsite", event.target.value)}
                placeholder="https://example.com"
                type="url"
                value={values.companyWebsite}
              />
              <FieldError id="companyWebsite-error" message={errors.companyWebsite} />
            </label>
            <label data-field="industry">
              <span>Industry</span>
              <input
                aria-describedby={errors.industry ? "industry-error" : undefined}
                aria-invalid={Boolean(errors.industry)}
                maxLength={120}
                onChange={(event) => updateValue("industry", event.target.value)}
                placeholder="For example: professional services"
                value={values.industry}
              />
              <FieldError id="industry-error" message={errors.industry} />
            </label>
            <label data-field="companySize">
              <span>Company size</span>
              <select
                aria-describedby={errors.companySize ? "companySize-error" : undefined}
                aria-invalid={Boolean(errors.companySize)}
                onChange={(event) => updateValue("companySize", event.target.value)}
                value={values.companySize}
              >
                <option disabled value="">Select company size</option>
                {companySizeOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <FieldError id="companySize-error" message={errors.companySize} />
            </label>
            <label className={styles.fieldWide} data-field="location">
              <span>Primary location</span>
              <input
                aria-describedby={errors.location ? "location-error" : undefined}
                aria-invalid={Boolean(errors.location)}
                autoComplete="country-name"
                maxLength={160}
                onChange={(event) => updateValue("location", event.target.value)}
                placeholder="City / country or service region"
                value={values.location}
              />
              <FieldError id="location-error" message={errors.location} />
            </label>
          </div>
        ) : null}

        {step === 3 ? (
          <label className={styles.challengeField} data-field="challenge">
            <span>
              What isn&apos;t working today, and what would you like to work
              differently?
            </span>
            <textarea
              aria-describedby={`challenge-hint${errors.challenge ? " challenge-error" : ""}`}
              aria-invalid={Boolean(errors.challenge)}
              maxLength={5000}
              onChange={(event) => updateValue("challenge", event.target.value)}
              placeholder="Describe the workflow, customer experience, software, or operational problem as it exists today."
              rows={10}
              value={values.challenge}
            />
            <span className={styles.fieldHint} id="challenge-hint">
              {values.challenge.length.toLocaleString()} / 5,000 characters
            </span>
            <FieldError id="challenge-error" message={errors.challenge} />
          </label>
        ) : null}

        {step === 4 ? (
          <div data-field="existingSystems" tabIndex={-1}>
            <p className={styles.fieldPrompt}>
              What tools does the business currently rely on?
            </p>
            <ChoiceGrid
              error={errors.existingSystems}
              multiple
              name="existingSystems"
              onChange={(value) => toggleMultiValue("existingSystems", value)}
              options={existingSystemOptions}
              selected={values.existingSystems}
            />
            <FieldError id="existingSystems-error" message={errors.existingSystems} />
            {values.existingSystems.includes("Other") ? (
              <label className={styles.otherField} data-field="otherSystem">
                <span>Other tool or system</span>
                <input
                  aria-describedby={errors.otherSystem ? "otherSystem-error" : undefined}
                  aria-invalid={Boolean(errors.otherSystem)}
                  maxLength={240}
                  onChange={(event) => updateValue("otherSystem", event.target.value)}
                  placeholder="Name the tool or describe the system"
                  value={values.otherSystem}
                />
                <FieldError id="otherSystem-error" message={errors.otherSystem} />
              </label>
            ) : null}
          </div>
        ) : null}

        {step === 5 ? (
          <div data-field="budgetRange" tabIndex={-1}>
            <ChoiceGrid
              error={errors.budgetRange}
              name="budgetRange"
              onChange={(value) => updateValue("budgetRange", value)}
              options={budgetOptions}
              selected={values.budgetRange ? [values.budgetRange] : []}
            />
            <FieldError id="budgetRange-error" message={errors.budgetRange} />
          </div>
        ) : null}

        {step === 6 ? (
          <div data-field="timeline" tabIndex={-1}>
            <ChoiceGrid
              error={errors.timeline}
              name="timeline"
              onChange={(value) => updateValue("timeline", value)}
              options={timelineOptions}
              selected={values.timeline ? [values.timeline] : []}
            />
            <FieldError id="timeline-error" message={errors.timeline} />
          </div>
        ) : null}

        {step === 7 ? (
          <div className={styles.fieldGrid}>
            <label data-field="name">
              <span>Name</span>
              <input
                aria-describedby={errors.name ? "name-error" : undefined}
                aria-invalid={Boolean(errors.name)}
                autoComplete="name"
                maxLength={120}
                onChange={(event) => updateValue("name", event.target.value)}
                value={values.name}
              />
              <FieldError id="name-error" message={errors.name} />
            </label>
            <label data-field="email">
              <span>Email</span>
              <input
                aria-describedby={errors.email ? "email-error" : undefined}
                aria-invalid={Boolean(errors.email)}
                autoCapitalize="none"
                autoComplete="email"
                inputMode="email"
                maxLength={254}
                onChange={(event) => updateValue("email", event.target.value)}
                type="email"
                value={values.email}
              />
              <FieldError id="email-error" message={errors.email} />
            </label>
            <label data-field="phone">
              <span>Phone <small>Optional</small></span>
              <input
                aria-describedby={errors.phone ? "phone-error" : undefined}
                aria-invalid={Boolean(errors.phone)}
                autoComplete="tel"
                inputMode="tel"
                maxLength={40}
                onChange={(event) => updateValue("phone", event.target.value)}
                type="tel"
                value={values.phone}
              />
              <FieldError id="phone-error" message={errors.phone} />
            </label>
            <label data-field="role">
              <span>Role</span>
              <input
                aria-describedby={errors.role ? "role-error" : undefined}
                aria-invalid={Boolean(errors.role)}
                autoComplete="organization-title"
                maxLength={120}
                onChange={(event) => updateValue("role", event.target.value)}
                placeholder="For example: Founder or Operations Director"
                value={values.role}
              />
              <FieldError id="role-error" message={errors.role} />
            </label>
            <label className={styles.consentField} data-field="consent">
              <input
                aria-describedby={errors.consent ? "consent-error" : undefined}
                aria-invalid={Boolean(errors.consent)}
                checked={values.consent}
                onChange={(event) => updateValue("consent", event.target.checked)}
                type="checkbox"
              />
              <span aria-hidden="true">{values.consent ? "✓" : ""}</span>
              <strong>
                I consent to Trexiti using these details to assess and respond
                to this project enquiry.
              </strong>
              <FieldError id="consent-error" message={errors.consent} />
            </label>
          </div>
        ) : null}

        <div className={styles.honeypot} aria-hidden="true">
          <input
            autoComplete="off"
            name="companyFax"
            onChange={(event) => updateValue("companyFax", event.target.value)}
            tabIndex={-1}
            value={values.companyFax}
          />
        </div>
      </fieldset>

      {sessionError ? (
        <p className={styles.formError} role="alert">
          {sessionError}
        </p>
      ) : null}
      {submitError ? (
        <p
          className={styles.formError}
          ref={formErrorRef}
          role="alert"
          tabIndex={-1}
        >
          {submitError}
        </p>
      ) : null}

      <div className={styles.formActions}>
        {step > 0 ? (
          <button
            className={styles.backButton}
            disabled={submitting}
            onClick={() => moveToStep(step - 1)}
            type="button"
          >
            <span aria-hidden="true">←</span>
            Back
          </button>
        ) : (
          <span />
        )}
        <button
          className={styles.nextButton}
          disabled={submitting || !formToken}
          type="submit"
        >
          <span>
            {sessionError
              ? "Form unavailable"
              : !formToken
                ? "Preparing secure form…"
                : step === qualificationSteps.length - 1
              ? submitting
                ? "Sending securely…"
                : "Send project details"
              : "Continue"}
          </span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  );
}
