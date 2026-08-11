import type { MarketingMetricEntrySource } from "@prisma/client";

import {
  deleteMarketingMetricAction,
  saveMarketingMetricAction,
} from "@/app/(admin)/admin/marketing/actions";
import { AdminPageHeader, EmptyAdminState } from "@/components/admin/admin-ui";
import adminStyles from "@/components/admin/admin.module.css";
import styles from "@/components/admin/marketing.module.css";
import { requireAdminSession } from "@/lib/admin/auth";
import {
  formatJamaicaDate,
  getJamaicaDateKey,
  marketingChannels,
  marketingLabel,
} from "@/lib/admin/marketing";
import { getMarketingCampaigns, getMarketingMetrics } from "@/lib/admin/marketing-queries";
import { hasAdminPermission } from "@/lib/admin/permissions";

const sources: MarketingMetricEntrySource[] = ["MANUAL", "IMPORTED"];
type Metric = Awaited<ReturnType<typeof getMarketingMetrics>>[number];
type Campaign = Awaited<ReturnType<typeof getMarketingCampaigns>>[number];

const countFields = [
  ["impressions", "Impressions"], ["reach", "Reach"], ["profileViews", "Profile views"],
  ["websiteClicks", "Website clicks"], ["comments", "Comments"], ["saves", "Saves"],
  ["directMessages", "Direct messages"], ["emailReplies", "Email replies"],
  ["qualifiedConversations", "Qualified conversations"], ["discoveryCalls", "Discovery calls"],
  ["opportunities", "Opportunities"],
] as const;

function MetricForm({ metric, campaigns }: { metric?: Metric; campaigns: Campaign[] }) {
  return (
    <form action={saveMarketingMetricAction} className={adminStyles.formGrid}>
      <input name="id" type="hidden" value={metric?.id ?? ""} />
      <label className={adminStyles.field}>Week starting<input defaultValue={metric ? getJamaicaDateKey(metric.weekStarting) : getJamaicaDateKey()} name="weekStarting" required type="date" /></label>
      <label className={adminStyles.field}>Channel<select defaultValue={metric?.channel ?? ""} name="channel"><option value="">All / blended</option>{marketingChannels.map((channel) => <option key={channel} value={channel}>{marketingLabel(channel)}</option>)}</select></label>
      <label className={adminStyles.field}>Campaign<select defaultValue={metric?.campaignId ?? ""} name="campaignId"><option value="">No campaign</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select></label>
      <label className={adminStyles.field}>Entry source<select defaultValue={metric?.source ?? "MANUAL"} name="source">{sources.map((source) => <option key={source} value={source}>{marketingLabel(source)}</option>)}</select></label>
      {countFields.map(([name, label]) => <label className={adminStyles.field} key={name}>{label}<input defaultValue={metric?.[name] ?? 0} min="0" name={name} required type="number" /></label>)}
      <label className={adminStyles.field}>Won revenue · USD<input defaultValue={Number(metric?.wonRevenue ?? 0)} min="0" name="wonRevenue" required step="0.01" type="number" /></label>
      <label className={adminStyles.fieldFull}>Notes / likely cause<textarea defaultValue={metric?.notes ?? ""} name="notes" placeholder="What likely caused the result? What should change next week?" /></label>
      <div className={adminStyles.formActions}><button className={adminStyles.primaryButton} type="submit">{metric ? "Save metrics" : "Add weekly metrics"}</button></div>
    </form>
  );
}

export default async function MarketingMetricsPage() {
  const [session, metrics, campaigns] = await Promise.all([
    requireAdminSession("marketing:view"),
    getMarketingMetrics(),
    getMarketingCampaigns(),
  ]);
  const canManage = hasAdminPermission(session.role, "marketing:manage");
  const totals = metrics.reduce((sum, metric) => ({
    qualifiedConversations: sum.qualifiedConversations + metric.qualifiedConversations,
    discoveryCalls: sum.discoveryCalls + metric.discoveryCalls,
    opportunities: sum.opportunities + metric.opportunities,
    wonRevenue: sum.wonRevenue + Number(metric.wonRevenue),
    websiteClicks: sum.websiteClicks + metric.websiteClicks,
  }), { qualifiedConversations: 0, discoveryCalls: 0, opportunities: 0, wonRevenue: 0, websiteClicks: 0 });

  return (
    <>
      <AdminPageHeader
        eyebrow="Marketing OS / Metrics"
        title="Measure movement toward revenue."
        description="Record verified weekly results manually or from a trusted import. Commercial signals stay above vanity metrics, and notes preserve the likely cause behind each result."
      />

      <section className={styles.commercialMetrics} aria-label="Commercial marketing totals">
        <div className={styles.commercialMetric}><span>Qualified conversations</span><strong>{totals.qualifiedConversations}</strong></div>
        <div className={styles.commercialMetric}><span>Discovery calls</span><strong>{totals.discoveryCalls}</strong></div>
        <div className={styles.commercialMetric}><span>Opportunities</span><strong>{totals.opportunities}</strong></div>
        <div className={styles.commercialMetric}><span>Won revenue</span><strong>${totals.wonRevenue.toLocaleString()}</strong></div>
        <div className={styles.commercialMetric}><span>Website clicks</span><strong>{totals.websiteClicks}</strong></div>
      </section>

      {canManage ? <details className={`${adminStyles.formPanel} ${styles.topGap}`}><summary>Add weekly metric entry</summary><MetricForm campaigns={campaigns} /></details> : null}

      <section className={`${adminStyles.panel} ${styles.topGap}`} aria-labelledby="metrics-title">
        <div className={adminStyles.panelHeader}><h2 id="metrics-title">Weekly metric register</h2><span>{metrics.length} entries</span></div>
        {metrics.length ? (
          <div className={adminStyles.tableWrap}>
            <table className={adminStyles.table}>
              <thead><tr><th>Week</th><th>Campaign / channel</th><th>Reach</th><th>Clicks</th><th>Replies / DMs</th><th>Qualified</th><th>Calls</th><th>Opps</th><th>Revenue</th></tr></thead>
              <tbody>{metrics.map((metric) => (
                <tr key={metric.id}>
                  <td>{formatJamaicaDate(metric.weekStarting)}<span className={adminStyles.subtle}>{marketingLabel(metric.source)}</span></td>
                  <td>{metric.campaign?.name ?? "Blended"}<span className={adminStyles.subtle}>{metric.channel ? marketingLabel(metric.channel) : "All channels"}</span></td>
                  <td>{metric.reach.toLocaleString()}</td>
                  <td>{metric.websiteClicks.toLocaleString()}</td>
                  <td>{metric.emailReplies + metric.directMessages}</td>
                  <td>{metric.qualifiedConversations}</td>
                  <td>{metric.discoveryCalls}</td>
                  <td>{metric.opportunities}</td>
                  <td>${Number(metric.wonRevenue).toLocaleString()}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <EmptyAdminState>No weekly metrics have been recorded.</EmptyAdminState>}
      </section>

      {canManage ? (
        <div className={adminStyles.sectionStack}>
          {metrics.map((metric) => (
            <details className={adminStyles.formPanel} key={metric.id}>
              <summary>Edit · {formatJamaicaDate(metric.weekStarting)} · {metric.campaign?.name ?? "Blended"}</summary>
              <MetricForm campaigns={campaigns} metric={metric} />
              <form action={deleteMarketingMetricAction} className={styles.actionForm}><input name="id" type="hidden" value={metric.id} /><button className={adminStyles.dangerButton} type="submit">Delete metric entry</button></form>
            </details>
          ))}
        </div>
      ) : null}
    </>
  );
}
