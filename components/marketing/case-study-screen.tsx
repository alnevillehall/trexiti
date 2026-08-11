import type { CaseStudyProject } from "@/lib/content/projects";

import styles from "./case-study-screen.module.css";

const screenLabels = {
  marbella: {
    primary: ["The development", "Residences", "Location"],
    workflow: [
      "Residence type",
      "Plan",
      "Specifications",
      "Availability",
      "Enquire",
    ],
    detail: ["Interest", "Residence", "Contact", "Sales handoff"],
  },
  atlas: {
    primary: ["Needs action", "In progress", "Blocked", "Completed"],
    workflow: ["Request", "Plan", "Assign", "Deliver", "Invoice"],
    detail: ["Operations", "Workload", "Exceptions", "Commercial"],
  },
  aster: {
    primary: ["Discover", "Understand", "Prepare", "Request"],
    workflow: ["Service", "Location", "Time", "Details", "Confirm"],
    detail: ["Appointments", "Requests", "Documents", "Messages"],
  },
} as const;

export function CaseStudyScreen({
  project,
  screen,
  index,
}: {
  project: CaseStudyProject;
  screen: CaseStudyProject["screens"][number];
  index: number;
}) {
  const labels = screenLabels[project.visual][screen.variant];

  return (
    <figure className={`${styles.figure} ${styles[project.visual]}`}>
      <div className={styles.frame} aria-hidden="true">
        <div className={styles.frameHeader}>
          <span>{project.title}</span>
          <span>Interface / {String(index + 1).padStart(2, "0")}</span>
        </div>

        <div className={`${styles.canvas} ${styles[screen.variant]}`}>
          <div className={styles.canvasLead}>
            <span>{screen.title}</span>
            <strong>{labels[0]}</strong>
          </div>

          <div className={styles.screenSequence}>
            {labels.map((label, labelIndex) => (
              <div key={label}>
                <span>{String(labelIndex + 1).padStart(2, "0")}</span>
                <strong>{label}</strong>
                <i />
              </div>
            ))}
          </div>

          <div className={styles.signal}>
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className={styles.frameFooter}>
          <span>{project.projectType}</span>
          <span>Concept interface</span>
        </div>
      </div>
      <figcaption>
        <span>{String(index + 1).padStart(2, "0")}</span>
        <div>
          <strong>{screen.title}</strong>
          <p>{screen.description}</p>
        </div>
      </figcaption>
    </figure>
  );
}
