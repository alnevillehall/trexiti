import type { Project } from "@/lib/content/types";

import styles from "./trexiti-site.module.css";

export function ProjectVisual({
  project,
  size = "card",
}: {
  project: Project;
  size?: "card" | "hero";
}) {
  return (
    <div
      className={`${styles.projectVisual} ${
        project.visual === "property"
          ? styles.projectVisualProperty
          : styles.projectVisualService
      } ${size === "hero" ? styles.projectVisualHero : ""}`}
      aria-hidden="true"
    >
      <div className={styles.visualTopline}>
        <span>{project.title}</span>
        <span>System / 0{project.visual === "property" ? "1" : "2"}</span>
      </div>
      {project.visual === "property" ? (
        <div className={styles.propertyDiagram}>
          <div className={styles.diagramAxis} />
          <div className={styles.propertyBlockLarge}>
            <span>Portfolio</span>
            <strong>Connected operations</strong>
          </div>
          <div className={styles.propertyBlockSmall}>
            <span>12</span>
            <small>Active flows</small>
          </div>
          <div className={styles.propertyLines}>
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      ) : (
        <div className={styles.serviceDiagram}>
          <div className={styles.serviceSequence}>
            {["Enquiry", "Schedule", "Field work", "Payment"].map(
              (step, index) => (
                <div key={step}>
                  <span>0{index + 1}</span>
                  <strong>{step}</strong>
                </div>
              ),
            )}
          </div>
          <div className={styles.servicePulse} />
        </div>
      )}
      <div className={styles.visualCaption}>
        <span>Trexiti / Designed systems</span>
        <span>Strategy → Operation</span>
      </div>
    </div>
  );
}
