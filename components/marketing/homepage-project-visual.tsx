import styles from "./trexiti-site.module.css";

type FlagshipVisualProject = {
  index: string;
  title: string;
  descriptor: string;
  visual: "marbella" | "atlas" | "aster";
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
        project.visual === "marbella"
          ? styles.flagshipVisualMarbella
          : project.visual === "atlas"
            ? styles.flagshipVisualAtlas
            : styles.flagshipVisualAster
      }`}
    >
      <div className={styles.flagshipVisualTopline}>
        <span>Trexiti / Selected work</span>
        <span>Project {project.index}</span>
      </div>

      {project.visual === "marbella" ? (
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

      {project.visual === "atlas" ? (
        <div className={styles.atlasComposition}>
          <div className={styles.atlasCore}>
            <span>Live operation</span>
            <strong>Atlas</strong>
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

      {project.visual === "aster" ? (
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
        <span>Business → System</span>
      </div>
    </div>
  );
}
