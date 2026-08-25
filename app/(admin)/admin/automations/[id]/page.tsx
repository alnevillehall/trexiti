import Link from "next/link";
import { notFound } from "next/navigation";

import { OperationsBadge, OperationsPageIntro, formatOperationsDate, readableStatus, statusTone } from "@/components/admin/coo-admin-ui";
import styles from "@/components/admin/admin.module.css";
import { requireFounderSession } from "@/lib/admin/auth";
import { getAutomationRunById } from "@/lib/coo/data";

function json(value: unknown) {
  return JSON.stringify(value ?? null, null, 2);
}

function formatEstimatedCost(value: number | null) {
  if (value === null) return "Unavailable";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  }).format(value);
}

function stepCost(output: unknown) {
  if (!output || typeof output !== "object" || Array.isArray(output)) return null;
  const usage = (output as Record<string, unknown>).usage;
  if (!usage || typeof usage !== "object" || Array.isArray(usage)) return null;
  const cost = (usage as Record<string, unknown>).costUsd;
  return typeof cost === "number" && Number.isFinite(cost) ? cost : null;
}

export default async function AdminAutomationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireFounderSession();
  const { id } = await params;
  const run = await getAutomationRunById(id);
  if (!run) notFound();

  return (
    <>
      <OperationsPageIntro eyebrow="Automation run" title={readableStatus(run.type)} description={`Correlation ${run.correlationId}`} meta={<><OperationsBadge tone={statusTone(run.status)}>{readableStatus(run.status)}</OperationsBadge><Link href="/admin/automations">Back to runs</Link></>} />
      <dl className={styles.operationsKpiGrid}>
        <div className={styles.operationsKpi}><dt>Mode</dt><dd><span>{readableStatus(run.mode)}</span><small>Authority at run start</small></dd></div>
        <div className={styles.operationsKpi}><dt>Scheduled</dt><dd><span>{formatOperationsDate(run.scheduledFor)}</span><small>Requested schedule</small></dd></div>
        <div className={styles.operationsKpi}><dt>Started</dt><dd><span>{formatOperationsDate(run.startedAt)}</span><small>Durable execution start</small></dd></div>
        <div className={styles.operationsKpi}><dt>Completed</dt><dd><span>{formatOperationsDate(run.completedAt)}</span><small>Terminal timestamp</small></dd></div>
        <div className={styles.operationsKpi}><dt>Model</dt><dd><span>{run.model ?? "Deterministic"}</span><small>Model provenance</small></dd></div>
        <div className={styles.operationsKpi}><dt>AI cost</dt><dd><span>{formatEstimatedCost(run.estimatedCostUsd)}</span><small>Gateway-reported USD when available</small></dd></div>
      </dl>
      <section className={styles.operationsSection} aria-labelledby="run-steps-title">
        <div className={styles.operationsSectionHeader}><div><h2 id="run-steps-title">Step outcomes</h2><p>Attempts, errors, and idempotency are preserved per durable step</p></div><span>{run.steps.length} steps</span></div>
        {run.steps.length ? <div className={styles.tableWrap}><table className={styles.operationsTable}><thead><tr><th>Step</th><th>Status</th><th>Attempt</th><th>AI cost</th><th>Started</th><th>Completed</th><th>Idempotency key</th></tr></thead><tbody>{run.steps.map((step) => <tr key={step.id}><td><strong>{step.label}</strong><small>{step.key}{step.error ? ` · ${step.error}` : ""}</small></td><td><OperationsBadge tone={statusTone(step.status)}>{readableStatus(step.status)}</OperationsBadge></td><td>{step.attempt}</td><td>{formatEstimatedCost(stepCost(step.output))}</td><td>{formatOperationsDate(step.startedAt)}</td><td>{formatOperationsDate(step.completedAt)}</td><td><small>{step.idempotencyKey}</small></td></tr>)}</tbody></table></div> : <p className={styles.policyHelp}>No durable steps were recorded.</p>}
        {run.error ? <p className={styles.policyHelp} role="alert">{run.error}</p> : null}
      </section>
      <div className={styles.operationsColumns}>
        <section className={styles.operationsSection} aria-labelledby="run-input-title"><div className={styles.operationsSectionHeader}><div><h2 id="run-input-title">Run input</h2><p>Canonical execution input</p></div><span>{run.idempotencyKey}</span></div><div className={styles.narrative}><pre>{json(run.input)}</pre></div></section>
        <section className={styles.operationsSection} aria-labelledby="run-output-title"><div className={styles.operationsSectionHeader}><div><h2 id="run-output-title">Output summary</h2><p>Stored conclusion, not a full AI transcript</p></div><span>Usage attached</span></div><div className={styles.narrative}><pre>{json(run.outputSummary)}</pre><pre>{json(run.usage)}</pre></div></section>
      </div>
    </>
  );
}
