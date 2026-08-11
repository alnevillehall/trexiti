import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createAsset } from "@/app/(workspace)/assets/actions";
import { AssetForm } from "@/components/assets/asset-form";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  loadAssetCustomerOptions,
  loadAssetTypeOptions,
} from "@/lib/service-os/asset-queries";
import { requireTenantContext } from "@/lib/tenant/guard";

export const dynamic = "force-dynamic";

export default async function NewAssetPage() {
  const { session, organizationId } = await requireTenantContext([
    "PLATFORM_OWNER",
    "COMPANY_ADMIN",
    "DISPATCHER",
    "SALES",
  ]);

  const [assetTypes, customers] = await Promise.all([
    loadAssetTypeOptions(organizationId, session.industryTemplate.key),
    loadAssetCustomerOptions(organizationId),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Assets and equipment"
        title="Register asset"
        badge={session.industryTemplate.name}
        description="Create a customer-location equipment record with searchable common fields and flexible metadata from the selected asset type."
        actions={
          <Button variant="outline" asChild>
            <Link href="/assets">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
        }
      />

      <AssetForm
        action={createAsset}
        assetTypes={assetTypes}
        customers={customers}
        industryKey={session.industryTemplate.key}
        submitLabel="Register asset"
      />
    </>
  );
}
