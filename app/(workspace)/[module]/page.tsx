import { notFound } from "next/navigation";
import {
  BriefcaseBusiness,
  CheckCircle2,
  Database,
  Plus,
  ShieldCheck,
} from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  moduleSummaries,
  type ModuleSlug,
} from "@/lib/service-os/demo-data";
import { requireTenantContext } from "@/lib/tenant/guard";

type ModulePageProps = {
  params: Promise<{
    module: string;
  }>;
};

export function generateStaticParams() {
  return Object.keys(moduleSummaries)
    .filter((module) => !["assets", "customers", "jobs"].includes(module))
    .map((module) => ({ module }));
}

export default async function ModulePage({ params }: ModulePageProps) {
  const { module } = await params;
  const slug = module as ModuleSlug;
  const summary = moduleSummaries[slug];
  const { session, organizationId } = await requireTenantContext();

  if (!summary) {
    notFound();
  }

  return (
    <>
      <PageHeader
        eyebrow="Foundation module"
        title={summary.title}
        badge={session.organization.name}
        description={summary.description}
        actions={
          <Button>
            <Plus className="size-4" />
            {summary.cta}
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <EmptyState
          icon={BriefcaseBusiness}
          title={summary.emptyTitle}
          description={summary.emptyDescription}
          actionLabel={summary.cta}
        />

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="size-4" />
                Tenant boundary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                All future queries for this page should call{" "}
                <code className="rounded bg-muted px-1 py-0.5">
                  tenantWhere()
                </code>{" "}
                with the active organization.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{session.industryTemplate.name}</Badge>
                <Badge variant="secondary">{organizationId}</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="size-4" />
                Role access
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                RBAC is modeled with <code>User</code>, <code>Role</code>, and{" "}
                <code>OrganizationMember</code>, ready for provider session
                claims.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="size-4" />
                Next build step
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Connect this foundation module to Prisma reads and server actions
              after the database is provisioned.
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
