import { ClerkProvider } from "@clerk/nextjs";

import { isAdminAuthConfigured } from "@/lib/admin/auth";

export default function AuthRouteGroupLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return isAdminAuthConfigured() ? (
    <ClerkProvider>{children}</ClerkProvider>
  ) : (
    children
  );
}
