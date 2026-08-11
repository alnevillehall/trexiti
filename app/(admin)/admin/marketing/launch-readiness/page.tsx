import {
  MarketingLaunchChecklistStatus,
} from "@prisma/client";

import { updateMarketingLaunchChecklistAction } from "@/app/(admin)/admin/marketing/actions";
import { AdminPageHeader, EmptyAdminState } from "@/components/admin/admin-ui";
import adminStyles from "@/components/admin/admin.module.css";
import styles from "@/components/admin/marketing.module.css";
import { requireAdminSession } from "@/lib/admin/auth";
import { formatJamaicaDateTime, marketingLabel } from "@/lib/admin/marketing";
import { getMarketingLaunchReadiness } from "@/lib/admin/marketing-queries";
import { hasAdminPermission } from "@/lib/admin/permissions";

export default async function MarketingLaunchReadinessPage() {
  const [session, data] = await Promise.all([
    requireAdminSession("marketing:view"),
    getMarketingLaunchReadiness(),
  ]);
  const canManage = hasAdminPermission(session.role, "marketing:manage");
  const completed = data.checklist.filter(
    (item) => item.status === "COMPLETE",
  ).length;
  const blocked = data.checklist.filter(
    (item) => item.status === "BLOCKED",
  ).length;

  return (
    <>
      <AdminPageHeader
        eyebrow="Marketing OS / Launch control"
        title="Week 1 launch readiness."
        description="Manual profile, asset and channel work remains explicit. Seed refreshes never mark these tasks complete or overwrite evidence entered by the team."
      />

      <section className={styles.statStrip} aria-label="Launch readiness status">
        <div className={styles.stat}><span>Checklist items</span><strong>{data.checklist.length}</strong></div>
        <div className={styles.stat}><span>Complete / manual</span><strong>{completed}</strong></div>
        <div className={styles.stat}><span>Blocked</span><strong>{blocked}</strong></div>
        <div className={styles.stat}><span>Approved sources</span><strong>{data.sources.length}</strong></div>
      </section>

      <section className={`${styles.panel} ${styles.topGap}`} aria-labelledby="launch-source-title">
        <div className={styles.panelHeader}>
          <h2 id="launch-source-title">Approved launch-pack sources</h2>
          <p>SHA-256 recorded by the idempotent seed</p>
        </div>
        <div className={styles.list}>
          {data.sources.map((source) => (
            <div className={styles.listItem} key={source.id}>
              <div>
                <strong>{source.path}</strong>
                <small>{source.notes}</small>
              </div>
              <code className={styles.sourceHash}>{source.sha256.slice(0, 12)}</code>
            </div>
          ))}
          {!data.sources.length ? (
            <EmptyAdminState>
              Run the approved Week 1 seed to register source files.
            </EmptyAdminState>
          ) : null}
        </div>
      </section>

      <section className={`${styles.panel} ${styles.topGap}`} aria-labelledby="manual-checklist-title">
        <div className={styles.panelHeader}>
          <h2 id="manual-checklist-title">External manual checklist</h2>
          <p>Nothing is completed automatically</p>
        </div>
        <div className={styles.launchChecklist}>
          {data.checklist.map((item) => (
            <form
              action={updateMarketingLaunchChecklistAction}
              className={styles.launchItem}
              key={item.id}
            >
              <input name="id" type="hidden" value={item.id} />
              <div className={styles.launchItemHeader}>
                <div>
                  <span>{item.category}</span>
                  <h2>{item.title}</h2>
                  <small>Due {item.dueAt ? formatJamaicaDateTime(item.dueAt) : "during Week 1"}</small>
                </div>
                <span className={styles.status} data-status={item.status.toLowerCase()}>
                  {marketingLabel(item.status)}
                </span>
              </div>
              <div className={styles.launchFields}>
                <label className={styles.inlineField}>
                  Status
                  <select defaultValue={item.status} disabled={!canManage} name="status">
                    {Object.values(MarketingLaunchChecklistStatus).map((status) => (
                      <option key={status} value={status}>{marketingLabel(status)}</option>
                    ))}
                  </select>
                </label>
                <label className={styles.inlineField}>
                  Evidence URL
                  <input
                    defaultValue={item.evidenceUrl ?? ""}
                    disabled={!canManage}
                    name="evidenceUrl"
                    placeholder="Add only the real public URL"
                    type="url"
                  />
                </label>
                <label className={`${styles.inlineField} ${styles.launchNotes}`}>
                  Notes / decision
                  <textarea
                    defaultValue={item.notes ?? ""}
                    disabled={!canManage}
                    name="notes"
                    placeholder="Record the manual action, blocker, or eligibility decision."
                    rows={3}
                  />
                </label>
                {canManage ? (
                  <button className={adminStyles.secondaryButton} type="submit">
                    Save manual status
                  </button>
                ) : null}
              </div>
            </form>
          ))}
          {!data.checklist.length ? (
            <EmptyAdminState>
              Run the Week 1 seed. Checklist tasks remain not started until a person updates them.
            </EmptyAdminState>
          ) : null}
        </div>
      </section>
    </>
  );
}
