import Link from "next/link";

import { decideApprovalBatchAction, decideApprovalRequestAction, executeApprovedRequestAction } from "@/app/(admin)/admin/coo-actions";
import {
  EmptyOperationsState,
  OperationsBadge,
  OperationsPageIntro,
  formatOperationsDate,
  readableStatus,
  statusTone,
} from "@/components/admin/coo-admin-ui";
import { Notice } from "@/components/admin/admin-ui";
import { IdempotencyKey } from "@/components/admin/idempotency-key";
import { SubmitButton } from "@/components/admin/submit-button";
import styles from "@/components/admin/admin.module.css";
import { requireFounderSession } from "@/lib/admin/auth";
import { listApprovalRequests } from "@/lib/coo/data";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function payloadSummary(payload: unknown) {
  if (!payload) return "No action payload";
  try {
    return JSON.stringify(payload);
  } catch {
    return "Payload is not displayable";
  }
}

export default async function AdminApprovalsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireFounderSession("operations:approve");
  const [requests, query] = await Promise.all([
    listApprovalRequests({ take: 100 }),
    searchParams,
  ]);
  const pending = requests.filter((request) => request.status === "PENDING");
  const safeBatchGroups = new Set(pending.map((request) => request.safeBatchKey).filter(Boolean)).size;
  const batches = Array.from(
    pending.reduce((groups, request) => {
      if (!request.safeBatchKey || request.risk === "DESTRUCTIVE") return groups;
      const existing = groups.get(request.safeBatchKey) ?? [];
      existing.push(request);
      groups.set(request.safeBatchKey, existing);
      return groups;
    }, new Map<string, typeof pending>()),
  ).filter(([, requests]) => requests.length > 1);

  return (
    <>
      <OperationsPageIntro
        eyebrow="Founder authority"
        title="Sensitive work stops here first."
        description="Approve or reject pricing, finance changes, external communication, contracts, destructive actions, and policy changes. An approval cannot execute against a record that changed after review."
        meta={<><OperationsBadge tone={pending.length ? "warning" : "success"}>{pending.length} pending</OperationsBadge><span>{safeBatchGroups} eligible batch groups</span></>}
      />

      {first(query.error) ? <Notice tone="error">{first(query.error)}</Notice> : null}
      {first(query.requested) ? <Notice tone="success">Destructive action requested. The source record remains unchanged until founder approval executes.</Notice> : null}
      {first(query.decided) ? <Notice tone="success">Approval decision recorded. Execution remains separately audited.</Notice> : null}
      {first(query.executionQueued) ? <Notice tone="success">Approved execution queued. Its durable run and final outcome will appear in Automations and this register.</Notice> : null}

      {batches.length ? <section className={styles.operationsSection} aria-labelledby="safe-batches-title" style={{ marginTop: 0, marginBottom: "1rem" }}>
        <div className={styles.operationsSectionHeader}><div><h2 id="safe-batches-title">Safe approval batches</h2><p>Identical, non-destructive actions only · capped by active policy</p></div><span>{batches.length} groups</span></div>
        <ul className={styles.compactRecordList}>{batches.map(([batchKey, requests]) => <li className={styles.queueItem} key={batchKey}><div><strong>{readableStatus(requests[0]?.action ?? "Batch")}</strong><p>{requests.length} identical requests · {batchKey}</p></div><form action={decideApprovalBatchAction} className={styles.approvalActions}><input type="hidden" name="safeBatchKey" value={batchKey} /><input type="hidden" name="returnTo" value="/admin/approvals" /><SubmitButton name="decision" value="APPROVE" pendingLabel="Approving…">Approve batch</SubmitButton><SubmitButton name="decision" value="REJECT" pendingLabel="Rejecting…" variant="outline">Reject batch</SubmitButton></form></li>)}</ul>
      </section> : null}

      <section className={styles.operationsSection} aria-labelledby="approval-register-title">
        <div className={styles.operationsSectionHeader}><div><h2 id="approval-register-title">Approval register</h2><p>24-hour default expiry · individual review by default</p></div><span>{requests.length} shown</span></div>
        {requests.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.operationsTable}>
              <thead><tr><th>Requested action</th><th>Risk</th><th>Status</th><th>Target</th><th>Expires</th><th>Payload</th><th>Decision</th></tr></thead>
              <tbody>{requests.map((request) => (
                <tr id={`approval-${request.id}`} key={request.id}>
                  <td><strong>{readableStatus(request.action)}</strong><small>Requested {formatOperationsDate(request.requestedAt)}{request.safeBatchKey ? ` · batch ${request.safeBatchKey}` : ""}</small></td>
                  <td><OperationsBadge tone={request.risk === "DESTRUCTIVE" ? "danger" : "warning"}>{readableStatus(request.risk)}</OperationsBadge></td>
                  <td><OperationsBadge tone={statusTone(request.status)}>{readableStatus(request.status)}</OperationsBadge></td>
                  <td><Link href={request.record.href}>{request.record.label}</Link><small>{request.entityType} · version {request.targetVersion ?? "unversioned"}</small></td>
                  <td>{formatOperationsDate(request.expiresAt)}</td>
                  <td><small>{payloadSummary(request.payload)}</small></td>
                  <td>{request.status === "PENDING" ? (
                    <form action={decideApprovalRequestAction} className={styles.approvalActions}>
                      <input type="hidden" name="approvalId" value={request.id} />
                      <input type="hidden" name="expectedVersion" value={request.version} />
                      <input type="hidden" name="returnTo" value="/admin/approvals" />
                      <SubmitButton name="decision" value="APPROVE" pendingLabel="Approving…">Approve</SubmitButton>
                      <SubmitButton name="decision" value="REJECT" pendingLabel="Rejecting…" variant="outline">Reject</SubmitButton>
                    </form>
                  ) : request.status === "APPROVED" ? (
                    <form action={executeApprovedRequestAction} className={styles.approvalActions}>
                      <IdempotencyKey prefix={`approval-execution-${request.id}`} />
                      <input type="hidden" name="approvalId" value={request.id} />
                      <input type="hidden" name="returnTo" value="/admin/approvals" />
                      <SubmitButton pendingLabel="Queueing…">Execute approved action</SubmitButton>
                    </form>
                  ) : <small>Decision closed</small>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <EmptyOperationsState title="No approval requests" description="Sensitive actions created by Trexiti will wait here until the founder decides." />}
      </section>
    </>
  );
}
