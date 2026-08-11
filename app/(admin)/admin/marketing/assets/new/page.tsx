import { AdminPageHeader } from "@/components/admin/admin-ui";
import { BrandAssetEditor } from "@/components/admin/brand-asset-editor";
import { requireAdminSession } from "@/lib/admin/auth";
import { defaultBrandAssetDraft } from "@/lib/admin/brand-assets";
import { getMarketingCampaigns, getMarketingContent } from "@/lib/admin/marketing-queries";

export default async function NewBrandAssetPage() {
  const [, campaigns, content] = await Promise.all([
    requireAdminSession("marketing:manage"),
    getMarketingCampaigns(),
    getMarketingContent(),
  ]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Marketing OS / Assets / New"
        title="Compose a Trexiti brand asset."
        description="Choose a bounded template, use approved copy, check the safe area, then save the structured design or export a high-resolution PNG."
        action={{ href: "/admin/marketing/assets", label: "Back to assets" }}
      />
      <BrandAssetEditor
        campaigns={campaigns.map(({ id, name }) => ({ id, name }))}
        canManage
        content={content.map(({ id, title }) => ({ id, title }))}
        initialDraft={defaultBrandAssetDraft}
      />
    </>
  );
}
