import type { CSSProperties } from "react";

import type { AtlasOperationsDetail } from "@/lib/content/projects";

import { Stagger, StaggerItem } from "./motion-primitives";
import { Container, Eyebrow, Reveal, Section } from "./site-primitives";
import { ArchitectureDiagram, Workflow } from "./system-visuals";
import styles from "./atlas-operations-deep-dive.module.css";

function valueStyle(value: number) {
  return { "--atlas-value": `${value}%` } as CSSProperties;
}

export function AtlasOperationsDeepDive({
  detail,
}: {
  detail: AtlasOperationsDetail;
}) {
  return (
    <div className={styles.deepDive}>
      <Section className={styles.realitySection} tone="secondary">
        <Container>
          <div className={styles.sectionIntro}>
            <div>
              <Eyebrow>Operating reality</Eyebrow>
              <Reveal>
                <h2>The operating model had become distributed.</h2>
              </Reveal>
            </div>
            <p>
              This representative model begins with the operation as it is. Customer context,
              work instructions, promises, financial state, and evidence were
              spread across tools that could not provide one reliable view of
              the operation.
            </p>
          </div>

          <figure className={styles.fragmentationModel}>
            <figcaption>
              <span>Observed information environment</span>
              <span>Seven sources / no operational spine</span>
            </figcaption>
            <div className={styles.fragmentationBody}>
              <ul className={styles.sourceList} aria-label="Fragmented information sources">
                {detail.scenarioSources.map((source, index) => (
                  <li key={source}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{source}</strong>
                  </li>
                ))}
              </ul>
              <div className={styles.fragmentationCore}>
                <span>Fragmented operation</span>
                <strong>Information existed.</strong>
                <strong>Operational truth did not.</strong>
                <div aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          </figure>

          <div className={styles.problemHeader}>
            <span>Consequences</span>
            <p>
              The visible issues were connected symptoms of the same underlying
              problem: work had no shared, governed record.
            </p>
          </div>
          <Stagger className={styles.problemGrid} role="list" step={0.035}>
            {detail.problems.map((problem, index) => (
              <StaggerItem key={problem} role="listitem">
                <article>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{problem}</p>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </Section>

      <Section className={styles.analysisSection} tone="inverse">
        <Container>
          <div className={styles.sectionIntro}>
            <div>
              <Eyebrow>Business analysis</Eyebrow>
              <Reveal>
                <h2>Digitize the operation, not the symptoms.</h2>
              </Reveal>
            </div>
            <p>
              The work starts before interface design. Trexiti would observe how
              work moves, define where truth lives, and model the decisions,
              exceptions, permissions, and controls that make the operation
              dependable.
            </p>
          </div>

          <div className={styles.analysisGrid} role="list">
            {detail.analysisFocus.map((focus, index) => (
              <article key={focus.title} role="listitem">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{focus.title}</h3>
                  <p>{focus.description}</p>
                </div>
              </article>
            ))}
          </div>

          <div className={styles.roleModel}>
            <div className={styles.roleModelTitle}>
              <span>Role model</span>
              <strong>One platform / different responsibilities</strong>
            </div>
            <div className={styles.roleTrack} role="list">
              {detail.roles.map((role) => (
                <article key={role.title} role="listitem">
                  <h3>{role.title}</h3>
                  <p>{role.responsibility}</p>
                </article>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section className={styles.blueprintSection}>
        <Container>
          <div className={styles.objectiveHeader}>
            <div>
              <Eyebrow>System objective</Eyebrow>
              <Reveal>
                <h2>{detail.objective}</h2>
              </Reveal>
            </div>
            <p>
              The representative system is organized as a modular operating platform. Each domain has
              clear responsibility, while the customer, job, staff, material,
              document, and financial records remain connected.
            </p>
          </div>

          <div className={styles.moduleSystem}>
            <div className={styles.moduleSystemHeader}>
              <span>Delta / Representative domain map</span>
              <span>{detail.modules.length} operational modules</span>
            </div>
            <div className={styles.moduleGrid} role="list">
              {detail.modules.map((module, index) => (
                <div key={module} role="listitem">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{module}</strong>
                </div>
              ))}
            </div>
            <div className={styles.systemFoundation}>
              <span>Shared operational foundation</span>
              <strong>
                Identity / Permissions / Activity history / Data governance /
                Reliability
              </strong>
            </div>
          </div>
        </Container>
      </Section>

      <Section className={styles.dashboardSection} tone="inverse">
        <Container>
          <div className={styles.dashboardIntro}>
            <div>
              <Eyebrow>Admin dashboard</Eyebrow>
              <Reveal>
                <h2>Visibility created by the workflow.</h2>
              </Reveal>
            </div>
            <div>
              <p>
                The dashboard is not a parallel reporting exercise. Its measures
                come from the same governed events teams use to run the work.
              </p>
              <p className={styles.dataDisclosure}>{detail.dashboard.disclosure}</p>
            </div>
          </div>

          <figure className={styles.dashboardFrame}>
            <figcaption>
              <div>
                <span className={styles.atlasMark}>DA</span>
                <div>
                  <strong>Delta / Representative operations control</strong>
                  <span>{detail.dashboard.period}</span>
                </div>
              </div>
              <span className={styles.sampleTag}>Illustrative data</span>
            </figcaption>

            <div className={styles.kpiGrid}>
              {detail.dashboard.kpis.map((kpi) => (
                <article key={kpi.label}>
                  <span>{kpi.label}</span>
                  <strong>{kpi.value}</strong>
                  <small>{kpi.context}</small>
                </article>
              ))}
            </div>

            <div className={styles.dashboardGrid}>
              <article className={styles.statusPanel}>
                <div className={styles.panelHeader}>
                  <h3>Job Status Distribution</h3>
                  <span>60 active</span>
                </div>
                <div className={styles.statusBars}>
                  {detail.dashboard.jobStatus.map((status) => (
                    <div key={status.label}>
                      <span>{status.label}</span>
                      <div aria-hidden="true">
                        <span style={valueStyle(status.value * 5)} />
                      </div>
                      <strong>{status.value}</strong>
                    </div>
                  ))}
                </div>
              </article>

              <article className={styles.revenuePanel}>
                <div className={styles.panelHeader}>
                  <h3>Revenue Over Time</h3>
                  <span>8 weeks</span>
                </div>
                <div
                  aria-label="Illustrative revenue over time"
                  className={styles.revenueChart}
                  role="list"
                >
                  {detail.dashboard.revenue.map((point) => (
                    <div
                      aria-label={`${point.label}: ${point.value} relative units`}
                      key={point.label}
                      role="listitem"
                    >
                      <span
                        aria-hidden="true"
                        className={styles.revenueBar}
                        style={valueStyle(point.value)}
                      />
                      <small>{point.label}</small>
                    </div>
                  ))}
                </div>
              </article>

              <article className={styles.employeePanel}>
                <div className={styles.panelHeader}>
                  <h3>Work by Employee</h3>
                  <span>completed %</span>
                </div>
                <div className={styles.employeeBars}>
                  {detail.dashboard.workByEmployee.map((employee) => (
                    <div key={employee.label}>
                      <span>{employee.label}</span>
                      <div aria-hidden="true">
                        <span style={valueStyle(employee.value)} />
                      </div>
                      <strong>{employee.value}%</strong>
                    </div>
                  ))}
                </div>
              </article>

              <article className={styles.alertPanel}>
                <div className={styles.panelHeader}>
                  <h3>Inventory Alerts</h3>
                  <span>{detail.dashboard.inventoryAlerts.length} open</span>
                </div>
                <ul>
                  {detail.dashboard.inventoryAlerts.map((alert) => (
                    <li key={alert.item}>
                      <span aria-hidden="true" />
                      <strong>{alert.item}</strong>
                      <small>{alert.status}</small>
                      <em>{alert.level}</em>
                    </li>
                  ))}
                </ul>
              </article>

              <article className={styles.activityPanel}>
                <div className={styles.panelHeader}>
                  <h3>Recent Activity</h3>
                  <span>live record</span>
                </div>
                <ol>
                  {detail.dashboard.recentActivity.map((activity) => (
                    <li key={`${activity.time}-${activity.reference}`}>
                      <time>{activity.time}</time>
                      <strong>{activity.event}</strong>
                      <span>{activity.reference}</span>
                    </li>
                  ))}
                </ol>
              </article>
            </div>
          </figure>
        </Container>
      </Section>

      <Section className={styles.customerSection} tone="secondary">
        <Container>
          <div className={styles.sectionIntro}>
            <div>
              <Eyebrow>CRM / Customer record</Eyebrow>
              <Reveal>
                <h2>One relationship, seen in full.</h2>
              </Reveal>
            </div>
            <p>
              A customer profile is more than contact information. It becomes the
              navigable relationship between communication, operational work,
              documents, and money.
            </p>
          </div>

          <figure className={styles.customerFrame}>
            <figcaption>
              <span>Customer / {detail.customerRecord.reference}</span>
              <span>Unified relationship record</span>
            </figcaption>
            <div className={styles.customerHeader}>
              <div className={styles.customerMonogram} aria-hidden="true">NH</div>
              <div>
                <span>Active customer</span>
                <h3>{detail.customerRecord.name}</h3>
              </div>
              <div className={styles.customerSummary}>
                <span><strong>03</strong> open jobs</span>
                <span><strong>01</strong> outstanding invoice</span>
                <span><strong>12</strong> documents</span>
              </div>
            </div>
            <div className={styles.customerTabs} role="list" aria-label="Customer record sections">
              {detail.customerRecord.sections.map((section, index) => (
                <span key={section} role="listitem" data-active={index === 8 || undefined}>
                  {section}
                </span>
              ))}
            </div>
            <div className={styles.customerBody}>
              <dl>
                {detail.customerRecord.contact.map((item) => (
                  <div key={item.label}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>
              <div className={styles.customerActivity}>
                <div className={styles.panelHeader}>
                  <h3>Activity</h3>
                  <span>Most recent first</span>
                </div>
                <ol>
                  {detail.customerRecord.activity.map((item) => (
                    <li key={item.title}>
                      <span aria-hidden="true" />
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.meta}</small>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </figure>
        </Container>
      </Section>

      <Section className={styles.lifecycleSection} tone="accent">
        <Container>
          <div className={styles.lifecycleIntro}>
            <div>
              <Eyebrow>Job management</Eyebrow>
              <Reveal>
                <h2>Every state carries ownership and rules.</h2>
              </Reveal>
            </div>
            <p>
              The lifecycle is the operational contract. A state change only
              happens when the right role acts and the information required for
              the next team is complete.
            </p>
          </div>

          <Workflow
            ariaLabel="A representative job lifecycle with ownership and progression rules for every operational state"
            caption="Every state change carries the customer, commercial, and operational context required by the next responsible role."
            className={styles.sharedLifecycle}
            label="Job lifecycle"
            layout="grid"
            meta="State / owner / rule"
            steps={detail.jobLifecycle.map((stage) => ({
              detail: stage.rule,
              label: stage.title,
              meta: stage.owner,
            }))}
            tone="accent"
          />

          <div className={styles.automationModel}>
            <div>
              <span>Controlled automation</span>
              <strong>Events trigger action. People retain control.</strong>
            </div>
            <div role="list">
              {detail.automation.map((item) => (
                <article key={item.event} role="listitem">
                  <span>{item.event}</span>
                  <i aria-hidden="true">→</i>
                  <p>{item.action}</p>
                </article>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section className={styles.architectureSection} tone="inverse">
        <Container>
          <div className={styles.architectureIntro}>
            <div>
              <Eyebrow>System architecture</Eyebrow>
              <Reveal>
                <h2>A central platform with deliberate edges.</h2>
              </Reveal>
            </div>
            <p>
              The operational core owns the shared model. External platforms remain
              connected where they are already the right tool, with explicit
              interfaces, failure handling, and reconciliation around the core.
            </p>
          </div>

          <ArchitectureDiagram
            ariaLabel="A representative operational core connecting customer, CRM, job management, scheduling, staff, inventory, finance, reporting, and external platforms"
            caption="The representative core owns the operational model while specialist platforms remain connected through deliberate, monitored interfaces."
            className={styles.sharedArchitecture}
            foundation="Identity / Permissions / Audit / Events / Data"
            label="Delta / Representative system boundary"
            layers={detail.architectureChain.map((layer, index) => ({
              detail: layer.description,
              emphasis:
                index === Math.floor(detail.architectureChain.length / 2),
              label: layer.title,
            }))}
            leftRail={{
              items: detail.integrations.slice(0, 4),
              label: "Connected systems",
            }}
            meta="Central platform + managed integrations"
            rightRail={{
              items: detail.integrations.slice(4),
              label: "Infrastructure edges",
            }}
            tone="inverse"
          />
        </Container>
      </Section>
    </div>
  );
}
