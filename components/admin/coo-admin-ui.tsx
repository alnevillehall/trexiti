import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import styles from "@/components/admin/admin.module.css";

export type OperationsTone = "neutral" | "success" | "warning" | "danger" | "info";

export function OperationsBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: OperationsTone;
}) {
  return (
    <Badge className={styles.operationsBadge} data-tone={tone} variant="outline">
      {children}
    </Badge>
  );
}

export function statusTone(status: string): OperationsTone {
  const value = status.toUpperCase();
  if (["SUCCEEDED", "COMPLETED", "PAID", "APPROVED", "HEALTHY", "ACTIVE"].includes(value)) {
    return "success";
  }
  if (["FAILED", "DECLINED", "REJECTED", "OVERDUE", "CRITICAL", "BLOCKED"].includes(value)) {
    return "danger";
  }
  if (["RUNNING", "PENDING", "QUEUED", "PARTIAL", "AT_RISK", "ATTENTION"].includes(value)) {
    return "warning";
  }
  return "neutral";
}

export function readableStatus(status: string) {
  return status.replaceAll("_", " ").toLowerCase().replace(/^./, (character) => character.toUpperCase());
}

export function formatOperationsDate(value: Date | string | null | undefined, includeTime = true) {
  if (!value) return "Not recorded";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en-JM", {
    dateStyle: "medium",
    ...(includeTime ? { timeStyle: "short", timeZone: "America/Jamaica" } : {}),
  }).format(date);
}

export function formatMoney(amount: number, currency: "JMD" | "USD") {
  return new Intl.NumberFormat("en-JM", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "JMD" ? 0 : 2,
  }).format(amount);
}

export function FreshnessStatus({
  asOf,
  stale,
  degraded,
  detail,
}: {
  asOf: Date | string | null | undefined;
  stale?: boolean;
  degraded?: boolean;
  detail?: string | null;
}) {
  const tone: OperationsTone = degraded ? "danger" : stale ? "warning" : "success";
  const label = degraded ? "Degraded" : stale ? "Stale" : "Current";

  return (
    <div className={styles.freshnessLine} role={degraded ? "alert" : "status"}>
      <OperationsBadge tone={tone}>{label}</OperationsBadge>
      <span>As of {formatOperationsDate(asOf)}</span>
      {detail ? <span>{detail}</span> : null}
    </div>
  );
}

export function QueueItem({
  href,
  title,
  description,
  meta,
  badge,
  tone,
}: {
  href?: string | null;
  title: string;
  description?: string | null;
  meta?: string | null;
  badge?: string | null;
  tone?: OperationsTone;
}) {
  const titleNode = href ? <Link href={href}>{title}</Link> : <strong>{title}</strong>;
  return (
    <li className={styles.queueItem}>
      <div>
        {titleNode}
        {description ? <p>{description}</p> : null}
        {meta ? <span>{meta}</span> : null}
      </div>
      {badge ? <OperationsBadge tone={tone}>{badge}</OperationsBadge> : null}
    </li>
  );
}

export function EmptyOperationsState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className={styles.operationsEmpty}>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

export function OperationsPageIntro({
  eyebrow,
  title,
  description,
  meta,
}: {
  eyebrow: string;
  title: string;
  description: string;
  meta?: React.ReactNode;
}) {
  return (
    <header className={styles.operationsHero}>
      <div>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {meta ? <div className={styles.operationsHeroMeta}>{meta}</div> : null}
    </header>
  );
}

