import type { MarketingAssetStatus } from "@prisma/client";
import Link from "next/link";

import {
  archiveMarketingAssetAction,
  saveMarketingAssetAction,
} from "@/app/(admin)/admin/marketing/actions";
import { AdminPageHeader, EmptyAdminState } from "@/components/admin/admin-ui";
import adminStyles from "@/components/admin/admin.module.css";
import styles from "@/components/admin/marketing.module.css";
import { requireAdminSession } from "@/lib/admin/auth";
import {
  formatJamaicaDateTime,
  formatJamaicaDateTimeInput,
  marketingChannels,
  marketingLabel,
} from "@/lib/admin/marketing";
import {
  getMarketingAssets,
  getMarketingCampaigns,
  getMarketingContent,
} from "@/lib/admin/marketing-queries";
import { hasAdminPermission } from "@/lib/admin/permissions";

const assetStatuses: MarketingAssetStatus[] = ["REQUESTED", "IN_PRODUCTION", "REVIEW", "READY", "ARCHIVED"];
type Asset = Awaited<ReturnType<typeof getMarketingAssets>>[number];
type Campaign = Awaited<ReturnType<typeof getMarketingCampaigns>>[number];
type Content = Awaited<ReturnType<typeof getMarketingContent>>[number];

function AssetForm({ asset, campaigns, content }: { asset?: Asset; campaigns: Campaign[]; content: Content[] }) {
  return (
    <form action={saveMarketingAssetAction} className={adminStyles.formGrid}>
      <input name="id" type="hidden" value={asset?.id ?? ""} />
      <label className={adminStyles.field}>Asset name<input defaultValue={asset?.name} name="name" required /></label>
      <label className={adminStyles.field}>Kind<input defaultValue={asset?.kind} name="kind" placeholder="Social graphic" required /></label>
      <label className={adminStyles.field}>Status<select defaultValue={asset?.status ?? "REQUESTED"} name="status">{assetStatuses.map((status) => <option key={status} value={status}>{marketingLabel(status)}</option>)}</select></label>
      <label className={adminStyles.field}>Channel<select defaultValue={asset?.channel ?? ""} name="channel"><option value="">Channel agnostic</option>{marketingChannels.map((channel) => <option key={channel} value={channel}>{marketingLabel(channel)}</option>)}</select></label>
      <label className={adminStyles.field}>Due · Jamaica<input defaultValue={formatJamaicaDateTimeInput(asset?.dueAt)} name="dueAt" type="datetime-local" /></label>
      <label className={adminStyles.field}>Owner<input defaultValue={asset?.owner ?? "Al Neville Hall"} name="owner" /></label>
      <label className={adminStyles.field}>Campaign<select defaultValue={asset?.campaignId ?? ""} name="campaignId"><option value="">No campaign</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select></label>
      <label className={adminStyles.field}>Content record<select defaultValue={asset?.contentId ?? ""} name="contentId"><option value="">No linked content</option>{content.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <label className={adminStyles.field}>Asset URL<input defaultValue={asset?.assetUrl ?? ""} name="assetUrl" type="url" /></label>
      <label className={adminStyles.fieldFull}>Brief<textarea defaultValue={asset?.brief} name="brief" required /></label>
      <label className={adminStyles.fieldFull}>Notes<textarea defaultValue={asset?.notes ?? ""} name="notes" /></label>
      <div className={adminStyles.formActions}><button className={adminStyles.primaryButton} type="submit">{asset ? "Save asset" : "Create asset"}</button></div>
    </form>
  );
}

export default async function MarketingAssetsPage() {
  const [session, assets, campaigns, content] = await Promise.all([
    requireAdminSession("marketing:view"),
    getMarketingAssets(),
    getMarketingCampaigns(),
    getMarketingContent(),
  ]);
  const canManage = hasAdminPermission(session.role, "marketing:manage");
  return (
    <>
      <AdminPageHeader
        eyebrow="Marketing OS / Assets"
        title="A controlled library for Trexiti brand assets."
        description="Create deterministic social graphics from structured templates, or track production tasks that stay outside the generator. Platform publishing and credentials remain outside this module."
        action={canManage ? { href: "/admin/marketing/assets/new", label: "New graphic" } : { href: "/admin/marketing/calendar", label: "View schedule" }}
      />

      {canManage ? <details className={adminStyles.formPanel}><summary>Create asset task</summary><AssetForm campaigns={campaigns} content={content} /></details> : null}

      <section className={`${adminStyles.panel} ${styles.topGap}`} aria-labelledby="assets-title">
        <div className={adminStyles.panelHeader}><h2 id="assets-title">Asset register</h2><span>{assets.length} active assets</span></div>
        {assets.length ? (
          <div className={adminStyles.tableWrap}>
            <table className={adminStyles.table}>
              <thead><tr><th>Status</th><th>Asset / brief</th><th>Output</th><th>Due</th><th>Channel</th><th>Campaign</th><th>Owner</th></tr></thead>
              <tbody>{assets.map((asset) => (
                <tr key={asset.id}>
                  <td><span className={styles.status} data-status={asset.status.toLowerCase()}>{marketingLabel(asset.status)}</span></td>
                  <td><strong>{asset.template ? <Link href={`/admin/marketing/assets/${asset.id}`}>{asset.name}</Link> : asset.name}</strong><span className={adminStyles.subtle}>{asset.kind} · {asset.brief}</span></td>
                  <td>{asset.exportWidth && asset.exportHeight ? <><strong>{asset.exportWidth} × {asset.exportHeight}</strong><span className={adminStyles.subtle}>{asset.template ? marketingLabel(asset.template) : "Production task"}</span></> : "—"}</td>
                  <td>{formatJamaicaDateTime(asset.dueAt)}</td>
                  <td>{asset.channel ? marketingLabel(asset.channel) : "—"}</td>
                  <td>{asset.campaign?.name ?? "—"}</td>
                  <td>{asset.owner ?? "—"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <EmptyAdminState>No active asset tasks.</EmptyAdminState>}
      </section>

      {canManage ? (
        <div className={adminStyles.sectionStack}>
          {assets.filter((asset) => !asset.template).map((asset) => (
            <details className={adminStyles.formPanel} key={asset.id}>
              <summary>Edit · {asset.name}</summary>
              <AssetForm asset={asset} campaigns={campaigns} content={content} />
              <form action={archiveMarketingAssetAction} className={styles.actionForm}><input name="id" type="hidden" value={asset.id} /><button className={adminStyles.dangerButton} type="submit">Request archive</button></form>
            </details>
          ))}
        </div>
      ) : null}
    </>
  );
}
