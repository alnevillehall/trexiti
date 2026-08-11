"use client";

import { useId, useState } from "react";

import { systemsMethod } from "@/lib/content/home";

import { Stagger, StaggerItem } from "./motion-primitives";
import styles from "./trexiti-site.module.css";

function classes(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

export function SystemsMethod() {
  const [activeIndex, setActiveIndex] = useState(0);
  const labelId = useId();
  const activeStep = systemsMethod[activeIndex];

  return (
    <div
      aria-labelledby={labelId}
      className={styles.systemsMethodInteractive}
      role="group"
    >
      <p className={styles.visuallyHidden} id={labelId}>
        Trexiti systems method
      </p>
      <div className={styles.systemsMethodProgress}>
        <p aria-hidden="true">
          <span>Active step</span>
          <strong>
            {activeStep.index} / {String(systemsMethod.length).padStart(2, "0")}
          </strong>
          <span>{activeStep.title}</span>
        </p>
        <div aria-hidden="true" className={styles.systemsMethodProgressTrack}>
          {systemsMethod.map((step, index) => (
            <span
              className={classes(
                styles.systemsMethodProgressSegment,
                index <= activeIndex &&
                  styles.systemsMethodProgressSegmentComplete,
                index === activeIndex &&
                  styles.systemsMethodProgressSegmentActive,
              )}
              key={step.title}
            />
          ))}
        </div>
      </div>

      <Stagger className={styles.systemsMethodGrid} role="list" step={0.07}>
        {systemsMethod.map((step, index) => {
          const titleId = `${labelId}-title-${index}`;
          const descriptionId = `${labelId}-description-${index}`;

          return (
            <StaggerItem key={step.title} role="listitem">
              <button
                aria-current={activeIndex === index ? "step" : undefined}
                aria-describedby={descriptionId}
                aria-labelledby={titleId}
                className={classes(
                  styles.systemsMethodStep,
                  activeIndex === index && styles.systemsMethodStepActive,
                )}
                onClick={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                type="button"
              >
                <span>{step.index}</span>
                <span className={styles.systemsMethodStepContent}>
                  <span className={styles.systemsMethodStepTitle} id={titleId}>
                    {step.title}
                  </span>
                  <span
                    className={styles.systemsMethodStepDescription}
                    id={descriptionId}
                  >
                    {step.description}
                  </span>
                </span>
              </button>
            </StaggerItem>
          );
        })}
      </Stagger>
    </div>
  );
}
