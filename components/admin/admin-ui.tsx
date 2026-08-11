import Link from "next/link";

import type {
  AdminOpportunityStage,
  AdminTaskPriority,
  AdminTaskStatus,
} from "@prisma/client";

import {
  opportunityStageLabels,
  taskPriorityLabels,
  taskStatusLabels,
} from "@/lib/admin/crm";
import styles from "@/components/admin/admin.module.css";

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <header className={styles.pageHeader}>
      <div>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action ? (
        <Link className={styles.primaryButton} href={action.href}>
          {action.label}
        </Link>
      ) : null}
    </header>
  );
}

export function StageBadge({ stage }: { stage: AdminOpportunityStage }) {
  return (
    <span className={styles.stageBadge} data-stage={stage.toLowerCase()}>
      {opportunityStageLabels[stage]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: AdminTaskPriority }) {
  return (
    <span className={styles.priorityBadge} data-priority={priority.toLowerCase()}>
      {taskPriorityLabels[priority]}
    </span>
  );
}

export function TaskStatus({ status }: { status: AdminTaskStatus }) {
  return <span className={styles.taskStatus}>{taskStatusLabels[status]}</span>;
}

export function Notice({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "error";
  children: React.ReactNode;
}) {
  return (
    <div className={styles.notice} data-tone={tone} role={tone === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}

export function EmptyAdminState({ children }: { children: React.ReactNode }) {
  return <div className={styles.emptyState}>{children}</div>;
}
