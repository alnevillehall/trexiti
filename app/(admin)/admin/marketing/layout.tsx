import { MarketingNavigation } from "@/components/admin/marketing-navigation";
import { requireAdminSession } from "@/lib/admin/auth";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  await requireAdminSession("marketing:view");
  return (
    <>
      <MarketingNavigation />
      {children}
    </>
  );
}
