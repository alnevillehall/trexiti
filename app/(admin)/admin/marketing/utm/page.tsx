import { deleteMarketingUtmPresetAction } from "@/app/(admin)/admin/marketing/actions";
import { AdminPageHeader, EmptyAdminState } from "@/components/admin/admin-ui";
import adminStyles from "@/components/admin/admin.module.css";
import { CopyButton } from "@/components/admin/copy-button";
import styles from "@/components/admin/marketing.module.css";
import { UtmBuilder } from "@/components/admin/utm-builder";
import { requireAdminSession } from "@/lib/admin/auth";
import { buildTaggedUrl } from "@/lib/admin/marketing";
import { getMarketingUtmPresets } from "@/lib/admin/marketing-queries";
import { hasAdminPermission } from "@/lib/admin/permissions";

export default async function MarketingUtmPage() {
  const [session, presets] = await Promise.all([
    requireAdminSession("marketing:view"),
    getMarketingUtmPresets(),
  ]);
  const canManage = hasAdminPermission(session.role, "marketing:manage");
  return (
    <>
      <AdminPageHeader
        eyebrow="Marketing OS / UTM"
        title="Consistent campaign attribution."
        description="Create readable tagged URLs with normalized lowercase values. Existing destination query parameters are preserved; saved presets keep campaign naming consistent."
      />

      <div className={styles.utmLayout}>
        <UtmBuilder
          canManage={canManage}
          presets={presets.map((preset) => ({
            id: preset.id,
            name: preset.name,
            destination: preset.destination,
            source: preset.source,
            medium: preset.medium,
            campaign: preset.campaign,
            content: preset.content,
            term: preset.term,
          }))}
        />
        <section className={styles.panel} aria-labelledby="presets-title">
          <div className={styles.panelHeader}><h2 id="presets-title">Saved presets</h2><p>{presets.length} presets</p></div>
          {presets.length ? (
            <div className={styles.list}>
              {presets.map((preset) => {
                const tagged = buildTaggedUrl({
                  destination: preset.destination,
                  source: preset.source,
                  medium: preset.medium,
                  campaign: preset.campaign,
                  content: preset.content ?? undefined,
                  term: preset.term ?? undefined,
                });
                return (
                  <div className={styles.listItem} key={preset.id}>
                    <div><strong>{preset.name}</strong><small>{tagged}</small></div>
                    <div>
                      <CopyButton value={tagged} />
                      {canManage ? (
                        <form action={deleteMarketingUtmPresetAction}>
                          <input name="id" type="hidden" value={preset.id} />
                          <button className={adminStyles.textButton} type="submit">Delete</button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <EmptyAdminState>No UTM presets saved.</EmptyAdminState>}
        </section>
      </div>
    </>
  );
}
