import {
  BarChart3,
  Boxes,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  LayoutDashboard,
  PackageSearch,
  ReceiptText,
  Settings,
  UserCog,
  UsersRound,
  Wrench,
} from "lucide-react";

export const workspaceNavigation = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Jobs", href: "/jobs", icon: Wrench },
  { title: "Customers", href: "/customers", icon: UsersRound },
  { title: "Schedule", href: "/schedule", icon: CalendarDays },
  { title: "Quotes", href: "/quotes", icon: FileText },
  { title: "Invoices", href: "/invoices", icon: ReceiptText },
  { title: "Inventory", href: "/inventory", icon: PackageSearch },
  { title: "Assets", href: "/assets", icon: Boxes },
  { title: "Technicians", href: "/technicians", icon: UserCog },
  { title: "Reports", href: "/reports", icon: BarChart3 },
  { title: "Settings", href: "/settings", icon: Settings },
] as const;

export const platformNavigation = [
  { title: "Industry Templates", href: "/industry-templates", icon: BriefcaseBusiness },
] as const;

export type NavigationHref = (typeof workspaceNavigation)[number]["href"];
