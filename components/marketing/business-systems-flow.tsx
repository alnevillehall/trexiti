"use client";

import { useId, useState } from "react";

import styles from "./business-systems-flow.module.css";

type FlowStep = {
  description: string;
  phase: string;
  systemAction: string;
  title: string;
};

const flowSteps: FlowStep[] = [
  {
    title: "Customer inquiry",
    phase: "Intake",
    description:
      "A request enters through the website, phone, email, or another connected channel.",
    systemAction:
      "Capture the source, customer details, request, owner, and first response in one record.",
  },
  {
    title: "Lead created",
    phase: "Sales",
    description:
      "The inquiry becomes a structured opportunity that the commercial team can own and progress.",
    systemAction:
      "Create the lead, prevent duplicates, assign responsibility, and schedule the next action.",
  },
  {
    title: "Qualification",
    phase: "Sales",
    description:
      "The team confirms fit, scope, urgency, budget, and the information needed to proceed.",
    systemAction:
      "Standardize qualification criteria while preserving notes, documents, and decisions.",
  },
  {
    title: "Quote generated",
    phase: "Commercial",
    description:
      "Approved pricing, scope, terms, and customer data become a consistent commercial document.",
    systemAction:
      "Generate the quote from current operational data and record every revision automatically.",
  },
  {
    title: "Approved",
    phase: "Commercial",
    description:
      "The customer decision is captured and the business is ready to move from selling to delivery.",
    systemAction:
      "Record approval, confirm terms, and trigger the correct fulfillment workflow without re-entry.",
  },
  {
    title: "Job created",
    phase: "Operations",
    description:
      "The approved scope becomes an executable job with dates, requirements, and commercial context.",
    systemAction:
      "Carry customer, quote, scope, and deadline data into a controlled operational record.",
  },
  {
    title: "Staff assigned",
    phase: "Operations",
    description:
      "The right people are matched to the work with clear ownership, timing, and expectations.",
    systemAction:
      "Coordinate availability, roles, workload, permissions, and notifications from the job record.",
  },
  {
    title: "Work completed",
    phase: "Delivery",
    description:
      "Progress, activity, evidence, and completion are recorded where the rest of the business can see them.",
    systemAction:
      "Collect updates, time, materials, documents, and sign-off against the original requirements.",
  },
  {
    title: "Invoice generated",
    phase: "Finance",
    description:
      "Completed work becomes an accurate invoice without reconstructing the job from separate tools.",
    systemAction:
      "Generate billing from agreed pricing and verified delivery data, then sync it where appropriate.",
  },
  {
    title: "Payment received",
    phase: "Finance",
    description:
      "Payment status returns to the shared operating record so teams have the same commercial truth.",
    systemAction:
      "Reconcile the payment, update the balance, issue confirmation, and surface overdue exceptions.",
  },
  {
    title: "Management reporting updated",
    phase: "Intelligence",
    description:
      "Leaders see the result of the complete flow, from acquisition through delivery and cash collection.",
    systemAction:
      "Update live performance, revenue, cycle-time, workload, and bottleneck reporting from source data.",
  },
];

function classes(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function BusinessSystemsFlow() {
  const [activeIndex, setActiveIndex] = useState(0);
  const titleId = useId();
  const detailId = useId();
  const activeStep = flowSteps[activeIndex];
  const previousStep = flowSteps[activeIndex - 1];
  const nextStep = flowSteps[activeIndex + 1];

  return (
    <div aria-labelledby={titleId} className={styles.flow} role="group">
      <h3 className={styles.visuallyHidden} id={titleId}>
        Connected customer-to-management workflow
      </h3>
      <p aria-live="polite" className={styles.visuallyHidden}>
        Step {activeIndex + 1} of {flowSteps.length}: {activeStep.title}, {activeStep.phase}.
      </p>

      <div className={styles.header}>
        <p>One connected operating flow</p>
        <p aria-hidden="true" className={styles.position}>
          <span>Active connection</span>
          <strong>
            {String(activeIndex + 1).padStart(2, "0")} / {flowSteps.length}
          </strong>
        </p>
      </div>

      <div className={styles.layout}>
        <div className={styles.detail} id={detailId}>
          <div aria-hidden="true" className={styles.detailIndex}>
            {String(activeIndex + 1).padStart(2, "0")}
          </div>
          <p className={styles.phase}>{activeStep.phase}</p>
          <h4>{activeStep.title}</h4>
          <p className={styles.description}>{activeStep.description}</p>

          <dl className={styles.systemAction}>
            <div>
              <dt>The system connects</dt>
              <dd>{activeStep.systemAction}</dd>
            </div>
          </dl>

          <div aria-label="Adjacent workflow steps" className={styles.context}>
            <div className={styles.contextItem}>
              <span>Before</span>
              <strong>{previousStep?.title ?? "Entry point"}</strong>
            </div>
            <span aria-hidden="true" className={styles.contextArrow}>
              →
            </span>
            <div className={classes(styles.contextItem, styles.contextItemActive)}>
              <span>Now</span>
              <strong>{activeStep.title}</strong>
            </div>
            <span aria-hidden="true" className={styles.contextArrow}>
              →
            </span>
            <div className={styles.contextItem}>
              <span>Next</span>
              <strong>{nextStep?.title ?? "Live reporting"}</strong>
            </div>
          </div>
        </div>

        <ol className={styles.steps}>
          {flowSteps.map((step, index) => {
            const isActive = activeIndex === index;
            const isComplete = index < activeIndex;

            return (
              <li
                className={classes(
                  styles.step,
                  isComplete && styles.stepComplete,
                  isActive && styles.stepActive,
                )}
                key={step.title}
              >
                <button
                  aria-controls={detailId}
                  aria-current={isActive ? "step" : undefined}
                  aria-label={`Step ${index + 1} of ${flowSteps.length}: ${step.title}`}
                  onClick={() => setActiveIndex(index)}
                  type="button"
                >
                  <span aria-hidden="true" className={styles.stepIndex}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.stepTitle}>{step.title}</span>
                  <span aria-hidden="true" className={styles.stepPhase}>
                    {step.phase}
                  </span>
                  <span aria-hidden="true" className={styles.stepSignal} />
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <p className={styles.note}>
        Each handoff updates the same operational record. Information moves forward; teams do not have to
        rebuild it at every stage.
      </p>
    </div>
  );
}
