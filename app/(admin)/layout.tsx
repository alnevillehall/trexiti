import { ClerkProvider } from "@clerk/nextjs";

export default function AdminRouteGroupLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <ClerkProvider>{children}</ClerkProvider>;
}
