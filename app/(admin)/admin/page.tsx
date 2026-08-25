import Link from "next/link";

import { OperationsControls } from "@/components/admin/operations-controls";
import {
  EmptyOperationsState,
  FreshnessStatus,
  OperationsBadge,
  OperationsPageIntro,
  QueueItem,
  formatMoney,
  formatOperationsDate,
  readableStatus,
  statusTone,
} from "@/components/admin/coo-admin-ui";
import styles from "@/components/admin/admin.module.css";
import { requireFounderSession } from "@/lib/admin/auth";
import { getFollowUpsDue, getOperationsDashboard, getUpcomingDeadlines } from "@/lib/coo/data";
import type { QueueItemView } from "@/lib/coo/domain/types";

function queue(items: QueueItemView[], emptyTitle: string, emptyDescription: string) {
  if (!items.length) {
    return <EmptyOperationsState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <ul className={styles.queueList}>
      {items.slice(0, 5).map((item) => (
        <QueueItem
          key={item.id}
          href={item.record.href}
          title={item.title}
          description={item.detail}
          meta={item.dueAt ? `Due ${formatOperationsDate(item.dueAt)}` : item.record.label}
          badge={readableStatus(item.status)}
          tone={item.severity === "CRITICAL" || item.severity === "HIGH" ? "danger" : item.severity === "ATTENTION" ? "warning" : "neutral"}
        />
      ))}
    </ul>
  );
}

function automationSummary(output: unknown) {
  if (!output || typeof output !== "object" || Array.isArray(output)) return null;
  const values = output as Record<string, unknown>;
  if (typeof values.accepted === "number" && typeof values.rejected === "number") {
    return `${values.accepted} accepted · ${values.rejected} rejected`;
  }
  if (typeof values.processed === "number") return `${values.processed} safe actions processed`;
  if (typeof values.priorities === "number") return `${values.priorities} founder priorities stored`;
  return null;
}

