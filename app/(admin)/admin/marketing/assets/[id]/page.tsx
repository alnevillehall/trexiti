import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-ui";
import { BrandAssetEditor } from "@/components/admin/brand-asset-editor";
import { requireAdminSession } from "@/lib/admin/auth";
import { marketingAssetToDraft } from "@/lib/admin/brand-assets-server";
import { getMarketingAssetById, getMarketingCampaigns, getMarketingContent } from "@/lib/admin/marketing-queries";
import { hasAdminPermission } from "@/lib/admin/permissions";

export default async function BrandAssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [session, asset, campaigns, content] = await Promise.all([
    requireAdminSession("marketing:view"),
    getMarketingAssetById(id),
    getMarketingCampaigns(),
    getMarketingContent(),
  ]);
  if (!asset) notFound();
  const draft = marketingAssetToDraft(asset);
  if (!draft) notFound();

  return (
    <>
      <AdminPageHeader
        eyebrow="Marketing OS / Assets / Design"
        title={asset.name}
        description="A structured, reproducible Trexiti asset. The saved fields are the source of truth; exported files contain no admin interface chrome."
        action={{ href: "/admin/marketing/assets", label: "Back to assets" }}
      />
      <BrandAssetEditor
        campaigns={campaigns.map(({ id: campaignId, name }) => ({ id: campaignId, name }))}
        canManage={hasAdminPermission(session.role, "marketing:manage")}
        content={content.map(({ id: contentId, title }) => ({ id: contentId, title }))}
        initialDraft={draft}
      />
    </>
  );
}
