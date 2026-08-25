import type {
  ClientHealthAssessment,
  ClientHealthInput,
  PolicyThresholds,
  ProjectRiskAssessment,
  ProjectRiskInput,
  ProjectRiskReason,
} from "./types";

const COMPLETE_MILESTONE_STATUSES = new Set(["COMPLETED", "CANCELLED"]);
const INACTIVE_PROJECT_STATUSES = new Set(["COMPLETED", "CANCELLED"]);

export function assessProjectRisk(
  project: ProjectRiskInput,
  now: Date,
  policy: Pick<
    PolicyThresholds,
    "projectDeadlineHours" | "staleProgressDays"
  >,
): ProjectRiskAssessment {
  if (INACTIVE_PROJECT_STATUSES.has(project.status)) {
    return { health: "ON_TRACK", reasons: [] };
  }

  const reasons = new Set<ProjectRiskReason>();
  const deadlineWindow =
    now.getTime() + policy.projectDeadlineHours * 60 * 60 * 1_000;

  if (project.activeBlocker?.trim()) {
    reasons.add("ACTIVE_BLOCKER");
  }

  for (const milestone of project.milestones) {
    const milestoneComplete = COMPLETE_MILESTONE_STATUSES.has(milestone.status);
    if (!milestoneComplete && milestone.dueAt && milestone.dueAt < now) {
      reasons.add("OVERDUE_MILESTONE");
    }

    if (
      !milestoneComplete &&
      (milestone.status === "BLOCKED" || milestone.blocker?.trim())
    ) {
      reasons.add("ACTIVE_BLOCKER");
    }

    const dependency = milestone.dependency;
    if (dependency && !COMPLETE_MILESTONE_STATUSES.has(dependency.status)) {
      if (dependency.dueAt && dependency.dueAt < now) {
        reasons.add("OVERDUE_DEPENDENCY");
      }

      if (
        !milestoneComplete &&
        milestone.dueAt &&
        milestone.dueAt.getTime() >= now.getTime() &&
        milestone.dueAt.getTime() <= deadlineWindow
      ) {
        reasons.add("DEADLINE_WITH_UNFINISHED_PREREQUISITE");
      }
    }
  }

  if (project.status === "ACTIVE" || project.status === "ON_HOLD") {
    const lastProgressAt = project.lastProgressAt ?? project.createdAt;
    const staleAfterMs = policy.staleProgressDays * 24 * 60 * 60 * 1_000;
    if (now.getTime() - lastProgressAt.getTime() >= staleAfterMs) {
      reasons.add("STALE_PROGRESS");
    }
  }

  if (project.healthOverride === "AT_RISK") {
    reasons.add("MANUAL_OVERRIDE");
  }

  if (reasons.size > 0) {
    return { health: "AT_RISK", reasons: [...reasons] };
  }
  if (project.healthOverride === "ATTENTION") {
    return { health: "ATTENTION", reasons: ["MANUAL_OVERRIDE"] };
  }
  return { health: "ON_TRACK", reasons: [] };
}

export function assessClientHealth(
  input: ClientHealthInput,
  now: Date,
  policy: Pick<PolicyThresholds, "staleProgressDays">,
): ClientHealthAssessment {
  const reasons: ClientHealthAssessment["reasons"] = [];

  if (input.projects.some((project) => project.health === "AT_RISK")) {
    reasons.push("AT_RISK_PROJECT");
  }
  if (input.hasOverdueInvoice) reasons.push("OVERDUE_INVOICE");
  if (input.hasBlockedApprovalOrDependency) {
    reasons.push("BLOCKED_APPROVAL_OR_DEPENDENCY");
  }

  if (
    input.lastActiveDeliveryUpdateAt &&
    now.getTime() - input.lastActiveDeliveryUpdateAt.getTime() >=
      policy.staleProgressDays * 24 * 60 * 60 * 1_000
  ) {
    reasons.push("STALE_ACTIVE_DELIVERY");
  }

  return {
    health: reasons.length > 0 ? "ATTENTION" : "HEALTHY",
    reasons,
  };
}
