import { WorkspaceShell } from "@/components/workspace-shell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { requireTenantContext } from "@/lib/tenant/guard";

export default async function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { session } = await requireTenantContext();

  return (
    <TooltipProvider>
      <WorkspaceShell session={session}>{children}</WorkspaceShell>
    </TooltipProvider>
  );
}
