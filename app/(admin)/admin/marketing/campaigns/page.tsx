import type { MarketingCampaignStatus } from "@prisma/client";

import {
  archiveMarketingCampaignAction,
  logMarketingOutboundAction,
  saveMarketingCampaignAction,
} from "@/app/(admin)/admin/marketing/actions";
import { AdminPageHeader, EmptyAdminState } from "@/components/admin/admin-ui";
import adminStyles from "@/components/admin/admin.module.css";
import styles from "@/components/admin/marketing.module.css";
import { requireAdminSession } from "@/lib/admin/auth";
import {
  formatJamaicaDateTime,
  formatJamaicaDateTimeInput,
  marketingCampaignStatuses,
  marketingChannels,
  marketingLabel,
} from "@/lib/admin/marketing";
import { getMarketingCampaigns } from "@/lib/admin/marketing-queries";
import { hasAdminPermission } from "@/lib/admin/permissions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Campaign = Awaited<ReturnType<typeof getMarketingCampaigns>>[number];

function jsonText(value: unknown) {
  return value ? JSON.stringify(value, null, 2) : "";
}

function CampaignForm({ campaign }: { campaign?: Campaign }) {
  return (
    <form action={saveMarketingCampaignAction} className={adminStyles.formGrid}>
      <input name="id" type="hidden" value={campaign?.id ?? ""} />
      <label className={adminStyles.field}>Name<input defaultValue={campaign?.name} name="name" required /></label>
      <label className={adminStyles.field}>Status<select defaultValue={campaign?.status ?? "PLANNED"} name="status">{marketingCampaignStatuses.map((status) => <option key={status} value={status}>{marketingLabel(status)}</option>)}</select></label>
      <label className={adminStyles.field}>Primary CTA<input defaultValue={campaign?.primaryCta} name="primaryCta" required /></label>
      <label className={adminStyles.field}>Start · Jamaica<input defaultValue={formatJamaicaDateTimeInput(campaign?.startAt)} name="startAt" required type="datetime-local" /></label>
      <label className={adminStyles.field}>End · Jamaica<input defaultValue={formatJamaicaDateTimeInput(campaign?.endAt)} name="endAt" required type="datetime-local" /></label>
      <label className={adminStyles.field}>Landing page<input defaultValue={campaign?.landingPage ?? ""} name="landingPage" type="url" /></label>
      <label className={adminStyles.fieldFull}>Objective<textarea defaultValue={campaign?.objective} name="objective" required /></label>
      <label className={adminStyles.fieldFull}>Audience<textarea defaultValue={campaign?.audience} name="audience" required /></label>
      <label className={adminStyles.fieldFull}>Message<textarea defaultValue={campaign?.message} name="message" required /></label>
      <label className={adminStyles.fieldFull}>Offer<textarea defaultValue={campaign?.offer} name="offer" required /></label>
      <label className={adminStyles.field}>UTM source<input defaultValue={campaign?.utmSource ?? ""} name="utmSource" /></label>
      <label className={adminStyles.field}>UTM medium<input defaultValue={campaign?.utmMedium ?? ""} name="utmMedium" /></label>
      <label className={adminStyles.field}>UTM campaign<input defaultValue={campaign?.utmCampaign ?? ""} name="utmCampaign" /></label>
      <label className={adminStyles.fieldFull}>Target account segment<textarea defaultValue={campaign?.targetAccountSegment ?? ""} name="targetAccountSegment" /></label>
      <label className={adminStyles.fieldFull}>Target metrics · JSON<textarea defaultValue={jsonText(campaign?.targetMetrics)} name="targetMetrics" /></label>
      <label className={adminStyles.fieldFull}>Actual metrics · JSON<textarea defaultValue={jsonText(campaign?.actualMetrics)} name="actualMetrics" /></label>
      <label className={adminStyles.fieldFull}>Notes / lessons<textarea defaultValue={campaign?.notes ?? ""} name="notes" /></label>
      <div className={adminStyles.formActions}><button className={adminStyles.primaryButton} type="submit">{campaign ? "Save campaign" : "Create campaign"}</button></div>
    </form>
  );
}

