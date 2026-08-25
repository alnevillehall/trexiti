import { saveOperationsPolicyAction } from "@/app/(admin)/admin/coo-actions";
import { OperationsBadge, OperationsPageIntro, formatOperationsDate, readableStatus } from "@/components/admin/coo-admin-ui";
import { Notice } from "@/components/admin/admin-ui";
import { SubmitButton } from "@/components/admin/submit-button";
import { IdempotencyKey } from "@/components/admin/idempotency-key";
import styles from "@/components/admin/admin.module.css";
import { requireFounderSession } from "@/lib/admin/auth";
import { getActivePolicy } from "@/lib/coo/data";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminOperationsPolicyPage({ searchParams }: { searchParams: SearchParams }) {
  await requireFounderSession("operations:policy");
  const [policy, query] = await Promise.all([getActivePolicy(), searchParams]);

  return (
    <>
      <OperationsPageIntro
        eyebrow="Operating guardrails"
        title="Rules first. AI explains the exceptions."
        description="These versioned thresholds determine risk, freshness, prospect quality, safe batch size, approval expiry, and whether automation is off, observing, or guarded."
        meta={<><OperationsBadge tone={policy.automationMode === "GUARDED" ? "success" : policy.automationMode === "SHADOW" ? "warning" : "danger"}>{readableStatus(policy.automationMode)} effective</OperationsBadge><span>Active policy v{policy.version} · {formatOperationsDate(policy.activatedAt)}</span></>}
      />

      {first(query.error) ? <Notice tone="error">{first(query.error)}</Notice> : null}
      {first(query.approvalRequested) ? <Notice tone="success">Policy change approval requested. The active policy remains unchanged until approval and execution complete.</Notice> : null}

      <form action={saveOperationsPolicyAction} className={styles.policyGrid}>
        <IdempotencyKey prefix="policy-approval" />
        <input type="hidden" name="returnTo" value="/admin/operations-policy" />
        <input type="hidden" name="currentVersion" value={policy.version} />

        <section className={styles.operationsSection} aria-labelledby="policy-mode-title" style={{ marginTop: 0 }}>
          <div className={styles.operationsSectionHeader}><div><h2 id="policy-mode-title">Authority and freshness</h2><p>Production safety controls</p></div><OperationsBadge tone="warning">Sensitive change</OperationsBadge></div>
          <div className={styles.operationsForm}>
            <label className={styles.formWide}>Policy name<input name="name" required maxLength={120} defaultValue={policy.name} /></label>
            <label>Configured automation mode<select name="automationMode" defaultValue={policy.configuredAutomationMode}><option value="OFF">Off</option><option value="SHADOW">Shadow</option><option value="GUARDED">Guarded</option></select></label>
            <label>Freshness window (minutes)<input name="freshnessMinutes" type="number" min={5} max={1440} defaultValue={policy.freshnessMinutes} required /></label>
            <label>Approval expiry (hours)<input name="approvalExpiryHours" type="number" min={1} max={168} defaultValue={policy.approvalExpiryHours} required /></label>
            <label>Safe batch limit<input name="safeBatchLimit" type="number" min={1} max={25} defaultValue={policy.safeBatchLimit} required /></label>
          </div>
          <p className={styles.policyHelp}>Effective mode: {readableStatus(policy.automationMode)}. Runtime ceiling: {readableStatus(policy.runtimeAutomationMode)}. Configured policy: {readableStatus(policy.configuredAutomationMode)}. Off disables automated execution. Shadow records what Trexiti would do. Guarded executes only allow-listed internal work and still routes sensitive actions to approval.</p>
        </section>

        <section className={styles.operationsSection} aria-labelledby="policy-risk-title" style={{ marginTop: 0 }}>
          <div className={styles.operationsSectionHeader}><div><h2 id="policy-risk-title">Delivery and prioritization</h2><p>Editable deterministic thresholds</p></div><span>New version after approval</span></div>
          <div className={styles.operationsForm}>
            <label>Deadline horizon (hours)<input name="projectDeadlineHours" type="number" min={1} max={720} defaultValue={policy.projectDeadlineHours} required /></label>
            <label>Stale progress (days)<input name="staleProgressDays" type="number" min={1} max={90} defaultValue={policy.staleProgressDays} required /></label>
            <label>Founder priorities<input name="maxFounderPriorities" type="number" min={1} max={5} defaultValue={Math.min(policy.maxFounderPriorities, 5)} required /></label>
            <label>Daily prospect minimum<input name="prospectDailyMinimum" type="number" min={1} max={100} defaultValue={policy.prospectDailyMinimum} required /></label>
            <label>Daily prospect maximum<input name="prospectDailyMaximum" type="number" min={1} max={100} defaultValue={policy.prospectDailyMaximum} required /></label>
          </div>
          <p className={styles.policyHelp}>The prospect minimum is a target, not a quota: the workflow must stop below it rather than admit weak or unverified records.</p>
        </section>

        <div className={styles.formActions}>
          <span>Approval and successful execution will create policy v{policy.version + 1}; prior briefs and runs retain their policy provenance.</span>
          <SubmitButton pendingLabel="Requesting…">Request policy change</SubmitButton>
        </div>
      </form>
    </>
  );
}
