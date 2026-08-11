"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "@/components/admin/marketing.module.css";

const links = [
  ["/admin/marketing", "Overview"],
  ["/admin/marketing/calendar", "Calendar"],
  ["/admin/marketing/content", "Content"],
  ["/admin/marketing/campaigns", "Campaigns"],
  ["/admin/marketing/assets", "Assets"],
  ["/admin/marketing/channels", "Channels"],
  ["/admin/marketing/metrics", "Metrics"],
  ["/admin/marketing/utm", "UTM builder"],
  ["/admin/marketing/launch-readiness", "Launch readiness"],
] as const;

export function MarketingNavigation() {
  const pathname = usePathname();
  return (
    <nav className={styles.subnav} aria-label="Marketing OS">
      {links.map(([href, label]) => {
        const current = href === "/admin/marketing" ? pathname === href : pathname === href;
        return (
          <Link aria-current={current ? "page" : undefined} href={href} key={href}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
