import Link from "next/link";

import {
  markMessageActionedAction,
  updateDailyTargetsAction,
} from "@/app/(admin)/admin/actions";
import { AdminPageHeader, EmptyAdminState, Notice, PriorityBadge, StageBadge } from "@/components/admin/admin-ui";
import styles from "@/components/admin/admin.module.css";
import {
  formatAdminCurrency,
  formatAdminDate,
  opportunityStageLabels,
} from "@/lib/admin/crm";
import { getAdminDashboard } from "@/lib/admin/queries";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminDashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const [query, dashboard] = await Promise.all([
    searchParams,
    getAdminDashboard(),
  ]);
  const {
    metrics,
    stageGroups,
    dueTasks,
    recentOpportunities,
    dailySales,
    dailyTarget,
    repliesNeedingAction,
  } = dashboard;
  const maxStageCount = Math.max(...stageGroups.map((item) => item.count), 1);

  const metricItems = [
    ["New leads", metrics.newLeads.toLocaleString()],
    ["Qualified leads", metrics.qualifiedLeads.toLocaleString()],
    ["Discovery calls", metrics.discoveryCalls.toLocaleString()],
    ["Proposals sent", metrics.proposalsSent.toLocaleString()],
    ["Deals won", metrics.dealsWon.toLocaleString()],
    ["Pipeline value", formatAdminCurrency(metrics.pipelineValue)],
    ["Average project value", formatAdminCurrency(metrics.averageProjectValue)],
    ["Conversion rate", `${metrics.conversionRate.toFixed(1)}%`],
    ["Expected revenue", formatAdminCurrency(metrics.expectedRevenue)],
  ] as const;
  const dailyMetricItems = [
    ["Today’s follow-ups", dailySales.todaysFollowUps.toLocaleString()],
    ["New target accounts", dailySales.newTargetAccounts.toLocaleString()],
    ["Hot opportunities", dailySales.hotOpportunities.toLocaleString()],
    ["Replies needing action", dailySales.repliesNeedingAction.toLocaleString()],
    ["Upcoming meetings", dailySales.upcomingMeetings.toLocaleString()],
    ["Proposals awaiting decision", dailySales.proposalsAwaitingDecision.toLocaleString()],
    ["Pipeline value", formatAdminCurrency(dailySales.pipelineValue)],
  ] as const;
  const targetItems = [
    {
      label: "Research",
      completed: dailyTarget.researchCompleted,
      target: dailyTarget.researchTarget,
    },
    {
      label: "New personalized outreach",
      completed: dailyTarget.personalizedOutreachCompleted,
      target: dailyTarget.personalizedOutreachTarget,
    },
    {
      label: "Follow-ups",
      completed: dailyTarget.followUpsCompleted,
      target: dailyTarget.followUpTarget,
    },
  ] as const;

  return (
    <>
      <AdminPageHeader
        eyebrow="Daily sales command centre"
        title="Quality outreach, worked deliberately."
        description="Today’s researched accounts, personalized outreach, follow-ups, replies, meetings, proposals, and pipeline—without bulk-send mechanics."
        action={{ href: "/admin/accounts#new-prospect", label: "Research target account" }}
      />

      {query.targetsSaved ? <Notice tone="success">Daily targets updated.</Notice> : null}

      <dl className={styles.metricsGrid}>
        {dailyMetricItems.map(([label, number]) => (
          <div className={styles.metric} key={label}>
            <dt>{label}</dt>
            <dd>{number}</dd>
          </div>
        ))}
      </dl>

      <div className={styles.dashboardGrid}>
        <section className={styles.panel} aria-labelledby="daily-target-title">
          <div className={styles.panelHeader}>
            <h2 id="daily-target-title">Daily target</h2>
            <span>Configured per operator</span>
          </div>
          <div className={styles.chart}>
            {targetItems.map((item) => (
              <div className={styles.chartRow} key={item.label}>
                <span>{item.label}</span>
                <div className={styles.chartTrack} aria-hidden="true">
                  <div
                    className={styles.chartBar}
                    style={{ width: `${Math.min(100, (item.completed / item.target) * 100)}%` }}
                  />
                </div>
                <strong>{item.completed}/{item.target}</strong>
              </div>
            ))}
          </div>
          <details className={styles.inlineDetails}>
            <summary>Configure targets</summary>
            <form action={updateDailyTargetsAction} className={styles.compactForm}>
              <label>Research<input name="researchTarget" type="number" min={1} max={100} defaultValue={dailyTarget.researchTarget} /></label>
              <label>New personalized outreach<input name="personalizedOutreachTarget" type="number" min={1} max={100} defaultValue={dailyTarget.personalizedOutreachTarget} /></label>
              <label>Follow-ups<input name="followUpTarget" type="number" min={1} max={100} defaultValue={dailyTarget.followUpTarget} /></label>
              <button className={styles.secondaryButton} type="submit">Save targets</button>
            </form>
          </details>
        </section>

        <section className={styles.panel} aria-labelledby="replies-title">
          <div className={styles.panelHeader}>
            <h2 id="replies-title">Replies needing action</h2>
            <span>{repliesNeedingAction.length}</span>
          </div>
          {repliesNeedingAction.length ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>Account</th><th>Reply</th><th>Action</th></tr></thead>
                <tbody>{repliesNeedingAction.map((message) => (
                  <tr key={message.id}>
                    <td><Link href={`/admin/leads/${message.opportunity.id}`}>{message.opportunity.company.name}</Link><span className={styles.subtle}>{message.channel}</span></td>
                    <td>{message.response ?? message.body}<span className={styles.subtle}>{message.nextAction ?? "Review and decide next action"}</span></td>
                    <td><form action={markMessageActionedAction}><input type="hidden" name="messageId" value={message.id} /><input type="hidden" name="returnTo" value="/admin" /><button className={styles.textButton} type="submit">Mark actioned</button></form></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <EmptyAdminState>No replies are waiting for action.</EmptyAdminState>}
        </section>
      </div>

      <div className={styles.panelHeader} style={{ marginTop: "1rem", border: "1px solid var(--admin-line)" }}>
        <h2>Commercial totals</h2><span>All active opportunities</span>
      </div>

      <dl className={styles.metricsGrid}>
        {metricItems.map(([label, number]) => (
          <div className={styles.metric} key={label}>
            <dt>{label}</dt>
            <dd>{number}</dd>
          </div>
        ))}
      </dl>

      <div className={styles.dashboardGrid}>
        <section className={styles.panel} aria-labelledby="pipeline-health-title">
          <div className={styles.panelHeader}>
            <h2 id="pipeline-health-title">Pipeline distribution</h2>
            <Link href="/admin/pipeline">Open board</Link>
          </div>
          <div className={styles.chart}>
            {stageGroups.map((item) => (
              <div className={styles.chartRow} key={item.stage}>
                <span>{opportunityStageLabels[item.stage]}</span>
                <div className={styles.chartTrack} aria-hidden="true">
                  <div
                    className={styles.chartBar}
                    style={{ width: `${(item.count / maxStageCount) * 100}%` }}
                  />
                </div>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.panel} aria-labelledby="follow-ups-title">
          <div className={styles.panelHeader}>
            <h2 id="follow-ups-title">Follow-ups due</h2>
            <Link href="/admin/tasks">All tasks</Link>
          </div>
          {dueTasks.length ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Due</th>
                    <th>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {dueTasks.map((task) => (
                    <tr key={task.id}>
                      <td>
                        {task.opportunity ? (
                          <Link href={`/admin/leads/${task.opportunity.id}`}>
                            {task.title}
                          </Link>
                        ) : (
                          task.title
                        )}
                        <span className={styles.subtle}>
                          {task.company?.name ?? task.opportunity?.reference ?? "Internal"}
                        </span>
                      </td>
                      <td>{formatAdminDate(task.dueAt)}</td>
                      <td><PriorityBadge priority={task.priority} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyAdminState>No overdue or due-today follow-ups.</EmptyAdminState>
          )}
        </section>
      </div>

      <section className={styles.panel} aria-labelledby="recent-opportunities-title" style={{ marginTop: "1rem" }}>
        <div className={styles.panelHeader}>
          <h2 id="recent-opportunities-title">Recently active opportunities</h2>
          <Link href="/admin/leads">View register</Link>
        </div>
        {recentOpportunities.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Company / opportunity</th>
                  <th>Stage</th>
                  <th>Score</th>
                  <th>Value</th>
                  <th>Owner</th>
                </tr>
              </thead>
              <tbody>
                {recentOpportunities.map((opportunity) => (
                  <tr key={opportunity.id}>
                    <td>{opportunity.reference}</td>
                    <td>
                      <Link href={`/admin/leads/${opportunity.id}`}>
                        {opportunity.company.name}
                      </Link>
                      <span className={styles.subtle}>{opportunity.title}</span>
                    </td>
                    <td><StageBadge stage={opportunity.stage} /></td>
                    <td>{opportunity.research?.totalScore ?? "—"}/25</td>
                    <td>{formatAdminCurrency(Number(opportunity.estimatedValue))}</td>
                    <td>{opportunity.assignedOwner?.name ?? "Unassigned"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyAdminState>Add the first qualified account to start the pipeline.</EmptyAdminState>
        )}
      </section>
    </>
  );
}
