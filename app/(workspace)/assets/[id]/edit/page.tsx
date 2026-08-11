import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { updateAsset } from "@/app/(workspace)/assets/actions";
import { AssetForm } from "@/components/assets/asset-form";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  loadAssetCustomerOptions,
  loadAssetProfile,
  loadAssetTypeOptions,
} from "@/lib/service-os/asset-queries";
import { requireTenantContext } from "@/lib/tenant/guard";

type EditAssetPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function EditAssetPage({ params }: EditAssetPageProps) {
  const { id } = await params;
  const { session, organizationId } = await requireTenantContext([
    "PLATFORM_OWNER",
    "COMPANY_ADMIN",
    "DISPATCHER",
    "SALES",
  ]);

  const [asset, assetTypes, customers] = await Promise.all([
    loadAssetProfile(organizationId, id),
    loadAssetTypeOptions(organizationId, session.industryTemplate.key),
    loadAssetCustomerOptions(organizationId),
  ]);

  if (!asset) {
    notFound();
  }

  return (
    <>
      <PageHeader
        eyebrow="Assets and equipment"
        title={`Edit ${asset.name}`}
        badge={asset.assetType}
        description="Update common searchable fields and the flexible custom metadata for this asset type."
        actions={
          <Button variant="outline" asChild>
            <Link href={`/assets/${asset.id}`}>
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
        }
      />

      <AssetForm
        action={updateAsset}
        assetTypes={assetTypes}
        customers={customers}
        industryKey={session.industryTemplate.key}
        submitLabel="Save asset"
        initialAsset={asset}
      />
    </>
  );
}
