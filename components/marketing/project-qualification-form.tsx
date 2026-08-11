"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

import {
  createProjectFormSession,
  submitProjectLead,
} from "@/app/(marketing)/start-a-project/actions";
import {
  companyStageOptions,
  engagementShapeDescriptions,
  engagementShapeOptions,
  existingSystemOptions,
  investmentContextOptions,
  preferredContactMethodOptions,
  projectObjectiveOptions,
  projectTypeOptions,
  qualificationSteps,
  timelineOptions,
} from "@/lib/content/project-qualification";
import { trackMarketingEvent } from "@/lib/marketing/analytics";
import { getLeadAttribution } from "@/lib/marketing/analytics-client";
import type {
  MarketingEventName,
  MarketingEventProperties,
} from "@/lib/marketing/analytics-schema";

import styles from "./project-qualification-form.module.css";

type QualificationValues = {
  projectType: string;
  objectives: string[];
  otherObjective: string;
  companyName: string;
  companyWebsite: string;
  industry: string;
  companyStage: string;
  teamSize: string;
  location: string;
  customerServiceArea: string;
  currentState: string;
  friction: string;
  existingSystems: string[];
  otherSystem: string;
  importantTools: string;
  engagementShape: string;
  investmentContext: string;
  investmentNotes: string;
  timeline: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  preferredContactMethod: string;
  consent: boolean;
  companyFax: string;
};

type FieldErrors = Record<string, string>;

let formSessionRequest: ReturnType<typeof createProjectFormSession> | null =
  null;

function getProjectFormSession() {
  formSessionRequest ??= createProjectFormSession();
  return formSessionRequest;
}

const initialValues: QualificationValues = {
  projectType: "",
  objectives: [],
  otherObjective: "",
  companyName: "",
  companyWebsite: "",
  industry: "",
  companyStage: "",
  teamSize: "",
  location: "",
  customerServiceArea: "",
  currentState: "",
  friction: "",
  existingSystems: [],
  otherSystem: "",
  importantTools: "",
  engagementShape: "",
  investmentContext: "",
  investmentNotes: "",
  timeline: "",
  name: "",
  email: "",
  phone: "",
  role: "",
  preferredContactMethod: "",
  consent: false,
  companyFax: "",
};

const stepContent = [
  {
    title: "What are you looking to improve, replace or build?",
    description:
      "Choose the closest fit. Discovery can refine the right solution and boundary.",
  },
  {
    title: "What should the work make better?",
    description:
      "Select every objective that matters. Outcomes give the project its business context.",
  },
  {
    title: "Tell us about the business.",
    description:
      "Stage and scale provide operating context, not a pass-or-fail test for project fit.",
  },
  {
    title: "How does it work today?",
    description:
      "A plain-language walkthrough is useful. A polished technical brief is not required.",
  },
  {
    title: "Where does the friction appear?",
    description:
      "Focus on the practical effect for customers, staff, decisions, or delivery.",
  },
  {
    title: "Which systems are involved?",
    description:
      "Knowing the current tools helps us see what should remain, connect, or change.",
  },
  {
    title: "Which starting point feels closest?",
    description:
      "A focused build and a connected system can both be right—the problem should determine the shape.",
  },
  {
    title: "Is there an investment range or constraint we should design around?",
    description:
      "This is context for shaping the work, not a public minimum or a fixed price menu.",
  },
  {
    title: "When would the work be useful?",
    description:
      "Choose the timing that best reflects the business need today. It does not need to be a fixed launch date.",
  },
  {
    title: "Who should be part of the next conversation?",
    description:
      "Share the best work contact and how you would prefer Trexiti to reach you.",
  },
] as const;

const fieldStep: Record<string, number> = {
  projectType: 0,
  objectives: 1,
  otherObjective: 1,
  companyName: 2,
  companyWebsite: 2,
  industry: 2,
  companyStage: 2,
  teamSize: 2,
  location: 2,
  customerServiceArea: 2,
  currentState: 3,
  friction: 4,
  existingSystems: 5,
  otherSystem: 5,
  importantTools: 5,
  engagementShape: 6,
  investmentContext: 7,
  investmentNotes: 7,
  timeline: 8,
  name: 9,
  email: 9,
  phone: 9,
  role: 9,
  preferredContactMethod: 9,
  consent: 9,
};

