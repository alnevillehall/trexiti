import Image from "next/image";

import type { ProjectEvidence, ProjectImage, ProjectVisual } from "@/lib/content/projects";

import styles from "./trexiti-site.module.css";

type FlagshipVisualProject = {
  index: string;
  title: string;
  descriptor: string;
  visual: ProjectVisual;
  evidence: ProjectEvidence;
  coverImage?: ProjectImage;
};

export function HomepageProjectVisual({
  project,
}: {
  project: FlagshipVisualProject;
}) {
  return (
    <div
      aria-hidden="true"
      className={`${styles.flagshipVisual} ${
        project.visual === "amanda"
          ? styles.flagshipVisualAmanda
          : project.visual === "marbella"
            ? styles.flagshipVisualMarbella
            : project.visual === "delta"
              ? styles.flagshipVisualAtlas
              : styles.flagshipVisualAster
      } ${project.coverImage ? styles.flagshipVisualMedia : ""}`}
    >
      {project.coverImage ? (
        <Image
          alt=""
          className={styles.flagshipImage}
          fill
          sizes="(max-width: 56rem) 100vw, 82vw"
          src={project.coverImage.src}
        />
      ) : null}

      <div className={styles.flagshipVisualTopline}>
        <span>Trexiti / Selected work</span>
        <span>Project {project.index}</span>
      </div>

      {!project.coverImage && project.visual === "amanda" ? (
        <div className={styles.amandaComposition}>
          <div className={styles.amandaSite}>
            <div className={styles.amandaSiteHeader}>
              <div className={styles.amandaIdentity}>
                <span>AM</span>
                <div>
                  <strong>Amanda Myers</strong>
                  <small>Attorney at law</small>
                </div>
              </div>
              <div className={styles.amandaNav}>
                <span>Practice</span>
                <span>Approach</span>
                <span>Insights</span>
                <span>Contact</span>
              </div>
            </div>

            <div className={styles.amandaHero}>
              <div className={styles.amandaHeroCopy}>
                <span>Strategic counsel for pivotal moments</span>
                <strong>
                  Clear counsel.
                  <em>Confident decisions.</em>
                </strong>
                <small>
                  A considered legal experience shaped around clarity,
                  discretion, and personal attention.
                </small>
                <b>
                  Request a consultation <i>↗</i>
                </b>
              </div>

              <div className={styles.amandaPortrait}>
                <div className={styles.amandaArch}>
                  <span>A</span>
                </div>
                <p>
                  Thoughtful advice
                  <br />
                  Personal attention
                </p>
              </div>
            </div>

            <div className={styles.amandaPracticeStrip}>
              {[
                ["01", "Understand"],
                ["02", "Advise"],
                ["03", "Navigate"],
                ["04", "Resolve"],
              ].map(([index, label]) => (
                <div key={label}>
                  <span>{index}</span>
                  <strong>{label}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {!project.coverImage && project.visual === "marbella" ? (
        <div className={styles.marbellaComposition}>
          <div className={styles.marbellaWordmark}>MARBELLA</div>
          <div className={styles.marbellaFrame}>
            <span>Residences</span>
            <strong>Designed for a considered way of living.</strong>
            <small>Explore the development ↗</small>
          </div>
          <div className={styles.marbellaPlan}>
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      ) : null}

      {!project.coverImage && project.visual === "delta" ? (
        <div className={styles.atlasComposition}>
          <div className={styles.atlasCore}>
            <span>Live operation</span>
            <strong>Delta</strong>
            <small>One connected record</small>
          </div>
          <div className={styles.atlasOrbit}>
            {[
              "Customers",
              "Jobs",
              "Schedule",
              "Inventory",
              "Payments",
              "Reporting",
            ].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      ) : null}

      {!project.coverImage && project.visual === "aster" ? (
        <div className={styles.asterComposition}>
          <div className={styles.asterHeader}>
            <span>Aster Health</span>
            <small>Patient experience</small>
          </div>
          <div className={styles.asterJourney}>
            {[
              ["01", "Discover"],
              ["02", "Book"],
              ["03", "Prepare"],
              ["04", "Care"],
            ].map(([index, label]) => (
              <div key={label}>
                <span>{index}</span>
                <strong>{label}</strong>
              </div>
            ))}
          </div>
          <div className={styles.asterSignal}>
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      ) : null}

      <div className={styles.flagshipVisualCaption}>
        <span>{project.descriptor}</span>
        <span>{project.evidence.label}</span>
      </div>
    </div>
  );
}
