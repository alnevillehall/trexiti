import Link from "next/link";

import {
  EmptyOperationsState,
  FreshnessStatus,
  OperationsBadge,
  OperationsPageIntro,
  formatOperationsDate,
  readableStatus,
  statusTone,
} from "@/components/admin/coo-admin-ui";
import styles from "@/components/admin/admin.module.css";
import { requireFounderSession } from "@/lib/admin/auth";
import { getActivePolicy, listAutomationRuns } from "@/lib/coo/data";

export default async function AdminAutomationsPage() {
  await requireFounderSession();
  const [runs, policy] = await Promise.all([
    listAutomationRuns({ take: 100 }),
    getActivePolicy(),
  ]);
  const latest = runs[0];

  return (
    <>
      <OperationsPageIntro
        eyebrow="Automation control"
        title="Durable work, visible end to end."
        description="Monitor scheduled prospecting, the daily COO brief, guarded operations, and approval execution without mistaking a queued request for completed work."
        meta={<FreshnessStatus asOf={latest?.completedAt ?? latest?.startedAt ?? latest?.createdAt ?? null} stale={!latest} />}
      />

      <div className={styles.modeBanner}>
        <div><strong>{readableStatus(policy.automationMode)} effective automation mode</strong><p>{policy.automationMode === "OFF" ? "All automated execution is disabled." : policy.automationMode === "SHADOW" ? "Trexiti prepares and records proposed work without mutating business records." : "Allow-listed internal work can execute; sensitive work still requires approval."} Configured policy: {readableStatus(policy.configuredAutomationMode)} · runtime ceiling: {readableStatus(policy.runtimeAutomationMode)}.</p></div>
        <OperationsBadge tone={policy.automationMode === "GUARDED" ? "success" : policy.automationMode === "SHADOW" ? "warning" : "danger"}>{readableStatus(policy.automationMode)}</OperationsBadge>
      </div>

      <div className={styles.operationsKpiGrid} aria-label="Automation schedule">
        <div className={styles.operationsKpi}><dt>Prospect research</dt><dd><span>06:00 Jamaica</span><small>11:00 UTC · daily</small></dd></div>
        <div className={styles.operationsKpi}><dt>COO brief</dt><dd><span>07:00 Jamaica</span><small>12:00 UTC · continues with degraded data</small></dd></div>
        <div className={styles.operationsKpi}><dt>Chat delivery</dt><dd><span>07:05 Jamaica</span><small>Fetches the stored brief through the plugin</small></dd></div>
        <div className={styles.operationsKpi}><dt>Run history</dt><dd><span>{runs.length}</span><small>Latest {latest ? readableStatus(latest.status) : "not started"}</small></dd></div>
      </div>

      <section className={styles.operationsSection} aria-labelledby="automation-runs-title">
        <div className={styles.operationsSectionHeader}><div><h2 id="automation-runs-title">Automation runs</h2><p>Correlation IDs make every step and write traceable</p></div><span>{runs.length} shown</span></div>
        {runs.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.operationsTable}>
              <thead><tr><th>Workflow</th><th>Status</th><th>Mode</th><th>Scheduled</th><th>Started</th><th>Completed</th><th>Steps</th><th>Correlation</th></tr></thead>
              <tbody>{runs.map((run) => (
                <tr id={`run-${run.id}`} key={run.id}>
                  <td><Link href={run.record.href}><strong>{readableStatus(run.type)}</strong></Link>{run.error ? <small role="alert">{run.error}</small> : null}</td>
                  <td><OperationsBadge tone={statusTone(run.status)}>{readableStatus(run.status)}</OperationsBadge></td>
                  <td>{readableStatus(run.mode)}</td>
                  <td>{formatOperationsDate(run.scheduledFor)}</td>
                  <td>{formatOperationsDate(run.startedAt)}</td>
                  <td>{formatOperationsDate(run.completedAt)}</td>
                  <td>{Object.entries(run.stepCounts).length ? Object.entries(run.stepCounts).map(([status, count]) => `${readableStatus(status)} ${count}`).join(" · ") : "No steps"}</td>
                  <td><small>{run.correlationId}</small></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <EmptyOperationsState title="No automation runs yet" description="The first cron or Run Operations request will create a durable run here." />}
      </section>
    </>
  );
}
