import styles from "./business-system-diagram.module.css";

const disconnectedTools = [
  "WhatsApp",
  "Email",
  "Excel",
  "Paper",
  "Calendar",
  "Accounting Software",
  "CRM",
  "Notes",
  "Forms",
] as const;

const connectedDomains = [
  "Customers",
  "Sales",
  "Operations",
  "Staff",
  "Inventory",
  "Payments",
  "Reporting",
  "Integrations",
] as const;

function indexLabel(index: number) {
  return String(index + 1).padStart(2, "0");
}

export function BusinessSystemDiagram() {
  return (
    <figure
      aria-label="A comparison of fragmented business tools with a connected Trexiti business system"
      className={styles.diagram}
    >
      <div aria-hidden="true" className={styles.topRail}>
        <span>Operational architecture</span>
        <span>Current state / connected state</span>
      </div>

      <div className={styles.comparison}>
        <section
          aria-label="Before: disconnected business tools"
          className={`${styles.phase} ${styles.before}`}
        >
          <header className={styles.phaseHeader}>
            <p>
              <span>Before</span>
              Disconnected business
            </p>
            <h3>Information is fragmented.</h3>
          </header>

          <ul className={styles.sourceField}>
            {disconnectedTools.map((tool, index) => (
              <li className={styles.sourceItem} key={tool}>
                <span aria-hidden="true">{indexLabel(index)}</span>
                <strong>{tool}</strong>
                <i aria-hidden="true" />
              </li>
            ))}
          </ul>
        </section>

        <div aria-hidden="true" className={styles.bridge}>
          <span>Map</span>
          <div className={styles.bridgeLine}>
            <i />
          </div>
          <span>Connect</span>
        </div>

        <section
          aria-label="After: a connected Trexiti business system"
          className={`${styles.phase} ${styles.after}`}
        >
          <header className={styles.phaseHeader}>
            <p>
              <span>After</span>
              Shared operating model
            </p>
            <h3>Trexiti Business System</h3>
          </header>

          <div className={styles.systemArchitecture}>
            <div className={styles.systemCore}>
              <span aria-hidden="true" className={styles.coreMark}>
                T
              </span>
              <p>Central operating layer</p>
              <strong>One connected source of operational truth.</strong>
              <span className={styles.coreMeta}>Data / workflows / rules</span>
            </div>

            <ul className={styles.domainList}>
              {connectedDomains.map((domain, index) => (
                <li key={domain}>
                  <span aria-hidden="true">{indexLabel(index)}</span>
                  <strong>{domain}</strong>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <figcaption className={styles.caption}>
        <div className={styles.captionStatement}>
          <span aria-hidden="true">Integration principle / 01</span>
          <p>
            <strong>Keep what works.</strong> The goal is not necessarily to
            replace everything. Trexiti can create the central system and
            integrate existing platforms where appropriate.
          </p>
        </div>
        <ul aria-label="Trexiti's integration approach" className={styles.strategy}>
          <li>
            <span aria-hidden="true">01</span>
            Keep
          </li>
          <li>
            <span aria-hidden="true">02</span>
            Connect
          </li>
          <li>
            <span aria-hidden="true">03</span>
            Replace when justified
          </li>
        </ul>
      </figcaption>
    </figure>
  );
}
