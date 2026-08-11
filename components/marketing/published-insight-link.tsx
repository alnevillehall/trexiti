import type { ReactNode } from "react";
import Link from "next/link";

import { getPublishedInsightPath } from "@/lib/content/insights";

import styles from "./published-insight-link.module.css";

export function PublishedInsightLink({
  children,
  slug,
}: {
  children: ReactNode;
  slug: string;
}) {
  const href = getPublishedInsightPath(slug);

  if (!href) return <>{children}</>;

  return (
    <Link className={styles.link} href={href}>
      {children}
    </Link>
  );
}
