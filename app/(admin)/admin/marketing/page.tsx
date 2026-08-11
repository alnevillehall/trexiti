import Link from "next/link";

import { AdminPageHeader, EmptyAdminState } from "@/components/admin/admin-ui";
import adminStyles from "@/components/admin/admin.module.css";
import styles from "@/components/admin/marketing.module.css";
import { refreshWeekOneMarketingSeedAction } from "@/app/(admin)/admin/marketing/actions";
import { requireAdminSession } from "@/lib/admin/auth";
import { formatJamaicaDateTime, marketingLabel } from "@/lib/admin/marketing";
import { getMarketingDashboard } from "@/lib/admin/marketing-queries";
import { hasAdminPermission } from "@/lib/admin/permissions";

export default async function MarketingDashboardPage() {
  const [session, data] = await Promise.all([
    requireAdminSession("marketing:view"),
    getMarketingDashboard(),
  ]);
  const canManage = hasAdminPermission(session.role, "marketing:manage");
  const launchPublished = data.launchContent.filter((item) =>
    ["PUBLISHED", "REPURPOSED"].includes(item.status),
  ).length;
  const launchFounder = data.launchContent.filter(
    (item) => item.primaryChannel === "LINKEDIN_FOUNDER",
  ).length;
  const launchVisual = data.launchContent.filter((item) =>
    ["CAROUSEL", "VIDEO"].includes(item.contentType),
  ).length;
  const launchArticles = data.launchContent.filter(
    (item) => item.contentType === "ARTICLE",
  ).length;

  return (
    <>
      <AdminPageHeader
        eyebrow="Marketing OS / Founder operations"
        title="Plan, produce, distribute, measure."
        description="A compact operating view for Trexiti content and campaigns. Publishing remains manual and intentional; this system stores no social credentials and performs no unauthorized posting."
        action={{ href: "/admin/marketing/calendar", label: "Open calendar" }}
      />

      <section className={styles.statStrip} aria-label="Marketing operations status">
        <div className={styles.stat}><span>Due today</span><strong>{data.dueToday.length}</strong></div>
        <div className={styles.stat}><span>Awaiting production</span><strong>{data.awaitingProduction}</strong></div>
        <div className={styles.stat}><span>Scheduled</span><strong>{data.scheduledCount}</strong></div>
        <div className={styles.stat}><span>Active campaigns</span><strong>{data.activeCampaigns.length}</strong></div>
        <div className={styles.stat}><span>Qualified / manual</span><strong>{data.manualMetricTotals.qualifiedConversations}</strong></div>
        <div className={styles.stat}><span>Won revenue / manual</span><strong>${data.manualMetricTotals.wonRevenue.toLocaleString()}</strong></div>
      </section>

      <div className={styles.dashboardGrid}>
        <section className={styles.panel} aria-labelledby="due-today-title">
          <div className={styles.panelHeader}>
            <h2 id="due-today-title">Content due today</h2>
            <Link href="/admin/marketing/content">Content register →</Link>
          </div>
          {data.dueToday.length ? (
            <div className={styles.list}>
              {data.dueToday.map((item) => (
                <div className={styles.listItem} key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{formatJamaicaDateTime(item.publishAt)} · {marketingLabel(item.primaryChannel)} · {item.campaign?.name ?? "No campaign"}</small>
                  </div>
                  <span className={styles.status} data-status={item.status.toLowerCase()}>{marketingLabel(item.status)}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyAdminState>No content is due today in America/Jamaica.</EmptyAdminState>
          )}
        </section>

        <section className={styles.panel} aria-labelledby="week-one-title">
          <div className={styles.panelHeader}>
            <h2 id="week-one-title">Week 1 launch scoreboard</h2>
            <p>11–17 Aug · Jamaica</p>
          </div>
          <div className={styles.scoreboard}>
            <div className={styles.scoreRow}><span>Scheduled records</span><strong>{data.launchContent.length}</strong></div>
            <div className={styles.scoreRow}><span>Published / repurposed</span><strong>{launchPublished} / {data.launchContent.length}</strong></div>
            <div className={styles.scoreRow}><span>Founder-led pieces</span><strong>{launchFounder} / 5+</strong></div>
            <div className={styles.scoreRow}><span>Visual / video pieces</span><strong>{launchVisual} / 3</strong></div>
            <div className={styles.scoreRow}><span>Insight articles</span><strong>{launchArticles} / 1</strong></div>
            <div className={styles.scoreRow}><span>Discovery calls / manual</span><strong>{data.manualMetricTotals.discoveryCalls} / 2</strong></div>
            <div className={styles.scoreRow}><span>Opportunities / manual</span><strong>{data.manualMetricTotals.opportunities}</strong></div>
          </div>
          {canManage ? (
            <form action={refreshWeekOneMarketingSeedAction} className={styles.actionForm}>
              <p>Refresh approved source copy without overwriting live statuses, publication URLs or entered metrics.</p>
              <button className={adminStyles.secondaryButton} type="submit">Refresh approved Week 1 seed</button>
            </form>
          ) : null}
        </section>
      </div>

      <section className={`${styles.panel} ${styles.topGap}`} aria-labelledby="website-analytics-title">
        <div className={styles.panelHeader}>
          <h2 id="website-analytics-title">Website conversion signals</h2>
          <p>{data.websiteMetrics.windowDays} days · consented first-party events {data.websiteMetrics.enabled ? "enabled" : "disabled"}</p>
        </div>
        <div className={styles.websiteMetricGrid}>
          <div className={styles.commercialMetric}><span>Sessions</span><strong>{data.websiteMetrics.sessions}</strong></div>
          <div className={styles.commercialMetric}><span>Page views</span><strong>{data.websiteMetrics.pageViews}</strong></div>
          <div className={styles.commercialMetric}><span>Primary CTA actions</span><strong>{data.websiteMetrics.primaryCtaActions}</strong></div>
          <div className={styles.commercialMetric}><span>Form starts</span><strong>{data.websiteMetrics.formStarts}</strong></div>
          <div className={styles.commercialMetric}><span>Form completions</span><strong>{data.websiteMetrics.formCompletions}</strong></div>
          <div className={styles.commercialMetric}><span>Completion rate</span><strong>{data.websiteMetrics.formCompletionRate}%</strong></div>
        </div>
      </section>

      <section className={`${styles.panel} ${styles.topGap}`} aria-labelledby="source-funnel-title">
        <div className={styles.panelHeader}>
          <h2 id="source-funnel-title">Lead-to-revenue funnel by first-touch source</h2>
          <p>{data.websiteMetrics.windowDays} days · website CRM records</p>
        </div>
        {data.sourceFunnel.length ? (
          <div className={styles.funnelWrap}>
            <table className={styles.funnelTable}>
              <thead>
                <tr><th>Source / medium</th><th>Leads</th><th>Qualified</th><th>Discovery</th><th>Opportunities</th><th>Won revenue</th></tr>
              </thead>
              <tbody>
                {data.sourceFunnel.map((row) => (
                  <tr key={row.source}>
                    <th scope="row">{row.source}</th>
                    <td>{row.leads}</td>
                    <td>{row.qualifiedLeads}</td>
                    <td>{row.discoveryConversations}</td>
                    <td>{row.opportunities}</td>
                    <td>${row.wonRevenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyAdminState>No website leads entered during this reporting window.</EmptyAdminState>}
      </section>

      <div className={styles.threeGrid}>
        <section className={styles.panel} aria-labelledby="content-title">
          <div className={styles.panelHeader}><h2 id="content-title">Top measured content</h2><p>Consented views / 30 days</p></div>
          <div className={styles.list}>
            {data.topContent.map((row) => (
              <div className={styles.listItem} key={row.route}><span>{row.route}</span><strong>{row.views}</strong></div>
            ))}
            {!data.topContent.length ? <EmptyAdminState>No consented Insight or case-study views recorded.</EmptyAdminState> : null}
          </div>
        </section>

        <section className={styles.panel} aria-labelledby="landing-pages-title">
          <div className={styles.panelHeader}><h2 id="landing-pages-title">Qualified leads by landing page</h2><p>Website CRM / 30 days</p></div>
          <div className={styles.list}>
            {data.topQualifiedLandingPages.map((row) => (
              <div className={styles.listItem} key={row.landingPage}><span>{row.landingPage}</span><strong>{row.qualifiedLeads}</strong></div>
            ))}
            {!data.topQualifiedLandingPages.length ? <EmptyAdminState>No qualified attributed leads in this window.</EmptyAdminState> : null}
          </div>
        </section>

        <section className={styles.panel} aria-labelledby="conversion-title">
          <div className={styles.panelHeader}><h2 id="conversion-title">Manual commercial reporting</h2><p>Entered by the team</p></div>
          <div className={styles.scoreboard}>
            <div className={styles.scoreRow}><span>Systems Review enquiries / CRM</span><strong>{data.systemsReviewConversions}</strong></div>
            <div className={styles.scoreRow}><span>Website clicks / manual</span><strong>{data.manualMetricTotals.websiteClicks}</strong></div>
            <div className={styles.scoreRow}><span>Qualified conversations / manual</span><strong>{data.manualMetricTotals.qualifiedConversations}</strong></div>
            <div className={styles.scoreRow}><span>Discovery calls / manual</span><strong>{data.manualMetricTotals.discoveryCalls}</strong></div>
          </div>
        </section>
      </div>

      <div className={styles.dashboardGrid}>
        <section className={styles.panel} aria-labelledby="tasks-title">
          <div className={styles.panelHeader}><h2 id="tasks-title">Upcoming profile &amp; asset tasks</h2><Link href="/admin/marketing/assets">Assets →</Link></div>
          <div className={styles.list}>
            {data.assetTasks.map((asset) => (
              <div className={styles.listItem} key={asset.id}>
                <div><strong>{asset.name}</strong><small>{formatJamaicaDateTime(asset.dueAt)} · {asset.campaign?.name ?? "No campaign"}</small></div>
                <span className={styles.status} data-status={asset.status.toLowerCase()}>{marketingLabel(asset.status)}</span>
              </div>
            ))}
            {data.profileTasks.slice(0, 4).map((profile) => (
              <div className={styles.listItem} key={profile.id}>
                <div><strong>{marketingLabel(profile.channel)}</strong><small>Profile setup review</small></div>
                <span className={styles.status} data-status={profile.status.toLowerCase()}>{marketingLabel(profile.status)}</span>
              </div>
            ))}
            {!data.assetTasks.length && !data.profileTasks.length ? <EmptyAdminState>No upcoming setup tasks.</EmptyAdminState> : null}
          </div>
        </section>

        <section className={styles.panel} aria-labelledby="outbound-title">
          <div className={styles.panelHeader}><h2 id="outbound-title">Campaign-linked outbound</h2><Link href="/admin/marketing/campaigns">Campaigns →</Link></div>
          <div className={styles.list}>
            {data.outboundActivity.map((activity) => (
              <div className={styles.listItem} key={activity.id}>
                <div><strong>{activity.activity}</strong><small>{activity.campaign.name} · {marketingLabel(activity.channel)} · {formatJamaicaDateTime(activity.occurredAt)}</small></div>
                <strong>{activity.quantity}</strong>
              </div>
            ))}
            {!data.outboundActivity.length ? <EmptyAdminState>No outbound activity logged. Planned sales actions remain manual.</EmptyAdminState> : null}
          </div>
        </section>
      </div>
    </>
  );
}
