import type { MarketingChannel, MarketingContentStatus, MarketingPillar } from "@prisma/client";

import {
  archiveMarketingContentAction,
  saveMarketingContentAction,
} from "@/app/(admin)/admin/marketing/actions";
import { AdminPageHeader, EmptyAdminState } from "@/components/admin/admin-ui";
import adminStyles from "@/components/admin/admin.module.css";
import styles from "@/components/admin/marketing.module.css";
import { requireAdminSession } from "@/lib/admin/auth";
import {
  formatJamaicaDateTime,
  formatJamaicaDateTimeInput,
  marketingChannels,
  marketingContentStatuses,
  marketingContentTypes,
  marketingLabel,
  marketingPillars,
} from "@/lib/admin/marketing";
import { getMarketingCampaigns, getMarketingContent } from "@/lib/admin/marketing-queries";
import { hasAdminPermission } from "@/lib/admin/permissions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

type ContentRecord = Awaited<ReturnType<typeof getMarketingContent>>[number];
type CampaignRecord = Awaited<ReturnType<typeof getMarketingCampaigns>>[number];

function ContentForm({ item, campaigns, possibleParents }: {
  item?: ContentRecord;
  campaigns: CampaignRecord[];
  possibleParents: ContentRecord[];
}) {
  return (
    <form action={saveMarketingContentAction} className={adminStyles.formGrid}>
      <input name="id" type="hidden" value={item?.id ?? ""} />
      <label className={adminStyles.field}>Title<input defaultValue={item?.title} name="title" required /></label>
      <label className={adminStyles.field}>Type<select defaultValue={item?.contentType ?? "TEXT_POST"} name="contentType">{marketingContentTypes.map((value) => <option key={value} value={value}>{marketingLabel(value)}</option>)}</select></label>
      <label className={adminStyles.field}>Status<select defaultValue={item?.status ?? "IDEA"} name="status">{marketingContentStatuses.map((value) => <option key={value} value={value}>{marketingLabel(value)}</option>)}</select></label>
      <label className={adminStyles.field}>Pillar<select defaultValue={item?.pillar ?? "BUSINESS_SYSTEMS"} name="pillar">{marketingPillars.map((value) => <option key={value} value={value}>{marketingLabel(value)}</option>)}</select></label>
      <label className={adminStyles.field}>Primary channel<select defaultValue={item?.primaryChannel ?? "LINKEDIN_FOUNDER"} name="primaryChannel">{marketingChannels.map((value) => <option key={value} value={value}>{marketingLabel(value)}</option>)}</select></label>
      <label className={adminStyles.field}>Publish at · Jamaica<input defaultValue={formatJamaicaDateTimeInput(item?.publishAt ?? new Date())} name="publishAt" required type="datetime-local" /></label>
      <label className={adminStyles.field}>Owner<input defaultValue={item?.owner ?? "Al Neville Hall"} name="owner" required /></label>
      <label className={adminStyles.field}>Campaign<select defaultValue={item?.campaignId ?? ""} name="campaignId"><option value="">No campaign</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select></label>
      <label className={adminStyles.field}>Repurposed from<select defaultValue={item?.parentContentId ?? ""} name="parentContentId"><option value="">Original piece</option>{possibleParents.filter((parent) => parent.id !== item?.id).map((parent) => <option key={parent.id} value={parent.id}>{parent.title}</option>)}</select></label>
      <label className={adminStyles.fieldFull}>Core idea<textarea defaultValue={item?.coreIdea} name="coreIdea" required rows={2} /></label>
      <label className={adminStyles.fieldFull}>Prepared body<textarea defaultValue={item?.body} name="body" required rows={12} /></label>
      <label className={adminStyles.fieldFull}>Short caption<textarea defaultValue={item?.shortCaption ?? ""} name="shortCaption" rows={4} /></label>
      <label className={adminStyles.field}>CTA<input defaultValue={item?.cta ?? ""} name="cta" /></label>
      <label className={adminStyles.field}>Destination URL<input defaultValue={item?.destinationUrl ?? ""} name="destinationUrl" type="url" /></label>
      <label className={adminStyles.field}>Canonical post URL<input defaultValue={item?.canonicalPostUrl ?? ""} name="canonicalPostUrl" type="url" /></label>
      <label className={adminStyles.field}>Source article ID<input defaultValue={item?.sourceArticleId ?? ""} name="sourceArticleId" /></label>
      <label className={adminStyles.fieldFull}>Asset brief<textarea defaultValue={item?.assetBrief ?? ""} name="assetBrief" rows={3} /></label>
      <fieldset className={adminStyles.fieldFull}>
        <legend>Secondary channels</legend>
        {marketingChannels.map((channel) => (
          <label className={adminStyles.checkboxField} key={channel}>
            <input defaultChecked={item?.secondaryChannels.includes(channel) ?? false} name="secondaryChannels" type="checkbox" value={channel} />
            {marketingLabel(channel)}
          </label>
        ))}
      </fieldset>
      <label className={adminStyles.fieldFull}>Notes<textarea defaultValue={item?.notes ?? ""} name="notes" rows={4} /></label>
      <div className={adminStyles.formActions}><button className={adminStyles.primaryButton} type="submit">{item ? "Save changes" : "Create content"}</button></div>
    </form>
  );
}