export default async function MarketingCampaignsPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const rawStatus = Array.isArray(query.status) ? query.status[0] : query.status;
  const status = (rawStatus || undefined) as MarketingCampaignStatus | undefined;
  const [session, campaigns] = await Promise.all([
    requireAdminSession("marketing:view"),
    getMarketingCampaigns(status),
  ]);
  const canManage = hasAdminPermission(session.role, "marketing:manage");

  return (
    <>
      <AdminPageHeader
        eyebrow="Marketing OS / Campaigns"
        title="Campaigns with a commercial reason."
        description="Keep the audience, message, offer, targets and lessons together. Outbound activity is logged here; execution remains personalized and manual."
        action={{ href: "/admin/marketing/utm", label: "Build tagged URL" }}
      />

      <form className={styles.filters} method="get">
        <label>Status<select defaultValue={status ?? ""} name="status"><option value="">All live campaigns</option>{marketingCampaignStatuses.map((item) => <option key={item} value={item}>{marketingLabel(item)}</option>)}</select></label>
        <button className={adminStyles.secondaryButton} type="submit">Filter</button>
      </form>

      {canManage ? <details className={adminStyles.formPanel}><summary>Create campaign</summary><CampaignForm /></details> : null}

      <section className={`${adminStyles.panel} ${styles.topGap}`} aria-labelledby="campaigns-title">
        <div className={adminStyles.panelHeader}><h2 id="campaigns-title">Campaign register</h2><span>{campaigns.length} campaigns</span></div>
        {campaigns.length ? (
          <div className={adminStyles.tableWrap}>
            <table className={adminStyles.table}>
              <thead><tr><th>Status</th><th>Campaign</th><th>Window</th><th>Primary CTA</th><th>Content</th><th>Outbound</th></tr></thead>
              <tbody>{campaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <td><span className={styles.status} data-status={campaign.status.toLowerCase()}>{marketingLabel(campaign.status)}</span></td>
                  <td><strong>{campaign.name}</strong><span className={adminStyles.subtle}>{campaign.objective}</span></td>
                  <td>{formatJamaicaDateTime(campaign.startAt)}<span className={adminStyles.subtle}>to {formatJamaicaDateTime(campaign.endAt)}</span></td>
                  <td>{campaign.primaryCta}</td>
                  <td>{campaign._count.content}</td>
                  <td>{campaign._count.outboundActivities}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <EmptyAdminState>No campaigns match this filter.</EmptyAdminState>}
      </section>

      {canManage ? (
        <div className={adminStyles.sectionStack}>
          <details className={adminStyles.formPanel}>
            <summary>Log personalized outbound activity</summary>
            <form action={logMarketingOutboundAction} className={adminStyles.formGrid}>
              <label className={adminStyles.field}>Campaign<select name="campaignId" required>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select></label>
              <label className={adminStyles.field}>Occurred · Jamaica<input defaultValue={formatJamaicaDateTimeInput(new Date())} name="occurredAt" required type="datetime-local" /></label>
              <label className={adminStyles.field}>Channel<select defaultValue="EMAIL" name="channel">{marketingChannels.map((channel) => <option key={channel} value={channel}>{marketingLabel(channel)}</option>)}</select></label>
              <label className={adminStyles.field}>Activity<input name="activity" placeholder="Personalized messages sent" required /></label>
              <label className={adminStyles.field}>Quantity<input defaultValue="1" min="1" name="quantity" required type="number" /></label>
              <label className={adminStyles.fieldFull}>Notes<textarea name="notes" /></label>
              <div className={adminStyles.formActions}><button className={adminStyles.primaryButton} type="submit">Log activity</button></div>
            </form>
          </details>
          {campaigns.map((campaign) => (
            <details className={adminStyles.formPanel} key={campaign.id}>
              <summary>Edit · {campaign.name}</summary>
              <CampaignForm campaign={campaign} />
              <form action={archiveMarketingCampaignAction} className={styles.actionForm}><input name="id" type="hidden" value={campaign.id} /><button className={adminStyles.dangerButton} type="submit">Request archive</button></form>
            </details>
          ))}
        </div>
      ) : null}
    </>
  );
}
