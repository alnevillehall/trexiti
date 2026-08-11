import Link from "next/link";
import { notFound } from "next/navigation";

import {
  addOpportunityNoteAction,
  archiveOpportunityAction,
  completeOutreachStepAction,
  createTaskAction,
  logMessageAction,
  startOutreachSequenceAction,
  updateOpportunityAction,
  updateProspectResearchAction,
  updateResearchChecklistAction,
} from "@/app/(admin)/admin/actions";
import { Notice, PriorityBadge, StageBadge, TaskStatus } from "@/components/admin/admin-ui";
import styles from "@/components/admin/admin.module.css";
import { requireAdminSession } from "@/lib/admin/auth";
import {
  formatAdminCurrency,
  formatAdminDate,
  formatAdminDateTime,
  opportunityHeat,
  opportunityHeatLabel,
  opportunityStageLabels,
  opportunityStages,
  opportunityTypeLabels,
  taskPriorities,
  taskPriorityLabels,
  taskTypes,
  taskTypeLabels,
} from "@/lib/admin/crm";
import { hasAdminPermission } from "@/lib/admin/permissions";
import { getAdminOpportunity, getAdminOwners } from "@/lib/admin/queries";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function dateTimeLocal(value: Date | null) {
  if (!value) return "";
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}

export default async function AdminLeadDetailPage({ params, searchParams }: PageProps) {
  const session = await requireAdminSession();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [opportunity, owners] = await Promise.all([
    getAdminOpportunity(id),
    getAdminOwners(),
  ]);

  if (!opportunity) notFound();

  const returnTo = `/admin/leads/${opportunity.id}`;
  const canArchive = hasAdminPermission(session.role, "opportunity:archive");
  const expectedValue =
    Number(opportunity.estimatedValue) * (opportunity.probability / 100);

  return (
    <>
      <p className={styles.eyebrow}><Link href="/admin/leads">Opportunities</Link> / {opportunity.reference}</p>
      <header className={styles.detailHero}>
        <div>
          <h1>{opportunity.company.name}</h1>
          <div className={styles.detailMeta}>
            <StageBadge stage={opportunity.stage} />
            <span>{opportunityTypeLabels[opportunity.type]}</span>
            <span>{opportunity.direction.toLowerCase()}</span>
            <span>Updated {formatAdminDate(opportunity.updatedAt)}</span>
          </div>
        </div>
        <div className={styles.detailValue}>
          <strong>{formatAdminCurrency(Number(opportunity.estimatedValue))}</strong>
          <span>{opportunity.probability}% probability · {formatAdminCurrency(expectedValue)} expected</span>
        </div>
      </header>

      {first(query.error) ? <Notice tone="error">{first(query.error)}</Notice> : null}
      {query.created ? <Notice tone="success">Opportunity created and audit history started.</Notice> : null}
      {query.saved ? <Notice tone="success">Commercial details saved.</Notice> : null}
      {query.noteAdded ? <Notice tone="success">Internal note added.</Notice> : null}
      {query.messageAdded ? <Notice tone="success">Message activity recorded.</Notice> : null}
      {query.taskCreated ? <Notice tone="success">Follow-up task created.</Notice> : null}
      {query.researchSaved ? <Notice tone="success">Research checklist updated.</Notice> : null}
      {query.researchProfileSaved ? <Notice tone="success">Research profile and prospect score updated.</Notice> : null}
      {query.sequenceStarted ? <Notice tone="success">Manual outreach sequence prepared.</Notice> : null}
      {query.sequenceStepSaved ? <Notice tone="success">Outreach step and message record saved.</Notice> : null}

      <div className={styles.detailGrid}>
        <div className={styles.sectionStack}>
          <section className={styles.panel} aria-labelledby="account-title">
            <div className={styles.panelHeader}><h2 id="account-title">Contact + company</h2><span>{opportunity.company.status}</span></div>
            <dl className={styles.definitionGrid}>
              <div><dt>Contact</dt><dd>{opportunity.primaryContact?.name ?? "Not identified"}</dd></div>
              <div><dt>Role</dt><dd>{opportunity.primaryContact?.title ?? "—"}</dd></div>
              <div><dt>Email</dt><dd>{opportunity.primaryContact?.email ? <a href={`mailto:${opportunity.primaryContact.email}`}>{opportunity.primaryContact.email}</a> : "—"}</dd></div>
              <div><dt>Phone</dt><dd>{opportunity.primaryContact?.phone ?? "—"}</dd></div>
              <div><dt>LinkedIn</dt><dd>{opportunity.primaryContact?.linkedInUrl ? <a href={opportunity.primaryContact.linkedInUrl} target="_blank" rel="noreferrer">Open profile</a> : "—"}</dd></div>
              <div><dt>Website</dt><dd>{opportunity.company.website ? <a href={opportunity.company.website} target="_blank" rel="noreferrer">{opportunity.company.domain}</a> : opportunity.company.domain}</dd></div>
              <div><dt>Industry</dt><dd>{opportunity.company.industry}</dd></div>
              <div><dt>Country</dt><dd>{opportunity.company.country}</dd></div>
              <div><dt>Company size</dt><dd>{opportunity.company.estimatedSize ?? "Unverified"}</dd></div>
              <div><dt>Source</dt><dd>{opportunity.source}</dd></div>
              <div><dt>Contact methods</dt><dd>{opportunity.primaryContact?.contactMethods.length ? opportunity.primaryContact.contactMethods.map((method) => `${method.channel}: ${method.value}`).join(" · ") : "—"}</dd></div>
            </dl>
          </section>

          <section className={styles.panel} aria-labelledby="commercial-context-title">
            <div className={styles.panelHeader}><h2 id="commercial-context-title">Commercial context</h2><span>{opportunity.reference}</span></div>
            <div className={styles.narrative}><h3>Identified problem</h3><p>{opportunity.identifiedProblem}</p></div>
            <div className={styles.narrative}><h3>Opportunity</h3><p>{opportunity.opportunity}</p></div>
            <div className={styles.narrative}><h3>Reason for contact</h3><p>{opportunity.reasonForContact ?? "—"}</p></div>
            <div className={styles.narrative}><h3>Personalization angle</h3><p>{opportunity.personalizationAngle ?? "—"}</p></div>
          </section>

          {opportunity.research ? (
            <section className={styles.panel} aria-labelledby="research-score-title">
              <div className={styles.panelHeader}>
                <h2 id="research-score-title">Prospect quality</h2>
                <span className={styles.scoreBadge} data-heat={opportunityHeat(opportunity.research.totalScore).toLowerCase()}>{opportunityHeatLabel(opportunity.research.totalScore)} · {opportunity.research.totalScore}/25</span>
              </div>
              <div className={styles.scoreGrid}>
                <div><strong>{opportunity.research.financialCapacityScore}/5</strong><span>Financial capacity</span></div>
                <div><strong>{opportunity.research.problemSeverityScore}/5</strong><span>Problem severity</span></div>
                <div><strong>{opportunity.research.urgencyScore}/5</strong><span>Urgency</span></div>
                <div><strong>{opportunity.research.strategicFitScore}/5</strong><span>Strategic fit</span></div>
                <div><strong>{opportunity.research.decisionMakerAccessScore}/5</strong><span>Decision-maker access</span></div>
              </div>
              <div className={styles.narrative}><h3>Website quality / operational maturity</h3><p>{opportunity.research.currentWebsiteQuality ? `${opportunity.research.currentWebsiteQuality}/5` : "Not assessed"} · {opportunity.research.operationalMaturity ? `${opportunity.research.operationalMaturity}/5` : "Not assessed"}</p></div>
              <div className={styles.narrative}><h3>Observed problems</h3><p>{opportunity.research.observedProblems ?? "—"}</p></div>
              <div className={styles.narrative}><h3>Recent business activity</h3><p>{opportunity.research.recentBusinessActivity ?? "—"}</p></div>
              <div className={styles.narrative}><h3>Research notes</h3><p>{opportunity.research.notes ?? "—"}</p></div>
              <details className={styles.inlineDetails}>
                <summary>Update research and score</summary>
                <form action={updateProspectResearchAction} className={styles.formGrid}>
                  <input type="hidden" name="opportunityId" value={opportunity.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <label className={styles.field}>Current website quality<select name="currentWebsiteQuality" defaultValue={opportunity.research.currentWebsiteQuality ?? ""}><option value="">Not assessed</option>{[1, 2, 3, 4, 5].map((item) => <option key={item} value={item}>{item} / 5</option>)}</select></label>
                  <label className={styles.field}>Operational maturity<select name="operationalMaturity" defaultValue={opportunity.research.operationalMaturity ?? ""}><option value="">Not assessed</option>{[1, 2, 3, 4, 5].map((item) => <option key={item} value={item}>{item} / 5</option>)}</select></label>
                  <label className={styles.fieldFull}>Observed problems<textarea name="observedProblems" required minLength={10} defaultValue={opportunity.research.observedProblems ?? ""} /></label>
                  <label className={styles.fieldFull}>Recent business activity<textarea name="recentBusinessActivity" defaultValue={opportunity.research.recentBusinessActivity ?? ""} /></label>
                  <label className={styles.fieldFull}>Personalization angle<textarea name="personalizationAngle" required minLength={10} defaultValue={opportunity.personalizationAngle ?? ""} /></label>
                  <label className={styles.fieldFull}>Research notes<textarea name="researchNotes" defaultValue={opportunity.research.notes ?? ""} /></label>
                  {[
                    ["financialCapacityScore", "Financial capacity", opportunity.research.financialCapacityScore],
                    ["problemSeverityScore", "Problem severity", opportunity.research.problemSeverityScore],
                    ["urgencyScore", "Urgency", opportunity.research.urgencyScore],
                    ["strategicFitScore", "Strategic fit", opportunity.research.strategicFitScore],
                    ["decisionMakerAccessScore", "Decision-maker access", opportunity.research.decisionMakerAccessScore],
                  ].map(([name, label, current]) => (
                    <label className={styles.field} key={String(name)}>{String(label)}<select name={String(name)} defaultValue={Number(current)}>{[1, 2, 3, 4, 5].map((item) => <option key={item} value={item}>{item} / 5</option>)}</select></label>
                  ))}
                  <div className={styles.formActions}><button className={styles.secondaryButton} type="submit">Update research profile</button></div>
                </form>
              </details>
            </section>
          ) : null}

          <section className={styles.panel} aria-labelledby="sequence-title">
            <div className={styles.panelHeader}><h2 id="sequence-title">Manual outreach sequence</h2><span>No automatic sending</span></div>
            {opportunity.outreachSequence ? (
              <ol className={styles.sequenceList}>
                {opportunity.outreachSequence.steps.map((step) => {
                  const due = step.scheduledFor <= new Date();
                  return (
                    <li key={step.id} data-status={step.status.toLowerCase()}>
                      <div className={styles.sequenceStepHeader}>
                        <div><span>Day {step.dayOffset}</span><strong>{step.label}</strong></div>
                        <span>{step.status} · {formatAdminDate(step.scheduledFor)}</span>
                      </div>
                      {step.message ? (
                        <div className={styles.narrative}><h3>{step.message.channel} · completed {formatAdminDate(step.completedAt)}</h3><p>{step.message.body}{step.message.response ? `\n\nResponse: ${step.message.response}` : ""}{step.message.nextAction ? `\n\nNext action: ${step.message.nextAction}` : ""}</p></div>
                      ) : due ? (
                        <form action={completeOutreachStepAction} className={styles.formGrid}>
                          <input type="hidden" name="stepId" value={step.id} />
                          <input type="hidden" name="returnTo" value={returnTo} />
                          <label className={styles.field}>Channel<select name="channel" defaultValue="EMAIL"><option>EMAIL</option><option>LINKEDIN</option><option>INSTAGRAM</option><option>PHONE</option><option>WHATSAPP</option><option>REFERRAL</option><option>OTHER</option></select></label>
                          <label className={styles.fieldFull}>Personalized message / interaction<textarea name="message" required /></label>
                          <label className={styles.fieldFull}>Response<textarea name="response" /></label>
                          <label className={styles.fieldFull}>Next action<textarea name="nextAction" /></label>
                          <div className={styles.formActions}><button className={styles.secondaryButton} type="submit">Record manual step</button></div>
                        </form>
                      ) : (
                        <p className={styles.sequencePending}>Scheduled for {formatAdminDate(step.scheduledFor)}. The system will not send anything automatically.</p>
                      )}
                    </li>
                  );
                })}
              </ol>
            ) : opportunity.research?.readyForOutreachAt ? (
              <form action={startOutreachSequenceAction} className={styles.formGrid}>
                <input type="hidden" name="opportunityId" value={opportunity.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <p className={styles.fieldFull}>Prepare Day 0, Day 3, Day 7, and Day 14 as manual work. Each message must be written and recorded individually.</p>
                <label className={styles.fieldFull}>Day 0<input name="startDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></label>
                <div className={styles.formActions}><button className={styles.primaryButton} type="submit">Prepare manual sequence</button></div>
              </form>
            ) : (
              <div className={styles.emptyState}>Complete all required research before outreach can begin.</div>
            )}
          </section>

          <section className={styles.panel} aria-labelledby="activity-title">
            <div className={styles.panelHeader}><h2 id="activity-title">Activity timeline</h2><span>{opportunity.activities.length} events</span></div>
            {opportunity.activities.length ? (
              <ol className={styles.timeline}>{opportunity.activities.map((activity) => (
                <li key={activity.id}>
                  <time dateTime={activity.occurredAt.toISOString()}>{formatAdminDateTime(activity.occurredAt)}</time>
                  <div><strong>{activity.summary}</strong><p>{activity.actor?.name ?? "System"} · {activity.kind.toLowerCase().replaceAll("_", " ")}</p></div>
                </li>
              ))}</ol>
            ) : <div className={styles.emptyState}>No activity recorded.</div>}
          </section>

          <section className={styles.panel} aria-labelledby="messages-title">
            <div className={styles.panelHeader}><h2 id="messages-title">Messages</h2><span>Integration-ready history</span></div>
            {opportunity.messages.length ? (
              <ol className={styles.timeline}>{opportunity.messages.map((message) => (
                <li key={message.id}>
                  <time>{formatAdminDateTime(message.occurredAt)}</time>
                  <div><strong>{message.direction} · {message.channel}{message.subject ? ` · ${message.subject}` : ""}</strong><p>{message.body}{message.response ? ` Response: ${message.response}` : ""}</p></div>
                </li>
              ))}</ol>
            ) : <div className={styles.emptyState}>No outreach or replies recorded.</div>}
          </section>

          <section className={styles.panel} aria-labelledby="proposal-title">
            <div className={styles.panelHeader}><h2 id="proposal-title">Proposal details</h2><span>{opportunity.proposals.length} versions</span></div>
            {opportunity.proposals.length ? (
              <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Version</th><th>Title</th><th>Amount</th><th>Status</th><th>Sent</th><th>Valid until</th></tr></thead><tbody>{opportunity.proposals.map((proposal) => <tr key={proposal.id}><td>v{proposal.version}</td><td>{proposal.title}</td><td>{formatAdminCurrency(Number(proposal.amount))}</td><td>{proposal.status}</td><td>{formatAdminDate(proposal.sentAt)}</td><td>{formatAdminDate(proposal.validUntil)}</td></tr>)}</tbody></table></div>
            ) : <div className={styles.emptyState}>No proposal prepared.</div>}
          </section>
        </div>

        <aside className={styles.sectionStack}>
          <section className={styles.panel} aria-labelledby="controls-title">
            <div className={styles.panelHeader}><h2 id="controls-title">Pipeline controls</h2><span>Audit logged</span></div>
            <form action={updateOpportunityAction} className={styles.formGrid}>
              <input type="hidden" name="opportunityId" value={opportunity.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <label className={styles.fieldFull}>Stage<select name="stage" defaultValue={opportunity.stage}>{opportunityStages.map((stage) => <option key={stage} value={stage}>{opportunityStageLabels[stage]}</option>)}</select></label>
              <label className={styles.fieldFull}>Probability<input name="probability" type="number" min={0} max={100} defaultValue={opportunity.probability} /></label>
              <label className={styles.fieldFull}>Estimated value<input name="estimatedProjectValue" type="number" min={0} step={500} defaultValue={Number(opportunity.estimatedValue)} /></label>
              <label className={styles.fieldFull}>Budget<input name="budget" defaultValue={opportunity.budget ?? ""} /></label>
              <label className={styles.fieldFull}>Timeline<input name="timeline" defaultValue={opportunity.timeline ?? ""} /></label>
              <label className={styles.fieldFull}>Won / lost reason<textarea aria-describedby="outcome-reason-help" name="outcomeReason" defaultValue={opportunity.outcomeReason ?? ""} /></label>
              <p className={styles.fieldFull} id="outcome-reason-help">Required when the stage is Won or Lost. Use the real decision reason; do not infer it.</p>
              <label className={styles.fieldFull}>Assigned owner<select name="assignedOwnerId" defaultValue={opportunity.assignedOwnerId ?? ""}><option value="">Unassigned</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name} · {owner.role}</option>)}</select></label>
              <label className={styles.fieldFull}>Next follow-up<input name="nextFollowUp" type="datetime-local" defaultValue={dateTimeLocal(opportunity.nextFollowUp)} /></label>
              <label className={styles.fieldFull}>Next action<textarea name="nextAction" defaultValue={opportunity.nextAction ?? ""} /></label>
              <div className={styles.formActions}><button className={styles.primaryButton} type="submit">Save changes</button></div>
            </form>
          </section>

          <section className={styles.panel} aria-labelledby="task-title">
            <div className={styles.panelHeader}><h2 id="task-title">Follow-up tasks</h2><span>{opportunity.tasks.length}</span></div>
            {opportunity.tasks.length ? <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Task</th><th>Due</th><th>Status</th></tr></thead><tbody>{opportunity.tasks.map((task) => <tr key={task.id}><td>{task.title}<span className={styles.subtle}><PriorityBadge priority={task.priority} /> · {task.owner.name}</span></td><td>{formatAdminDate(task.dueAt)}</td><td><TaskStatus status={task.status} /></td></tr>)}</tbody></table></div> : null}
            <form action={createTaskAction} className={styles.formGrid}>
              <input type="hidden" name="opportunityId" value={opportunity.id} />
              <input type="hidden" name="companyId" value={opportunity.companyId} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <label className={styles.fieldFull}>Task type<select name="type" defaultValue="FOLLOW_UP">{taskTypes.map((type) => <option key={type} value={type}>{taskTypeLabels[type]}</option>)}</select></label>
              <label className={styles.fieldFull}>Priority<select name="priority" defaultValue="MEDIUM">{taskPriorities.map((priority) => <option key={priority} value={priority}>{taskPriorityLabels[priority]}</option>)}</select></label>
              <label className={styles.fieldFull}>Title<input name="title" required /></label>
              <label className={styles.fieldFull}>Due<input name="dueAt" type="datetime-local" required /></label>
              <label className={styles.fieldFull}>Notes<textarea name="notes" /></label>
              <div className={styles.formActions}><button className={styles.secondaryButton} type="submit">Add task</button></div>
            </form>
          </section>

          <section className={styles.panel} aria-labelledby="research-checklist-title">
            <div className={styles.panelHeader}><h2 id="research-checklist-title">Research checklist</h2><span>{opportunity.research?.readyForOutreachAt ? "Ready for outreach" : "Outreach locked"}</span></div>
            <form action={updateResearchChecklistAction} className={styles.checklistForm}>
              <input type="hidden" name="opportunityId" value={opportunity.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              {[
                ["websiteReviewed", "Website reviewed", opportunity.research?.websiteReviewed],
                ["mobileReviewed", "Mobile reviewed", opportunity.research?.mobileReviewed],
                ["businessModelUnderstood", "Business model understood", opportunity.research?.businessModelUnderstood],
                ["decisionMakerIdentified", "Decision maker identified", opportunity.research?.decisionMakerIdentified],
                ["specificProblemIdentified", "Specific problem identified", opportunity.research?.specificProblemIdentified],
                ["personalizationPrepared", "Personalization prepared", opportunity.research?.personalizationPrepared],
                ["contactMethodFound", "Contact method found", opportunity.research?.contactMethodFound],
              ].map(([name, label, checked]) => (
                <label key={String(name)}><input type="checkbox" name={String(name)} defaultChecked={Boolean(checked)} /><span>{String(label)}</span></label>
              ))}
              <p>Ready for Outreach is calculated only when every requirement is complete.</p>
              <button className={styles.secondaryButton} type="submit">Save research status</button>
            </form>
          </section>

          <section className={styles.panel} aria-labelledby="notes-title">
            <div className={styles.panelHeader}><h2 id="notes-title">Internal notes</h2><span>{opportunity.notes.length}</span></div>
            {opportunity.notes.length ? <ol className={styles.timeline}>{opportunity.notes.map((note) => <li key={note.id}><time>{formatAdminDate(note.createdAt)}</time><div><strong>{note.author.name}</strong><p>{note.body}</p></div></li>)}</ol> : null}
            <form action={addOpportunityNoteAction} className={styles.formGrid}>
              <input type="hidden" name="opportunityId" value={opportunity.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <label className={styles.fieldFull}>Add note<textarea name="body" required /></label>
              <div className={styles.formActions}><button className={styles.secondaryButton} type="submit">Save note</button></div>
            </form>
          </section>

          <section className={styles.panel} aria-labelledby="log-message-title">
            <div className={styles.panelHeader}><h2 id="log-message-title">Log message</h2><span>Manual record</span></div>
            <form action={logMessageAction} className={styles.formGrid}>
              <input type="hidden" name="opportunityId" value={opportunity.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <label className={styles.fieldFull}>Channel<select name="channel" defaultValue="EMAIL"><option>EMAIL</option><option>LINKEDIN</option><option>INSTAGRAM</option><option>PHONE</option><option>WHATSAPP</option><option>REFERRAL</option><option>OTHER</option></select></label>
              <label className={styles.fieldFull}>Direction<select name="direction" defaultValue="OUTBOUND"><option>OUTBOUND</option><option>INBOUND</option><option>INTERNAL</option></select></label>
              <label className={styles.fieldFull}>Subject<input name="subject" /></label>
              <label className={styles.fieldFull}>Message / interaction<textarea name="body" required /></label>
              <label className={styles.fieldFull}>Response<textarea name="response" /></label>
              <label className={styles.fieldFull}>Next action<textarea name="nextAction" /></label>
              <label className={styles.checkboxField}><input type="checkbox" name="needsAction" /><span>Reply needs action</span></label>
              <div className={styles.formActions}><button className={styles.secondaryButton} type="submit">Log activity</button></div>
            </form>
          </section>

          {canArchive ? (
            <section className={styles.panel} aria-labelledby="archive-title">
              <div className={styles.panelHeader}><h2 id="archive-title">Record controls</h2><span>Owner / admin only</span></div>
              <form action={archiveOpportunityAction} className={styles.formGrid}>
                <input type="hidden" name="opportunityId" value={opportunity.id} />
                <p className={styles.fieldFull}>Archive removes this opportunity from active views without deleting its history.</p>
                <div className={styles.formActions}><button className={styles.dangerButton} type="submit">Archive opportunity</button></div>
              </form>
            </section>
          ) : null}
        </aside>
      </div>
    </>
  );
}
