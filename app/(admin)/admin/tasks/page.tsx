import Link from "next/link";

import { createTaskAction, updateTaskStatusAction } from "@/app/(admin)/admin/actions";
import { AdminPageHeader, EmptyAdminState, Notice, PriorityBadge, TaskStatus } from "@/components/admin/admin-ui";
import styles from "@/components/admin/admin.module.css";
import { formatAdminDate, taskPriorities, taskPriorityLabels, taskTypes, taskTypeLabels } from "@/lib/admin/crm";
import { getAdminTasks } from "@/lib/admin/queries";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminTasksPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const requestedPage = Number(first(params.page) ?? 1);
  const data = await getAdminTasks(
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
  );
  const error = first(params.error);
  const returnTo = `/admin/tasks?page=${data.page}`;

  return (
    <>
      <AdminPageHeader
        eyebrow="Follow-up discipline"
        title="Tasks"
        description="Calls, emails, research, proposals, meetings, and follow-ups ordered by status, due date, and commercial priority."
        action={{ href: "#new-task", label: "Create task" }}
      />
      {error ? <Notice tone="error">{error}</Notice> : null}
      {params.taskCreated ? <Notice tone="success">Task created and assigned.</Notice> : null}

      <details className={styles.formPanel} id="new-task" open={Boolean(error)}>
        <summary>Create follow-up task</summary>
        <form action={createTaskAction} className={styles.formGrid}>
          <input type="hidden" name="returnTo" value={returnTo} />
          <label className={styles.field}>Type<select name="type" defaultValue="FOLLOW_UP">{taskTypes.map((type) => <option key={type} value={type}>{taskTypeLabels[type]}</option>)}</select></label>
          <label className={styles.field}>Priority<select name="priority" defaultValue="MEDIUM">{taskPriorities.map((priority) => <option key={priority} value={priority}>{taskPriorityLabels[priority]}</option>)}</select></label>
          <label className={styles.field}>Due · Jamaica<input name="dueAt" type="datetime-local" required /></label>
          <label className={styles.field}>Opportunity<select name="opportunityId" defaultValue=""><option value="">No linked opportunity</option>{data.opportunities.map((item) => <option key={item.id} value={item.id}>{item.reference} · {item.title}</option>)}</select></label>
          <label className={styles.field}>Company<select name="companyId" defaultValue=""><option value="">Use opportunity company</option>{data.companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
          <label className={styles.field}>Title<input name="title" required maxLength={180} /></label>
          <label className={styles.fieldFull}>Notes<textarea name="notes" /></label>
          <div className={styles.formActions}><button className={styles.primaryButton} type="submit">Create task</button></div>
        </form>
      </details>

      <section className={styles.panel} style={{ marginTop: "1rem" }} aria-labelledby="task-table-title">
        <div className={styles.panelHeader}><h2 id="task-table-title">Operational task list</h2><span>{data.total} tasks · page {data.page}/{data.pageCount}</span></div>
        {data.tasks.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Task</th><th>Type</th><th>Account</th><th>Due</th><th>Priority</th><th>Status</th><th>Owner</th><th>Update</th></tr></thead>
              <tbody>{data.tasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.title}<span className={styles.subtle}>{task.notes ?? "No notes"}</span></td>
                  <td>{taskTypeLabels[task.type]}</td>
                  <td>{task.opportunity ? <Link href={`/admin/leads/${task.opportunity.id}`}>{task.opportunity.reference}</Link> : task.company?.name ?? "Internal"}<span className={styles.subtle}>{task.company?.name}</span></td>
                  <td>{formatAdminDate(task.dueAt)}</td>
                  <td><PriorityBadge priority={task.priority} /></td>
                  <td><TaskStatus status={task.status} /></td>
                  <td>{task.owner.name}</td>
                  <td>
                    <form action={updateTaskStatusAction}>
                      <input type="hidden" name="taskId" value={task.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <select name="status" defaultValue={task.status} aria-label={`Status for ${task.title}`}>
                        <option value="TODO">To do</option><option value="IN_PROGRESS">In progress</option><option value="DONE">Done</option><option value="CANCELLED">Cancelled</option>
                      </select>
                      <button className={styles.textButton} type="submit">Save</button>
                    </form>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <EmptyAdminState>No tasks are recorded.</EmptyAdminState>}
        {data.pageCount > 1 ? (
          <nav className={styles.pagination} aria-label="Task pages">
            {data.page > 1 ? <Link href={`/admin/tasks?page=${data.page - 1}`}>Previous</Link> : <span>Previous</span>}
            <span>Page {data.page} of {data.pageCount}</span>
            {data.page < data.pageCount ? <Link href={`/admin/tasks?page=${data.page + 1}`}>Next</Link> : <span>Next</span>}
          </nav>
        ) : null}
      </section>
    </>
  );
}
