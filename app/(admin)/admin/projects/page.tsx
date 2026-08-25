import Link from "next/link";

import { createAdminMilestoneAction, createAdminProjectAction } from "@/app/(admin)/admin/coo-actions";
import {
  EmptyOperationsState,
  OperationsBadge,
  OperationsPageIntro,
  formatOperationsDate,
  readableStatus,
} from "@/components/admin/coo-admin-ui";
import { Notice } from "@/components/admin/admin-ui";
import { IdempotencyKey } from "@/components/admin/idempotency-key";
import { SubmitButton } from "@/components/admin/submit-button";
import styles from "@/components/admin/admin.module.css";
import { requireFounderSession } from "@/lib/admin/auth";
import { listClients, listProjects } from "@/lib/coo/data";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminProjectsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireFounderSession();
  const [projects, clients, query] = await Promise.all([
    listProjects({ take: 100 }),
    listClients({ take: 100 }),
    searchParams,
  ]);
  const atRisk = projects.filter((project) => project.health === "AT_RISK").length;
  const attention = projects.filter((project) => project.health === "ATTENTION").length;
  const milestones = projects.flatMap((project) => project.milestones.map((milestone) => ({ ...milestone, projectTitle: project.title })));

  return (
    <>
      <OperationsPageIntro
        eyebrow="Delivery operations"
        title="Projects reveal risk before deadlines do."
        description="Track owners, progress, blockers, dependencies, milestones, and client delivery dates. Health comes from explicit rules and can never be silently invented by AI."
        meta={<><OperationsBadge tone={atRisk ? "danger" : attention ? "warning" : "success"}>{atRisk} at risk · {attention} attention</OperationsBadge><span>{projects.length} delivery projects</span></>}
      />

      {first(query.error) ? <Notice tone="error">{first(query.error)}</Notice> : null}
      {first(query.projectCreated) ? <Notice tone="success">Project created and linked to its client record.</Notice> : null}
      {first(query.milestoneCreated) ? <Notice tone="success">Milestone added. Project health has been recalculated.</Notice> : null}

      <div className={styles.operationsColumns}>
        <details className={styles.formPanel} open={first(query.form) === "project"}>
          <summary>Create delivery project</summary>
          <form action={createAdminProjectAction} className={styles.operationsForm}>
            <IdempotencyKey prefix="project" />
            <input type="hidden" name="returnTo" value="/admin/projects?form=project" />
            <label>Client<select name="companyId" required defaultValue=""><option value="" disabled>Select a client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
            <label>Title<input name="title" required maxLength={180} /></label>
            <label>Status<select name="status" defaultValue="ACTIVE"><option value="PLANNED">Planned</option><option value="ACTIVE">Active</option><option value="ON_HOLD">On hold</option></select></label>
            <label>Start date<input name="startAt" type="date" /></label>
            <label>Target completion<input name="targetEndAt" type="date" /></label>
            <label className={styles.formWide}>Description<textarea name="description" maxLength={4000} /></label>
            <div className={styles.formActions}><span>Projects are internal operational records and can be created without a sensitive-action approval.</span><SubmitButton pendingLabel="Creating…">Create project</SubmitButton></div>
          </form>
        </details>

        <details className={styles.formPanel} open={first(query.form) === "milestone"}>
          <summary>Add project milestone</summary>
          <form action={createAdminMilestoneAction} className={styles.operationsForm}>
            <IdempotencyKey prefix="milestone" />
            <input type="hidden" name="returnTo" value="/admin/projects?form=milestone" />
            <label>Project<select name="projectId" required defaultValue=""><option value="" disabled>Select a project</option>{projects.filter((project) => !["COMPLETED", "CANCELLED"].includes(project.status)).map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>
            <label>Title<input name="title" required maxLength={180} /></label>
            <label>Status<select name="status" defaultValue="NOT_STARTED"><option value="NOT_STARTED">Not started</option><option value="IN_PROGRESS">In progress</option><option value="BLOCKED">Blocked</option></select></label>
            <label>Due date<input name="dueAt" type="date" /></label>
            <label>Depends on<select name="dependencyMilestoneId" defaultValue=""><option value="">No dependency</option>{milestones.map((milestone) => <option key={milestone.id} value={milestone.id}>{milestone.projectTitle} · {milestone.title}</option>)}</select></label>
            <label>Sort order<input name="sortOrder" type="number" min={0} defaultValue={milestones.length} /></label>
            <label className={styles.formWide}>Description<textarea name="description" maxLength={2000} /></label>
            <div className={styles.formActions}><span>Blocked and overdue dependencies become explicit project risk signals.</span><SubmitButton pendingLabel="Adding…">Add milestone</SubmitButton></div>
          </form>
        </details>
      </div>

      <section className={styles.operationsSection} aria-labelledby="project-register-title">
        <div className={styles.operationsSectionHeader}><div><h2 id="project-register-title">Delivery register</h2><p>Risk links directly to milestone and update evidence</p></div><span>{projects.length} projects</span></div>
        {projects.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.operationsTable}>
              <thead><tr><th>Project / client</th><th>Health</th><th>Risk evidence</th><th>Progress</th><th>Target</th><th>Owner / update</th><th>Milestones</th></tr></thead>
              <tbody>{projects.map((project) => (
                <tr id={`project-${project.id}`} key={project.id}>
                  <td><Link href={project.record.href}>{project.title}</Link><small>{project.companyName} · {readableStatus(project.status)}</small></td>
                  <td><OperationsBadge tone={project.health === "AT_RISK" ? "danger" : project.health === "ATTENTION" ? "warning" : "success"}>{readableStatus(project.health)}</OperationsBadge></td>
                  <td>{project.riskReasons.length ? project.riskReasons.map(readableStatus).join(" · ") : "No active risk rule"}{project.activeBlocker ? <small role="alert">Blocker: {project.activeBlocker}</small> : null}</td>
                  <td><strong>{project.progressPercent}%</strong><div className={styles.progressTrack} aria-label={`${project.progressPercent}% complete`}><span style={{ width: `${Math.max(0, Math.min(100, project.progressPercent))}%` }} /></div></td>
                  <td>{formatOperationsDate(project.targetEndAt, false)}</td>
                  <td>{project.ownerName ?? "Unassigned"}<small>{project.lastProgressAt ? `Updated ${formatOperationsDate(project.lastProgressAt)}` : "No progress update"}</small></td>
                  <td>{project.milestones.length}<small>{project.milestones.filter((milestone) => milestone.status === "BLOCKED").length} blocked · {project.milestones.filter((milestone) => milestone.status === "COMPLETED").length} complete</small></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <EmptyOperationsState title="No delivery projects yet" description="Add the first real client project above; Trexiti will not fabricate demonstration records." />}
      </section>
    </>
  );
}
