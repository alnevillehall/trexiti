import type {
  MarketingChannelProfileStatus,
  MarketingVerificationStatus,
} from "@prisma/client";

import { updateMarketingChannelAction } from "@/app/(admin)/admin/marketing/actions";
import { AdminPageHeader, EmptyAdminState } from "@/components/admin/admin-ui";
import adminStyles from "@/components/admin/admin.module.css";
import styles from "@/components/admin/marketing.module.css";
import { requireAdminSession } from "@/lib/admin/auth";
import { getJamaicaDateKey, marketingLabel } from "@/lib/admin/marketing";
import { getMarketingChannels } from "@/lib/admin/marketing-queries";
import { hasAdminPermission } from "@/lib/admin/permissions";

const profileStatuses: MarketingChannelProfileStatus[] = ["NOT_STARTED", "IN_PROGRESS", "READY", "NEEDS_REVIEW"];
const verificationStatuses: MarketingVerificationStatus[] = ["UNCHECKED", "PENDING", "VERIFIED", "NOT_AVAILABLE"];

export default async function MarketingChannelsPage() {
  const [session, channels] = await Promise.all([
    requireAdminSession("marketing:view"),
    getMarketingChannels(),
  ]);
  const canManage = hasAdminPermission(session.role, "marketing:manage");

  return (
    <>
      <AdminPageHeader
        eyebrow="Marketing OS / Channels"
        title="Profile readiness, not passwords."
        description="Track public URLs and setup completion. Trexiti OS never asks for, stores or uses social-network credentials."
      />

      {channels.length ? (
        <div className={styles.channelGrid}>
          {channels.map((profile) => (
            <section className={styles.panel} key={profile.id} aria-labelledby={`channel-${profile.id}`}>
              <div className={styles.panelHeader}>
                <div><h2 id={`channel-${profile.id}`}>{marketingLabel(profile.channel)}</h2><p>{profile.profileUrl ?? "Public URL not recorded"}</p></div>
                <span className={styles.status} data-status={profile.status.toLowerCase()}>{marketingLabel(profile.status)}</span>
              </div>
              <form action={updateMarketingChannelAction} className={styles.channelForm}>
                <input name="id" type="hidden" value={profile.id} />
                <label className={styles.inlineField}>Profile URL<input defaultValue={profile.profileUrl ?? ""} disabled={!canManage} name="profileUrl" type="url" /></label>
                <label className={styles.inlineField}>Setup status<select defaultValue={profile.status} disabled={!canManage} name="status">{profileStatuses.map((status) => <option key={status} value={status}>{marketingLabel(status)}</option>)}</select></label>
                <label className={styles.inlineField}>Verification<select defaultValue={profile.verificationStatus} disabled={!canManage} name="verificationStatus">{verificationStatuses.map((status) => <option key={status} value={status}>{marketingLabel(status)}</option>)}</select></label>
                <label className={styles.inlineField}>Last reviewed<input defaultValue={profile.lastReviewedAt ? getJamaicaDateKey(profile.lastReviewedAt) : ""} disabled={!canManage} name="lastReviewedAt" type="date" /></label>
                <div className={styles.channelChecks}>
                  <label><input defaultChecked={profile.bioComplete} disabled={!canManage} name="bioComplete" type="checkbox" /> Bio complete</label>
                  <label><input defaultChecked={profile.logoComplete} disabled={!canManage} name="logoComplete" type="checkbox" /> Logo complete</label>
                  <label><input defaultChecked={profile.bannerComplete} disabled={!canManage} name="bannerComplete" type="checkbox" /> Banner complete</label>
                  <label><input defaultChecked={profile.ctaLinkComplete} disabled={!canManage} name="ctaLinkComplete" type="checkbox" /> CTA link complete</label>
                </div>
                <label className={`${styles.inlineField} ${adminStyles.fieldFull}`}>Notes<textarea defaultValue={profile.notes ?? ""} disabled={!canManage} name="notes" rows={3} /></label>
                {canManage ? <div className={adminStyles.formActions}><button className={adminStyles.primaryButton} type="submit">Save profile setup</button></div> : null}
              </form>
            </section>
          ))}
        </div>
      ) : <EmptyAdminState>No channel profiles are seeded yet. Refresh the approved Week 1 seed from the Marketing overview.</EmptyAdminState>}
    </>
  );
}
