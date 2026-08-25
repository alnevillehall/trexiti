import Link from "next/link";
import { notFound } from "next/navigation";

import { decideApprovalRequestAction, executeApprovedRequestAction } from "@/app/(admin)/admin/coo-actions";
import { OperationsBadge, OperationsPageIntro, formatOperationsDate, readableStatus, statusTone } from "@/components/admin/coo-admin-ui";
import { SubmitButton } from "@/components/admin/submit-button";
import { IdempotencyKey } from "@/components/admin/idempotency-key";
import styles from "@/components/admin/admin.module.css";
import { requireFounderSession } from "@/lib/admin/auth";
import { getApprovalById } from "@/lib/coo/data";

function json(value: unknown) {
  try { return JSON.stringify(value, null, 2); } catch { return "Unavailable"; }
}

export default async function AdminApprovalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireFounderSession("operations:approve");
  const { id } = await params;
  const request = await getApprovalById(id);
  if (!request) notFound();

  return (
    <>
      <OperationsPageIntro eyebrow="Approval record" title={readableStatus(request.action)} description={`${request.entityType} · requested ${formatOperationsDate(request.requestedAt)}`} meta={<><OperationsBadge tone={statusTone(request.status)}>{readableStatus(request.status)}</OperationsBadge><Link href="/admin/approvals">Back to approvals</Link></>} />
      <div className={styles.operationsColumns}>
        <section className={styles.operationsSection} aria-labelledby="approval-payload-title" style={{ marginTop: 0 }}><div className={styles.operationsSectionHeader}><h2 id="approval-payload-title">Proposed action payload</h2><OperationsBadge tone={request.risk === "DESTRUCTIVE" ? "danger" : "warning"}>{readableStatus(request.risk)}</OperationsBadge></div><div className={styles.narrative}><pre>{json(request.payload)}</pre></div></section>
        <section className={styles.operationsSection} aria-labelledby="approval-snapshot-title" style={{ marginTop: 0 }}><div className={styles.operationsSectionHeader}><h2 id="approval-snapshot-title">Target snapshot</h2><span>Version {request.targetVersion ?? "unversioned"}</span></div><div className={styles.narrative}><pre>{json(request.targetSnapshot)}</pre></div></section>
      </div>
      {request.status === "PENDING" ? <section className={styles.operationsSection} aria-labelledby="approval-decision-title"><div className={styles.operationsSectionHeader}><div><h2 id="approval-decision-title">Founder decision</h2><p>Approval expires {formatOperationsDate(request.expiresAt)}</p></div></div><form action={decideApprovalRequestAction} className={styles.operationsForm}>
        <input type="hidden" name="approvalId" value={request.id} /><input type="hidden" name="expectedVersion" value={request.version} /><input type="hidden" name="returnTo" value={`/admin/approvals/${request.id}`} />
        <label className={styles.formWide}>Reason<textarea name="reason" required minLength={3} maxLength={1000} placeholder="Record why this action should or should not proceed." /></label>
        <div className={styles.formActions}><SubmitButton name="decision" value="APPROVE" pendingLabel="Approving…">Approve</SubmitButton><SubmitButton name="decision" value="REJECT" pendingLabel="Rejecting…" variant="outline">Reject</SubmitButton></div>
      </form></section> : null}
      {request.status === "APPROVED" ? <section className={styles.operationsSection} aria-labelledby="approval-execution-title"><div className={styles.operationsSectionHeader}><div><h2 id="approval-execution-title">Approved execution</h2><p>Retry the durable execution after guarded mode is enabled or a transient launch failure is resolved.</p></div></div><form action={executeApprovedRequestAction} className={styles.approvalActions}>
        <IdempotencyKey prefix={`approval-execution-${request.id}`} /><input type="hidden" name="approvalId" value={request.id} /><input type="hidden" name="returnTo" value={`/admin/approvals/${request.id}`} />
        <SubmitButton pendingLabel="Queueing…">Execute approved action</SubmitButton>
      </form></section> : null}
    </>
  );
}