function trackQualificationEvent<EventName extends MarketingEventName>(
  event: EventName,
  properties?: MarketingEventProperties<EventName>,
) {
  trackMarketingEvent(
    event,
    "/start-a-project",
    (properties ?? {}) as MarketingEventProperties<EventName>,
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

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
  descriptions,
  error,
  onChange,
}: {
  name: string;
  options: readonly string[];
  selected: readonly string[];
  multiple?: boolean;
  descriptions?: Record<string, string>;
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
            <span className={styles.choiceCopy}>
              <strong className={styles.choiceLabel}>{option}</strong>
              {descriptions?.[option] ? (
                <small className={styles.choiceDescription}>
                  {descriptions[option]}
                </small>
              ) : null}
            </span>
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
    errors.projectType = "Choose what should change.";
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
    if (values.companyWebsite.trim()) {
      try {
        const website = new URL(values.companyWebsite);
        if (!/^https?:$/.test(website.protocol)) {
          errors.companyWebsite = "Use a complete http:// or https:// address.";
        }
      } catch {
        errors.companyWebsite = "Enter a complete website address, including https://";
      }
    }
    if (values.industry.trim().length < 2) {
      errors.industry = "Enter the business industry.";
    }
    if (!values.companyStage) {
      errors.companyStage = "Choose the company stage.";
    }
    if (values.teamSize.trim().length > 80) {
      errors.teamSize = "Team size is too long.";
    }
    if (values.location.trim().length < 2) {
      errors.location = "Enter the primary location.";
    }
    if (values.customerServiceArea.trim().length < 2) {
      errors.customerServiceArea = "Tell us where customers are served.";
    }
  }

  if (step === 3 && values.currentState.trim().length < 40) {
    errors.currentState = "Please share a little more about how this works today.";
  }

  if (step === 4 && values.friction.trim().length < 40) {
    errors.friction = "Please share a little more about where the friction appears.";
  }

  if (step === 5) {
    if (values.existingSystems.length === 0) {
      errors.existingSystems = "Choose at least one current system.";
    }
    if (values.existingSystems.includes("Other") && !values.otherSystem.trim()) {
      errors.otherSystem = "Tell us which other system is in use.";
    }
  }

  if (step === 6 && !values.engagementShape) {
    errors.engagementShape = "Choose the closest engagement boundary.";
  }

  if (step === 7 && !values.investmentContext) {
    errors.investmentContext = "Choose the closest investment context.";
  }

  if (step === 8 && !values.timeline) {
    errors.timeline = "Choose a timing option.";
  }

  if (step === 9) {
    if (values.name.trim().length < 2) errors.name = "Enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) {
      errors.email = "Enter a valid work email address.";
    }
    if (values.phone.trim().length > 40) {
      errors.phone = "Phone number is too long.";
    }
    if (values.role.trim().length < 2) errors.role = "Enter your role.";
    if (!values.preferredContactMethod) {
      errors.preferredContactMethod = "Choose a preferred contact method.";
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
  const completedStepsRef = useRef(new Set<number>());
  const shouldFocusFormErrorRef = useRef(false);

  useEffect(() => {
    let active = true;
    getLeadAttribution();
    trackQualificationEvent("project_form_view");

    void getProjectFormSession().then((result) => {
      if (!active) return;
      if (result.ok) {
        setFormToken(result.token);
      } else {
        setSessionError(result.message);
        trackQualificationEvent("project_form_error", {
          error_type: "session",
        });
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (submitted) successRef.current?.focus();
  }, [submitted]);

  useEffect(() => {
    if (submitError && shouldFocusFormErrorRef.current) {
      formErrorRef.current?.focus();
      shouldFocusFormErrorRef.current = false;
    }
  }, [submitError]);

  function updateValue<Key extends keyof QualificationValues>(
    key: Key,
    value: QualificationValues[Key],
  ) {
    if (!hasStartedRef.current && key !== "companyFax") {
      hasStartedRef.current = true;
      trackQualificationEvent("project_form_started", { step: step + 1 });
    }

    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
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
    if (!field) return;
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

  function reportValidationError(stepErrors: FieldErrors) {
    trackQualificationEvent("project_form_error", {
      error_type: "validation",
      error_count: Object.keys(stepErrors).length,
      step: step + 1,
    });
  }

  function markStepComplete(stepIndex: number) {
    if (completedStepsRef.current.has(stepIndex)) return;
    completedStepsRef.current.add(stepIndex);
    trackQualificationEvent("project_form_step_completed", {
      step: stepIndex + 1,
      step_name: qualificationSteps[stepIndex].label,
    });
  }

  function continueFromStep() {
    const stepErrors = validateStep(step, values);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      reportValidationError(stepErrors);
      focusField(firstErrorField(stepErrors));
      return;
    }

    markStepComplete(step);
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
      reportValidationError(stepErrors);
      focusField(firstErrorField(stepErrors));
      return;
    }

    if (!formToken) {
      shouldFocusFormErrorRef.current = true;
      setSubmitError(
        sessionError ||
          "The secure form session is still preparing. Please wait a moment and try again.",
      );
      trackQualificationEvent("project_form_error", {
        error_type: "session",
      });
      return;
    }

    markStepComplete(step);
    setSubmitting(true);
    setSubmitError("");

    try {
      const result = await submitProjectLead({
        ...values,
        ...getLeadAttribution(),
        formToken,
      });

      if (result.ok) {
        trackQualificationEvent("project_form_submitted", {
          engagement_shape: values.engagementShape,
          investment_context: values.investmentContext,
          project_type: values.projectType,
          timeline: values.timeline,
        });
        setSubmitted(true);
        return;
      }

      setSubmitError(result.message);
      trackQualificationEvent("project_form_error", {
        error_type: result.fieldErrors ? "server_validation" : "server",
        step: step + 1,
      });

      if (result.fieldErrors) {
        shouldFocusFormErrorRef.current = false;
        const firstField = firstErrorField(result.fieldErrors);
        const targetStep = fieldStep[firstField];
        setErrors(result.fieldErrors);
        if (typeof targetStep === "number") setStep(targetStep);
        focusField(firstField);
      } else {
        shouldFocusFormErrorRef.current = true;
      }
    } catch {
      shouldFocusFormErrorRef.current = true;
      setSubmitError(
        "The connection was interrupted. Your answers are still here—please try again.",
      );
      trackQualificationEvent("project_form_error", {
        error_type: "network",
        step: step + 1,
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
        <span className={styles.successIndex}>10 / 10</span>
        <div className={styles.successMark} aria-hidden="true">
          ✓
        </div>
        <p className={styles.successEyebrow}>Context received</p>
        <h2>Thanks — the context has been received.</h2>
        <p>
          Trexiti will review the business, the current workflow and the outcome
          you want before recommending a sensible next step.
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
        <span>Business context / {String(step + 1).padStart(2, "0")}</span>
        <span>{Math.round(((step + 1) / qualificationSteps.length) * 100)}%</span>
      </div>

      <nav className={styles.progress} aria-label="Project intake progress">
        <ol>
          {qualificationSteps.map((item, index) => {
            const state =
              index < step ? "complete" : index === step ? "current" : "upcoming";
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
              <span>Website <small>Optional</small></span>
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
            <label data-field="companyStage">
              <span>Company stage</span>
              <select
                aria-describedby={errors.companyStage ? "companyStage-error" : undefined}
                aria-invalid={Boolean(errors.companyStage)}
                onChange={(event) => updateValue("companyStage", event.target.value)}
                value={values.companyStage}
              >
                <option disabled value="">Select company stage</option>
                {companyStageOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <FieldError id="companyStage-error" message={errors.companyStage} />
            </label>
            <label data-field="teamSize">
              <span>Approximate team size <small>Optional</small></span>
              <input
                aria-describedby={errors.teamSize ? "teamSize-error" : undefined}
                aria-invalid={Boolean(errors.teamSize)}
                inputMode="numeric"
                maxLength={80}
                onChange={(event) => updateValue("teamSize", event.target.value)}
                placeholder="For example: 12 or 50–75"
                value={values.teamSize}
              />
              <FieldError id="teamSize-error" message={errors.teamSize} />
            </label>
            <label data-field="location">
              <span>Primary location</span>
              <input
                aria-describedby={errors.location ? "location-error" : undefined}
                aria-invalid={Boolean(errors.location)}
                autoComplete="country-name"
                maxLength={160}
                onChange={(event) => updateValue("location", event.target.value)}
                placeholder="City / country"
                value={values.location}
              />
              <FieldError id="location-error" message={errors.location} />
            </label>
            <label className={styles.fieldWide} data-field="customerServiceArea">
              <span>Where customers are served</span>
              <input
                aria-describedby={errors.customerServiceArea ? "customerServiceArea-error" : undefined}
                aria-invalid={Boolean(errors.customerServiceArea)}
                maxLength={240}
                onChange={(event) => updateValue("customerServiceArea", event.target.value)}
                placeholder="For example: Jamaica, the Caribbean, or internationally"
                value={values.customerServiceArea}
              />
              <FieldError id="customerServiceArea-error" message={errors.customerServiceArea} />
            </label>
          </div>
        ) : null}

        {step === 3 ? (
          <label className={styles.challengeField} data-field="currentState">
            <span>
              Walk us through how this works today. Where does the request begin,
              who handles it, and which tools are involved?
            </span>
            <textarea
              aria-describedby={`currentState-hint${errors.currentState ? " currentState-error" : ""}`}
              aria-invalid={Boolean(errors.currentState)}
              maxLength={5000}
              onChange={(event) => updateValue("currentState", event.target.value)}
              placeholder="Describe the current workflow from beginning to end."
              rows={10}
              value={values.currentState}
            />
            <span className={styles.fieldHint} id="currentState-hint">
              {values.currentState.length.toLocaleString()} / 5,000 characters
            </span>
            <FieldError id="currentState-error" message={errors.currentState} />
          </label>
        ) : null}

        {step === 4 ? (
          <label className={styles.challengeField} data-field="friction">
            <span>
              What is slow, unclear, repetitive, difficult to track or frustrating
              for customers or staff?
            </span>
            <textarea
              aria-describedby={`friction-hint${errors.friction ? " friction-error" : ""}`}
              aria-invalid={Boolean(errors.friction)}
              maxLength={5000}
              onChange={(event) => updateValue("friction", event.target.value)}
              placeholder="Describe where time, clarity, continuity, or customer experience breaks down."
              rows={10}
              value={values.friction}
            />
            <span className={styles.fieldHint} id="friction-hint">
              {values.friction.length.toLocaleString()} / 5,000 characters
            </span>
            <FieldError id="friction-error" message={errors.friction} />
          </label>
        ) : null}

        {step === 5 ? (
          <div data-field="existingSystems" tabIndex={-1}>
            <p className={styles.fieldPrompt}>What tools does the business currently rely on?</p>
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
            <label className={styles.otherField} data-field="importantTools">
              <span>Name any important tools that should remain connected <small>Optional</small></span>
              <input
                maxLength={1000}
                onChange={(event) => updateValue("importantTools", event.target.value)}
                placeholder="For example: HubSpot, QuickBooks, or an internal platform"
                value={values.importantTools}
              />
            </label>
          </div>
        ) : null}

        {step === 6 ? (
          <div data-field="engagementShape" tabIndex={-1}>
            <ChoiceGrid
              descriptions={engagementShapeDescriptions}
              error={errors.engagementShape}
              name="engagementShape"
              onChange={(value) => {
                updateValue("engagementShape", value);
                trackQualificationEvent("engagement_shape_selected", {
                  engagement_shape: value,
                });
              }}
              options={engagementShapeOptions}
              selected={values.engagementShape ? [values.engagementShape] : []}
            />
            <FieldError id="engagementShape-error" message={errors.engagementShape} />
          </div>
        ) : null}

        {step === 7 ? (
          <div data-field="investmentContext" tabIndex={-1}>
            <ChoiceGrid
              error={errors.investmentContext}
              name="investmentContext"
              onChange={(value) => updateValue("investmentContext", value)}
              options={investmentContextOptions}
              selected={values.investmentContext ? [values.investmentContext] : []}
            />
            <FieldError id="investmentContext-error" message={errors.investmentContext} />
            {values.investmentContext === "I have a defined range" ? (
              <label className={styles.otherField} data-field="investmentNotes">
                <span>Defined range or constraint <small>Optional</small></span>
                <input
                  maxLength={240}
                  onChange={(event) => updateValue("investmentNotes", event.target.value)}
                  placeholder="Share the range or constraint in your own words"
                  value={values.investmentNotes}
                />
              </label>
            ) : null}
          </div>
        ) : null}

        {step === 8 ? (
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

        {step === 9 ? (
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
              <span>Work email</span>
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
              <span>Phone / WhatsApp <small>Optional</small></span>
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
            <div className={styles.fieldWide} data-field="preferredContactMethod" tabIndex={-1}>
              <p className={styles.fieldPrompt}>Preferred contact method</p>
              <ChoiceGrid
                error={errors.preferredContactMethod}
                name="preferredContactMethod"
                onChange={(value) => updateValue("preferredContactMethod", value)}
                options={preferredContactMethodOptions}
                selected={values.preferredContactMethod ? [values.preferredContactMethod] : []}
              />
              <FieldError id="preferredContactMethod-error" message={errors.preferredContactMethod} />
            </div>
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
            <p className={styles.privacyNote}>
              See the <Link href="/privacy">privacy notice</Link> for storage,
              attribution and analytics choices.
            </p>
          </div>
        ) : null}

        <div className={styles.honeypot} aria-hidden="true">
          <input
            aria-hidden="true"
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
        <p className={styles.formError} ref={formErrorRef} role="alert" tabIndex={-1}>
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