export default async function AdminOperationsPage() {
  await requireFounderSession();
  const now = new Date();
  const [dashboard, upcoming, followUps] = await Promise.all([
    getOperationsDashboard({ now }),
    getUpcomingDeadlines({ now, days: 14 }),
    getFollowUpsDue(now),
  ]);
  const brief = dashboard.brief;
  const priorities = brief?.priorities.slice(0, 5) ?? [];
  const freshnessUnknown = dashboard.freshness.state === "UNKNOWN";
  const degraded = brief?.status === "DEGRADED" || brief?.status === "FAILED" || freshnessUnknown;

  return (
    <>
      <OperationsPageIntro
        eyebrow="Trexiti COO · Founder command"
        title="Operate from the exceptions."
        description="A shared operating picture for decisions, safe execution, delivery risk, cash, and the work Trexiti completed on your behalf. Every signal links back to its source record."
        meta={
          <FreshnessStatus
            asOf={dashboard.freshness.asOf ?? dashboard.asOf}
            stale={dashboard.freshness.state === "STALE"}
            degraded={degraded}
            detail={`${dashboard.freshness.thresholdMinutes} minute freshness policy`}
          />
        }
      />

      <section className={styles.briefStrip} aria-labelledby="daily-brief-title">
        <div className={styles.briefLead}>
          <h2 id="daily-brief-title">{brief?.headline ?? "The first stored COO brief is waiting to run."}</h2>
          <p>{brief?.summary ?? "Live operational metrics are available below. The 07:00 Jamaica workflow will create a durable, evidence-backed brief here and expose the identical version to the COO conversation."}</p>
          {brief?.degradedReason ? <p role="alert">Partial data: {brief.degradedReason}</p> : null}
        </div>
        <div className={styles.briefMeta}>
          <OperationsBadge tone={brief?.status === "READY" ? "success" : "warning"}>{brief ? readableStatus(brief.status) : "Awaiting first run"}</OperationsBadge>
          <span>{brief ? `Business date · ${formatOperationsDate(brief.businessDate, false)}` : "Next scheduled brief · 07:00 Jamaica"}</span>
          <span>Policy v{brief?.policyVersion ?? dashboard.policy.version} · {dashboard.policy.name}</span>
          <span>Automation · {readableStatus(dashboard.policy.automationMode)} effective</span>
          {brief?.model ? <span>Model · {brief.model}</span> : null}
        </div>
      </section>

      <dl className={styles.operationsKpiGrid} aria-label="Executive metrics">
        <div className={styles.operationsKpi}>
          <dt><Link href="/admin/pipeline">Pipeline</Link></dt>
          <dd><Link href="/admin/pipeline">{formatMoney(dashboard.metrics.pipeline.JMD, "JMD")}</Link><Link href="/admin/pipeline">{formatMoney(dashboard.metrics.pipeline.USD, "USD")}</Link><small>No currency conversion</small></dd>
        </div>
        <div className={styles.operationsKpi}>
          <dt><Link href="/admin/pipeline">Weighted pipeline</Link></dt>
          <dd><Link href="/admin/pipeline">{formatMoney(dashboard.metrics.weightedPipeline.JMD, "JMD")}</Link><Link href="/admin/pipeline">{formatMoney(dashboard.metrics.weightedPipeline.USD, "USD")}</Link><small>Probability weighted</small></dd>
        </div>
        <div className={styles.operationsKpi}>
          <dt><Link href="/admin/finance">Outstanding</Link></dt>
          <dd><Link href="/admin/finance">{formatMoney(dashboard.metrics.outstanding.JMD, "JMD")}</Link><Link href="/admin/finance">{formatMoney(dashboard.metrics.outstanding.USD, "USD")}</Link><small>Overdue: {formatMoney(dashboard.metrics.overdue.JMD, "JMD")} · {formatMoney(dashboard.metrics.overdue.USD, "USD")}</small></dd>
        </div>
        <div className={styles.operationsKpi}>
          <dt><Link href="/admin/finance">Expected cash · 30 days</Link></dt>
          <dd><Link href="/admin/finance">{formatMoney(dashboard.metrics.expectedCash.JMD, "JMD")}</Link><Link href="/admin/finance">{formatMoney(dashboard.metrics.expectedCash.USD, "USD")}</Link><small>Issued, non-overdue balances due in window</small></dd>
        </div>
        <div className={styles.operationsKpi}>
          <dt><Link href="/admin/finance">Invoiced revenue · month</Link></dt>
          <dd><Link href="/admin/finance">{formatMoney(dashboard.metrics.invoicedRevenue.JMD, "JMD")}</Link><Link href="/admin/finance">{formatMoney(dashboard.metrics.invoicedRevenue.USD, "USD")}</Link><small>Issued invoices · Jamaica calendar month</small></dd>
        </div>
        <div className={styles.operationsKpi}>
          <dt><Link href="/admin/finance">Received this month</Link></dt>
          <dd><Link href="/admin/finance">{formatMoney(dashboard.metrics.received.JMD, "JMD")}</Link><Link href="/admin/finance">{formatMoney(dashboard.metrics.received.USD, "USD")}</Link><small>Cleared receipts · Jamaica calendar month</small></dd>
        </div>
        <div className={styles.operationsKpi}>
          <dt>Operational exceptions</dt>
          <dd><Link href="/admin/approvals">{dashboard.metrics.pendingApprovals} decisions</Link><Link href="/admin/projects">{dashboard.metrics.atRiskProjects} at-risk projects</Link><small><Link href="/admin/tasks">{dashboard.metrics.followUpsDue} follow-ups due</Link> · <Link href="/admin/clients">{dashboard.metrics.activeClients} active clients</Link></small></dd>
        </div>
      </dl>

      <section className={styles.operationsSection} aria-labelledby="founder-priorities-title">
        <div className={styles.operationsSectionHeader}>
          <div><h2 id="founder-priorities-title">Founder priorities</h2><p>Maximum five, ranked from deterministic exceptions</p></div>
          <span>{priorities.length} of {Math.min(dashboard.policy.maxFounderPriorities, 5)}</span>
        </div>
        {priorities.length ? (
          <ol className={styles.priorityList}>
            {priorities.map((item) => (
              <li className={styles.priorityItem} key={item.id}>
                <span className={styles.priorityRank}>{item.rank}</span>
                <div>
                  {item.record ? <Link href={item.record.href}>{item.title}</Link> : <strong>{item.title}</strong>}
                  <p>{item.rationale}</p>
                  {item.nextAction ? <span>Next · {item.nextAction}</span> : null}
                  {item.currency && item.amount !== null ? <span>Impact · {formatMoney(item.amount, item.currency)}</span> : null}
                </div>
                <OperationsBadge tone={item.severity === "CRITICAL" || item.severity === "HIGH" ? "danger" : item.severity === "ATTENTION" ? "warning" : "info"}>{readableStatus(item.severity)}</OperationsBadge>
              </li>
            ))}
          </ol>
        ) : <EmptyOperationsState title="No founder exception is waiting" description="Trexiti places only decisions and high-impact exceptions here after a brief run." />}
      </section>

      <div className={styles.queueGrid}>
        <section className={styles.queueColumn} data-queue="decide" aria-labelledby="decide-queue-title">
          <div className={styles.queueColumnHeader}><div><h2 id="decide-queue-title">Al must decide</h2><p>Sensitive or judgment-heavy</p></div><span className={styles.queueCount}>{dashboard.queues.founderDecisions.length}</span></div>
          {queue(dashboard.queues.founderDecisions, "Decision queue clear", "Approval requests and high-impact decisions will appear here.")}
        </section>
        <section className={styles.queueColumn} data-queue="execute" aria-labelledby="execute-queue-title">
          <div className={styles.queueColumnHeader}><div><h2 id="execute-queue-title">AI can execute</h2><p>Allow-listed internal work</p></div><span className={styles.queueCount}>{dashboard.queues.aiCanExecute.length}</span></div>
          {queue(dashboard.queues.aiCanExecute, "No safe work queued", "Run Operations will show what Trexiti can execute without approval.")}
        </section>
        <section className={styles.queueColumn} data-queue="completed" aria-labelledby="completed-queue-title">
          <div className={styles.queueColumnHeader}><div><h2 id="completed-queue-title">Completed</h2><p>Audited automation outcomes</p></div><span className={styles.queueCount}>{dashboard.queues.completed.length}</span></div>
          {queue(dashboard.queues.completed, "No automation has completed", "Successful actions will appear with a run and audit link.")}
        </section>
      </div>

      <OperationsControls />

      <div className={styles.operationsColumnsWide}>
        <section className={styles.operationsSection} aria-labelledby="risk-panel-title">
          <div className={styles.operationsSectionHeader}><div><h2 id="risk-panel-title">Delivery and client risk</h2><p>Rule-based signals, then AI rationale</p></div><Link href="/admin/projects">Open projects</Link></div>
          {dashboard.projects.length ? <ul className={styles.compactRecordList}>{dashboard.projects.slice(0, 6).map((project) => <QueueItem key={project.id} href={project.record.href} title={project.title} description={project.riskReasons.length ? project.riskReasons.map(readableStatus).join(" · ") : `${project.progressPercent}% complete`} meta={`${project.companyName} · ${project.targetEndAt ? `Target ${formatOperationsDate(project.targetEndAt, false)}` : "No target date"}`} badge={readableStatus(project.health)} tone={project.health === "AT_RISK" ? "danger" : project.health === "ATTENTION" ? "warning" : "success"} />)}</ul> : <EmptyOperationsState title="No delivery records yet" description="Add active clients, projects, milestones, and blockers to activate risk monitoring." />}
        </section>
        <section className={styles.operationsSection} aria-labelledby="run-panel-title">
          <div className={styles.operationsSectionHeader}><div><h2 id="run-panel-title">Automation health</h2><p>Prospecting · brief · operations · approvals</p></div><Link href="/admin/automations">Open runs</Link></div>
          {dashboard.automationRuns.length ? <ul className={styles.compactRecordList}>{dashboard.automationRuns.slice(0, 6).map((run) => <QueueItem key={run.id} href={run.record.href} title={readableStatus(run.type)} description={run.error ?? automationSummary(run.outputSummary) ?? `Correlation ${run.correlationId}`} meta={formatOperationsDate(run.completedAt ?? run.startedAt ?? run.createdAt)} badge={readableStatus(run.status)} tone={statusTone(run.status)} />)}</ul> : <EmptyOperationsState title="Waiting for the first workflow" description="Failures, partial runs, duration, steps, and model usage will be visible here." />}
        </section>
      </div>

      <section className={styles.operationsSection} aria-labelledby="deadline-panel-title">
        <div className={styles.operationsSectionHeader}><div><h2 id="deadline-panel-title">Deadlines and follow-ups</h2><p>Overdue follow-up work plus the next 14 days of milestones and tasks</p></div><Link href="/admin/tasks">Open task register</Link></div>
        {followUps.items.length || upcoming.milestones.length || upcoming.tasks.length ? <ul className={styles.compactRecordList}>
          {followUps.items.slice(0, 5).map((item) => <QueueItem key={`follow-up-${item.id}`} href={item.href} title={item.title} description={item.companyName ?? "Internal follow-up"} meta={`Due ${formatOperationsDate(item.dueAt)}`} badge="Follow-up due" tone={item.priority === "URGENT" || item.priority === "HIGH" ? "danger" : "warning"} />)}
          {[...upcoming.milestones.map((item) => ({ ...item, kind: "Milestone", context: item.projectTitle })), ...upcoming.tasks.map((item) => ({ ...item, kind: "Task", context: "Internal work" }))].sort((left, right) => left.dueAt.localeCompare(right.dueAt)).slice(0, 7).map((item) => <QueueItem key={`${item.kind}-${item.id}`} href={item.href} title={item.title} description={item.context} meta={`Due ${formatOperationsDate(item.dueAt)}`} badge={item.kind} tone="neutral" />)}
        </ul> : <EmptyOperationsState title="No immediate deadline pressure" description="Upcoming milestones, tasks, and overdue follow-ups will appear here with source links." />}
      </section>
    </>
  );
}
