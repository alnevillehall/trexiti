"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ClipboardCheck,
  LayoutDashboard,
  ListFilter,
  Megaphone,
  Network,
  Target,
} from "lucide-react";

import styles from "@/components/admin/admin.module.css";

const navigation = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/leads", label: "Opportunities", icon: ListFilter },
  { href: "/admin/accounts", label: "Target accounts", icon: Target },
  { href: "/admin/companies", label: "Companies", icon: Building2 },
  { href: "/admin/pipeline", label: "Pipeline", icon: Network },
  { href: "/admin/tasks", label: "Tasks", icon: ClipboardCheck },
  {
    href: "/admin/marketing",
    label: "Marketing",
    icon: Megaphone,
  },
] as const;

function isCurrent(pathname: string, href: string) {
  return href === "/admin"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNavigation() {
  const pathname = usePathname();

  return (
    <nav className={styles.navigation} aria-label="Admin">
      {navigation.map((item) => {
        const Icon = item.icon;
        const current = isCurrent(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={current ? styles.navigationCurrent : undefined}
            aria-current={current ? "page" : undefined}
          >
            <Icon aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
