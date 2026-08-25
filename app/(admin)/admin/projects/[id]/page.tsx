import Link from "next/link";
import { notFound } from "next/navigation";

import {
  addAdminProjectUpdateAction,
  createAdminMilestoneAction,
  updateAdminMilestoneAction,
  updateAdminProjectStatusAction,
} from "@/app/(admin)/admin/coo-actions";
import { Notice } from "@/components/admin/admin-ui";
import { OperationsBadge, OperationsPageIntro, formatOperationsDate, readableStatus } from "@/components/admin/coo-admin-ui";
import { SubmitButton } from "@/components/admin/submit-button";
import { IdempotencyKey } from "@/components/admin/idempotency-key";
import styles from "@/components/admin/admin.module.css";
import { requireFounderSession } from "@/lib/admin/auth";
import { getProjectById } from "@/lib/coo/data";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function dateInput(value: string | null) {
  return value?.slice(0, 10) ?? "";
}

export default async function AdminProjectDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SearchParams }) {
  await requireFounderSession();
  const { id } = await params;
  const [project, query] = await Promise.all([getProjectById(id), searchParams]);
  if (!project) notFound();

  return (
    <>
      <OperationsPageIntro
        eyebrow="Delivery record"
        title={project.title}
        description={`${project.companyName} · ${project.ownerName ?? "Unassigned owner"}`}
        meta={<><OperationsBadge tone={project.health === "AT_RISK" ? "danger" : project.health === "ATTENTION" ? "warning" : "success"}>{readableStatus(project.health)}</OperationsBadge><Link href="/admin/projects">Back to projects</Link></>}
      />

      {first(query.error) ? <Notice tone="error">{first(query.error)}</Notice> : null}
      {first(query.updateAdded) ? <Notice tone="success">Project update recorded and delivery risk recalculated.</Notice> : null}
      {first(query.milestoneCreated) ? <Notice tone="success">Milestone added.</Notice> : null}
      {first(query.projectUpdated) ? <Notice tone="success">Project status and target date updated.</Notice> : null}
      {first(query.milestoneUpdated) ? <Notice tone="success">Milestone status updated and delivery risk recalculated.</Notice> : null}

      <dl className={styles.operationsKpiGrid}>
        <div className={styles.operationsKpi}><dt>Status</dt><dd><span>{readableStatus(project.status)}</span><small>{project.progressPercent}% complete</small></dd></div>
        <div className={styles.operationsKpi}><dt>Target completion</dt><dd><span>{formatOperationsDate(project.targetEndAt, false)}</span><small>Deadline signals use the active policy</small></dd></div>
        <div className={styles.operationsKpi}><dt>Last progress</dt><dd><span>{formatOperationsDate(project.lastProgressAt)}</span><small>Stale after the policy threshold</small></dd></div>
        <div className={styles.operationsKpi}><dt>Milestones</dt><dd><span>{project.milestones.length}</span><small>{project.milestones.filter((item) => item.status === "BLOCKED").length} blocked</small></dd></div>
      </dl>

      <details className={styles.formPanel}>
        <summary>Update project status</summary>
        <form action={updateAdminProjectStatusAction} className={styles.operationsForm}>
          <IdempotencyKey prefix={`project-status-${project.id}-${project.version}`} />
          <input type="hidden" name="projectId" value={project.id} />
          <input type="hidden" name="expectedVersion" value={project.version} />
          <input type="hidden" name="returnTo" value={`/admin/projects/${project.id}`} />
          <label>Status<select name="status" defaultValue={project.status}><option value="PLANNED">Planned</option><option value="ACTIVE">Active</option><option value="ON_HOLD">On hold</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></select></label>
          <label>Target completion<input name="targetEndAt" type="date" defaultValue={dateInput(project.targetEndAt)} /></label>
          <div className={styles.formActions}><span>Completion sets progress to 100%. Concurrent edits are rejected.</span><SubmitButton pendingLabel="Updating…">Update project</SubmitButton></div>
        </form>
      </details>

      {project.riskReasons.length || project.activeBlocker ? (
        <section className={styles.operationsSection} aria-labelledby="project-risk-title">
          <div className={styles.operationsSectionHeader}><div><h2 id="project-risk-title">Risk evidence</h2><p>Direct inputs to the project health rule</p></div><OperationsBadge tone="danger">Needs attention</OperationsBadge></div>
          <ul className={styles.compactRecordList}>{project.riskReasons.map((reason) => <li className={styles.queueItem} key={reason}><div><strong>{readableStatus(reason)}</strong></div></li>)}{project.activeBlocker ? <li className={styles.queueItem}><div><strong>Active blocker</strong><p>{project.activeBlocker}</p></div></li> : null}</ul>
        </section>
      ) : null}

      <div className={styles.operationsColumnsWide}>
        <section className={styles.operationsSection} aria-labelledby="milestones-title" style={{ marginTop: 0 }}>
          <div className={styles.operationsSectionHeader}><div><h2 id="milestones-title">Milestones</h2><p>Deadlines, blockers, and dependencies</p></div><span>{project.milestones.length}</span></div>
          {project.milestones.length ? <div className={styles.tableWrap}><table className={styles.operationsTable}><thead><tr><th>Milestone</th><th>Status</th><th>Due</th><th>Blocker</th></tr></thead><tbody>{project.milestones.map((milestone) => <tr key={milestone.id}><td><strong>{milestone.title}</strong></td><td><OperationsBadge tone={milestone.status === "BLOCKED" ? "danger" : milestone.status === "COMPLETED" ? "success" : "neutral"}>{readableStatus(milestone.status)}</OperationsBadge></td><td>{formatOperationsDate(milestone.dueAt, false)}</td><td>{milestone.blocker ?? "—"}</td></tr>)}</tbody></table></div> : null}
        </section>

        <details className={styles.formPanel} open>
          <summary>Add milestone</summary>
          <form action={createAdminMilestoneAction} className={styles.operationsForm}>
            <IdempotencyKey prefix={`milestone-${project.id}`} />
            <input type="hidden" name="projectId" value={project.id} />
            <input type="hidden" name="returnTo" value={`/admin/projects/${project.id}`} />
            <label className={styles.formWide}>Title<input name="title" required maxLength={180} /></label>
            <label>Status<select name="status" defaultValue="NOT_STARTED"><option value="NOT_STARTED">Not started</option><option value="IN_PROGRESS">In progress</option><option value="BLOCKED">Blocked</option></select></label>
            <label>Due date<input name="dueAt" type="date" /></label>
            <label>Depends on<select name="dependencyMilestoneId" defaultValue=""><option value="">No dependency</option>{project.milestones.map((milestone) => <option key={milestone.id} value={milestone.id}>{milestone.title}</option>)}</select></label>
            <label className={styles.formWide}>Description<textarea name="description" /></label>
            <div className={styles.formActions}><SubmitButton pendingLabel="Adding…">Add milestone</SubmitButton></div>
          </form>
        </details>
      </div>

      {project.milestones.length ? (
        <details className={styles.formPanel}>
          <summary>Update milestone status</summary>
          <div className={styles.milestoneEditorList}>
            {project.milestones.map((milestone) => (
              <form action={updateAdminMilestoneAction} className={`${styles.operationsForm} ${styles.milestoneEditor}`} key={milestone.id}>
                <IdempotencyKey prefix={`milestone-status-${milestone.id}-${milestone.version}`} />
                <input type="hidden" name="milestoneId" value={milestone.id} />
                <input type="hidden" name="expectedVersion" value={milestone.version} />
                <input type="hidden" name="returnTo" value={`/admin/projects/${project.id}`} />
                <strong className={styles.formWide}>{milestone.title}</strong>
                <label>Status<select name="status" defaultValue={milestone.status}><option value="NOT_STARTED">Not started</option><option value="IN_PROGRESS">In progress</option><option value="BLOCKED">Blocked</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></select></label>
                <label>Due date<input name="dueAt" type="date" defaultValue={dateInput(milestone.dueAt)} /></label>
                <label>Blocker<input name="blocker" maxLength={1000} defaultValue={milestone.blocker ?? ""} placeholder="Required context when blocked" /></label>
                <div className={`${styles.formActions} ${styles.formWide}`}><span>Changing this recalculates project and client risk.</span><SubmitButton pendingLabel="Updating…">Update milestone</SubmitButton></div>
              </form>
            ))}
          </div>
        </details>
      ) : null}

      <div className={styles.operationsColumnsWide}>
        <details className={styles.formPanel} open>
          <summary>Record project update</summary>
          <form action={addAdminProjectUpdateAction} className={styles.operationsForm}>
            <IdempotencyKey prefix={`project-update-${project.id}`} />
            <input type="hidden" name="projectId" value={project.id} />
            <input type="hidden" name="returnTo" value={`/admin/projects/${project.id}`} />
            <label>Progress percent<input name="progressPercent" type="number" min="0" max="100" defaultValue={project.progressPercent} /></label>
            <label className={styles.formWide}>Active blocker<input name="activeBlocker" maxLength={1000} defaultValue={project.activeBlocker ?? ""} placeholder="Leave blank to clear the active blocker" /></label>
            <label className={styles.formWide}>Update summary<textarea name="summary" required minLength={3} maxLength={5000} /></label>
            <div className={styles.formActions}><span>This updates delivery freshness, progress, and the active blocker signal.</span><SubmitButton pendingLabel="Recording…">Record update</SubmitButton></div>
          </form>
        </details>

        <section className={styles.operationsSection} aria-labelledby="project-updates-title" style={{ marginTop: 0 }}>
          <div className={styles.operationsSectionHeader}><div><h2 id="project-updates-title">Update history</h2><p>Most recent recorded progress and blocker evidence</p></div><span>{project.updates.length} recent</span></div>
          {project.updates.length ? <ul className={styles.compactRecordList}>{project.updates.map((update) => <li className={styles.queueItem} key={update.id}><div><strong>{update.summary}</strong><p>{update.authorName ?? "System"} · {formatOperationsDate(update.createdAt)}{update.progressPercent === null ? "" : ` · ${update.progressPercent}%`}</p></div></li>)}</ul> : <p className={styles.policyHelp}>No progress updates have been recorded yet.</p>}
        </section>
      </div>
    </>
  );
}