export default async function AdminMarketingContentPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const filters = {
    query: first(query.q) || undefined,
    channel: (first(query.channel) || undefined) as MarketingChannel | undefined,
    pillar: (first(query.pillar) || undefined) as MarketingPillar | undefined,
    campaignId: first(query.campaign) || undefined,
    status: (first(query.status) || undefined) as MarketingContentStatus | undefined,
  };
  const [session, content, campaigns] = await Promise.all([
    requireAdminSession("marketing:view"),
    getMarketingContent(filters),
    getMarketingCampaigns(),
  ]);
  const canManage = hasAdminPermission(session.role, "marketing:manage");

  return (
    <>
      <AdminPageHeader
        eyebrow="Marketing OS / Content"
        title="Content register"
        description="The working inventory for original and repurposed pieces, approved copy, production context and manual distribution destinations."
        action={{ href: "/admin/marketing/calendar", label: "View calendar" }}
      />

      <form className={styles.filters} method="get">
        <label>Search<input defaultValue={filters.query} name="q" placeholder="Title, idea or copy" /></label>
        <label>Channel<select defaultValue={filters.channel ?? ""} name="channel"><option value="">All channels</option>{marketingChannels.map((value) => <option key={value} value={value}>{marketingLabel(value)}</option>)}</select></label>
        <label>Pillar<select defaultValue={filters.pillar ?? ""} name="pillar"><option value="">All pillars</option>{marketingPillars.map((value) => <option key={value} value={value}>{marketingLabel(value)}</option>)}</select></label>
        <label>Campaign<select defaultValue={filters.campaignId ?? ""} name="campaign"><option value="">All campaigns</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select></label>
        <label>Status<select defaultValue={filters.status ?? ""} name="status"><option value="">All live statuses</option>{marketingContentStatuses.map((value) => <option key={value} value={value}>{marketingLabel(value)}</option>)}</select></label>
        <button className={adminStyles.secondaryButton} type="submit">Filter</button>
      </form>

      {canManage ? (
        <details className={adminStyles.formPanel}>
          <summary>Create content record</summary>
          <ContentForm campaigns={campaigns} possibleParents={content} />
        </details>
      ) : null}

      <section className={`${adminStyles.panel} ${styles.topGap}`} aria-labelledby="content-register-title">
        <div className={adminStyles.panelHeader}><h2 id="content-register-title">Working content</h2><span>{content.length} records · America/Jamaica</span></div>
        {content.length ? (
          <div className={adminStyles.tableWrap}>
            <table className={adminStyles.table}>
              <thead><tr><th>Status</th><th>Title / idea</th><th>Channel</th><th>Publish</th><th>Campaign</th><th>Owner</th></tr></thead>
              <tbody>{content.map((item) => (
                <tr key={item.id}>
                  <td><span className={styles.status} data-status={item.status.toLowerCase()}>{marketingLabel(item.status)}</span></td>
                  <td><strong>{item.title}</strong><span className={adminStyles.subtle}>{item.coreIdea}</span></td>
                  <td>{marketingLabel(item.primaryChannel)}<span className={adminStyles.subtle}>{marketingLabel(item.contentType)} · {marketingLabel(item.pillar)}</span></td>
                  <td>{formatJamaicaDateTime(item.publishAt)}</td>
                  <td>{item.campaign?.name ?? "—"}</td>
                  <td>{item.owner}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <EmptyAdminState>No content matches these filters.</EmptyAdminState>}
      </section>

      {canManage ? (
        <div className={adminStyles.sectionStack}>
          {content.map((item) => (
            <details className={adminStyles.formPanel} key={item.id}>
              <summary>Edit · {item.title}</summary>
              <ContentForm campaigns={campaigns} item={item} possibleParents={content} />
              <form action={archiveMarketingContentAction} className={styles.actionForm}>
                <input name="id" type="hidden" value={item.id} />
                <button className={adminStyles.dangerButton} type="submit">Archive content</button>
              </form>
            </details>
          ))}
        </div>
      ) : null}
    </>
  );
}
