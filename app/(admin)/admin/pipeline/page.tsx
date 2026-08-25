import Link from "next/link";

import { moveOpportunityAction } from "@/app/(admin)/admin/actions";
import { AdminPageHeader, EmptyAdminState, Notice } from "@/components/admin/admin-ui";
import { formatMoney } from "@/components/admin/coo-admin-ui";
import styles from "@/components/admin/admin.module.css";
import {
  opportunityHeatLabel,
  opportunityStageLabels,
  opportunityStages,
} from "@/lib/admin/crm";
import { getAdminPipeline } from "@/lib/admin/queries";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminPipelinePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [columns, query] = await Promise.all([getAdminPipeline(), searchParams]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Commercial progression"
        title="Pipeline board"
        description="A stage-based operating view for moving opportunities deliberately—from research and contact through decision, win, or loss."
      />
      {query.approvalRequested ? <Notice tone="success">Founder approval requested. Terminal-stage changes remain pending until guarded execution succeeds.</Notice> : null}
      <div className={styles.kanban} aria-label="Opportunity pipeline">
        {columns.map((column) => (
          <section className={styles.kanbanColumn} key={column.stage} aria-labelledby={`stage-${column.stage}`}>
            <header className={styles.kanbanHeader}>
              <span id={`stage-${column.stage}`}>{opportunityStageLabels[column.stage]}</span>
              <span>{column.opportunities.length}</span>
            </header>
            <div className={styles.kanbanCards}>
              {column.opportunities.length ? column.opportunities.map((opportunity) => {
                const score = opportunity.research?.totalScore;
                return (
                  <article className={styles.kanbanCard} key={opportunity.id}>
                    <Link href={`/admin/leads/${opportunity.id}`}>{opportunity.company.name}</Link>
                    <p>{opportunity.title}</p>
                    <div className={styles.kanbanCardMeta}>
                      <span>{formatMoney(Number(opportunity.estimatedValue), opportunity.currency)}</span>
                      <span>{score ? `${opportunityHeatLabel(score)} · ${score}/25` : `${opportunity.probability}%`}</span>
                    </div>
                    <form className={styles.kanbanMove} action={moveOpportunityAction}>
                      <input type="hidden" name="opportunityId" value={opportunity.id} />
                      <input type="hidden" name="returnTo" value="/admin/pipeline" />
                      <label className="sr-only" htmlFor={`move-${opportunity.id}`}>Move {opportunity.company.name}</label>
                      <select id={`move-${opportunity.id}`} name="stage" defaultValue={opportunity.stage}>
                        {opportunityStages
                          .filter(
                            (stage) =>
                              stage === opportunity.stage ||
                              !["WON", "LOST"].includes(stage),
                          )
                          .map((stage) => <option key={stage} value={stage}>{opportunityStageLabels[stage]}</option>)}
                      </select>
                      <button type="submit">Move</button>
                    </form>
                  </article>
                );
              }) : <EmptyAdminState>No opportunities.</EmptyAdminState>}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
