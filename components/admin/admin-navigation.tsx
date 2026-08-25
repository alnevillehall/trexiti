"use client";

import type { AdminRole } from "@prisma/client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BadgeDollarSign,
  Building2,
  ClipboardCheck,
  FolderKanban,
  Gavel,
  LayoutDashboard,
  ListFilter,
  Megaphone,
  Network,
  Settings2,
  Target,
  UsersRound,
} from "lucide-react";

import styles from "@/components/admin/admin.module.css";

const navigation = [
  { href: "/admin", label: "Operations", icon: LayoutDashboard, group: "Command", founderOnly: true },
  { href: "/admin/clients", label: "Clients", icon: UsersRound, group: "Command", founderOnly: true },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban, group: "Command", founderOnly: true },
  { href: "/admin/finance", label: "Finance", icon: BadgeDollarSign, group: "Command", founderOnly: true },
  { href: "/admin/approvals", label: "Approvals", icon: Gavel, group: "Control", founderOnly: true },
  { href: "/admin/automations", label: "Automations", icon: Activity, group: "Control", founderOnly: true },
  { href: "/admin/operations-policy", label: "Operations policy", icon: Settings2, group: "Control", founderOnly: true },
  { href: "/admin/leads", label: "Opportunities", icon: ListFilter, group: "Commercial" },
  { href: "/admin/accounts", label: "Target accounts", icon: Target, group: "Commercial" },
  { href: "/admin/companies", label: "Companies", icon: Building2, group: "Commercial" },
  { href: "/admin/pipeline", label: "Pipeline", icon: Network, group: "Commercial" },
  { href: "/admin/tasks", label: "Tasks", icon: ClipboardCheck, group: "Commercial" },
  {
    href: "/admin/marketing",
    label: "Marketing",
    icon: Megaphone,
    group: "Commercial",
  },
] as const;

function isCurrent(pathname: string, href: string) {
  return href === "/admin"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNavigation({ role }: { role: AdminRole }) {
  const pathname = usePathname();
  const visibleNavigation = navigation.filter(
    (item) => !("founderOnly" in item && item.founderOnly) || role === "OWNER",
  );

  return (
    <nav className={styles.navigation} aria-label="Admin">
      {visibleNavigation.map((item, index) => {
        const Icon = item.icon;
        const current = isCurrent(pathname, item.href);
        const showGroup = visibleNavigation[index - 1]?.group !== item.group;

        return (
          <span className={styles.navigationItem} key={item.href}>
            {showGroup ? <span className={styles.navigationGroup}>{item.group}</span> : null}
            <Link
              href={item.href}
              className={current ? styles.navigationCurrent : undefined}
              aria-current={current ? "page" : undefined}
            >
              <Icon aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
