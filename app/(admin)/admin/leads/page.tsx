import Link from "next/link";

import {
  AdminPageHeader,
  EmptyAdminState,
  Notice,
  StageBadge,
} from "@/components/admin/admin-ui";
import styles from "@/components/admin/admin.module.css";
import { formatMoney } from "@/components/admin/coo-admin-ui";
import {
  convertProjectLeadAction,
} from "@/app/(admin)/admin/actions";
import {
  formatAdminDate,
  opportunityHeat,
  opportunityHeatLabel,
  opportunityStageLabels,
  opportunityStages,
  opportunityTypeLabels,
} from "@/lib/admin/crm";
import {
  getAdminOpportunities,
  getUnconvertedProjectLeads,
} from "@/lib/admin/queries";
import { opportunityFiltersSchema } from "@/lib/admin/validation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const parsedFilters = opportunityFiltersSchema.safeParse({
    q: first(params.q) || undefined,
    stage: first(params.stage) || undefined,
    industry: first(params.industry) || undefined,
    country: first(params.country) || undefined,
    currency: first(params.currency) || undefined,
    minScore: first(params.minScore) || undefined,
    minValue: first(params.minValue) || undefined,
    followUp: first(params.followUp) || undefined,
  });
  const filters = parsedFilters.success ? parsedFilters.data : {};
  const requestedPage = Number(first(params.page) ?? 1);
  const [{ opportunities, total, page, pageCount, industries, countries }, inboundLeads] =
    await Promise.all([
      getAdminOpportunities(
        filters,
        Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
      ),
      getUnconvertedProjectLeads(),
    ]);
  const error = first(params.error);
  const paginationParams = new URLSearchParams();
  for (const [key, item] of Object.entries(filters)) {
    if (item !== undefined) paginationParams.set(key, String(item));
  }
  const pageHref = (targetPage: number) => {
    const next = new URLSearchParams(paginationParams);
    next.set("page", String(targetPage));
    return `/admin/leads?${next.toString()}`;
  };

  return (
    <>
      <AdminPageHeader
        eyebrow="Inbound + outbound"
        title="Opportunity register"
        description="A filterable commercial record of qualified inbound work, researched target accounts, decision makers, value, ownership, and next action."
        action={{ href: "/admin/accounts#new-prospect", label: "Research target account" }}
      />

      {error ? <Notice tone="error">{error}</Notice> : null}
      {params.approvalRequested ? <Notice tone="success">Founder approval requested. The opportunity remains unchanged until approval and guarded execution succeed.</Notice> : null}

      {inboundLeads.length ? (
        <section className={styles.panel} aria-labelledby="inbound-leads-title" style={{ marginBottom: "0.75rem" }}>
          <div className={styles.panelHeader}>
            <h2 id="inbound-leads-title">Inbound qualifications awaiting review</h2>
            <span>{inboundLeads.length} submissions</span>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Stage</th>
                  <th>Engagement</th>
                  <th>Qualification summary</th>
                  <th>Attribution</th>
                  <th>Next action</th>
                  <th>Received</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {inboundLeads.map((lead) => {
                  const attribution = [
                    lead.lastTouchSource ?? lead.utmSource ?? lead.source,
                    lead.lastTouchMedium ?? lead.utmMedium,
                    lead.lastTouchCampaign ?? lead.utmCampaign,
                  ]
                    .filter(Boolean)
                    .join(" / ");

                  return (
                    <tr key={lead.id}>
                      <td>
                        {lead.companyName}
                        <span className={styles.subtle}>
                          {lead.industry} · {lead.location}
                        </span>
                        <span className={styles.subtle}>
                          {lead.name} · {lead.email}
                        </span>
                      </td>
                      <td>{lead.status}</td>
                      <td>
                        {lead.engagementShape ?? lead.projectType}
                        <span className={styles.subtle}>
                          {lead.companyStage ?? "Stage not supplied"}
                          {lead.teamSize ? ` · ${lead.teamSize}` : ""}
                        </span>
                      </td>
                      <td>
                        {lead.projectType}
                        <span className={styles.subtle}>
                          {(lead.qualificationSummary ?? lead.objectives.join(" · ")).slice(0, 280)}
                        </span>
                      </td>
                      <td>
                        {attribution || lead.source}
                        {lead.firstTouchSource ? (
                          <span className={styles.subtle}>
                            First touch: {lead.firstTouchSource}
                          </span>
                        ) : null}
                      </td>
                      <td>
                        {lead.nextAction ??
                          "Review the business context and prepare discovery questions."}
                      </td>
                      <td>{formatAdminDate(lead.createdAt)}</td>
                      <td>
                        <form action={convertProjectLeadAction}>
                          <input type="hidden" name="projectLeadId" value={lead.id} />
                          <button className={styles.secondaryButton} type="submit">
                            Convert to opportunity
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <form className={styles.toolbar} action="/admin/leads" method="get">
        <label>
          Search
          <input name="q" defaultValue={filters.q} placeholder="Company, contact, reference…" />
        </label>
        <label>
          Stage
          <select name="stage" defaultValue={filters.stage ?? ""}>
            <option value="">All stages</option>
            {opportunityStages.map((stage) => (
              <option key={stage} value={stage}>{opportunityStageLabels[stage]}</option>
            ))}
          </select>
        </label>
        <label>
          Industry
          <select name="industry" defaultValue={filters.industry ?? ""}>
            <option value="">All industries</option>
            {industries.map((industry) => <option key={industry}>{industry}</option>)}
          </select>
        </label>
        <label>
          Country
          <select name="country" defaultValue={filters.country ?? ""}>
            <option value="">All countries</option>
            {countries.map((country) => <option key={country}>{country}</option>)}
          </select>
        </label>
        <label>
          Minimum score
          <select name="minScore" defaultValue={filters.minScore ?? ""}>
            <option value="">Any score</option>
            <option value="20">Hot · 20+</option>
            <option value="15">Warm · 15+</option>
          </select>
        </label>
        <label>
          Value currency
          <select name="currency" defaultValue={filters.currency ?? ""}>
            <option value="">JMD and USD</option>
            <option value="JMD">JMD only</option>
            <option value="USD">USD only</option>
          </select>
        </label>
        <label>
          Minimum recorded value
          <select name="minValue" defaultValue={filters.minValue ?? ""}>
            <option value="">Any value</option>
            <option value="10000">10,000+</option>
            <option value="25000">25,000+</option>
            <option value="50000">50,000+</option>
          </select>
        </label>
        <label>
          Follow-up
          <select name="followUp" defaultValue={filters.followUp ?? ""}>
            <option value="">Any date</option>
            <option value="overdue">Overdue</option>
            <option value="today">Today</option>
            <option value="upcoming">Next 7 days</option>
          </select>
        </label>
        <button className={styles.secondaryButton} type="submit">Apply filters</button>
      </form>

      <section className={styles.panel} style={{ marginTop: "0.75rem" }} aria-labelledby="opportunity-table-title">
        <div className={styles.panelHeader}>
          <h2 id="opportunity-table-title">Active opportunities</h2>
          <span>{total} records · page {page}/{pageCount}</span>
        </div>
        {opportunities.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Decision maker</th>
                  <th>Type</th>
                  <th>Stage</th>
                  <th>Score</th>
                  <th>Value</th>
                  <th>Next follow-up</th>
                  <th>Owner</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((item) => {
                  const score = item.research?.totalScore;
                  const heat = score ? opportunityHeat(score) : null;
                  return (
                    <tr key={item.id}>
                      <td>
                        <Link href={`/admin/leads/${item.id}`}>{item.company.name}</Link>
                        <span className={styles.subtle}>{item.reference} · {item.company.industry}</span>
                      </td>
                      <td>
                        {item.primaryContact?.name ?? "Not identified"}
                        <span className={styles.subtle}>{item.primaryContact?.title ?? item.primaryContact?.email ?? "—"}</span>
                      </td>
                      <td>{opportunityTypeLabels[item.type]}</td>
                      <td><StageBadge stage={item.stage} /></td>
                      <td>
                        {score ? (
                          <span className={styles.scoreBadge} data-heat={heat?.toLowerCase()}>
                            {opportunityHeatLabel(score)} · {score}/25
                          </span>
                        ) : "—"}
                      </td>
                      <td>{formatMoney(Number(item.estimatedValue), item.currency)}</td>
                      <td>{formatAdminDate(item.nextFollowUp)}</td>
                      <td>{item.assignedOwner?.name ?? "Unassigned"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyAdminState>No opportunities match the current filters.</EmptyAdminState>
        )}
        {pageCount > 1 ? (
          <nav className={styles.pagination} aria-label="Opportunity pages">
            {page > 1 ? <Link href={pageHref(page - 1)}>Previous</Link> : <span>Previous</span>}
            <span>Page {page} of {pageCount}</span>
            {page < pageCount ? <Link href={pageHref(page + 1)}>Next</Link> : <span>Next</span>}
          </nav>
        ) : null}
      </section>

    </>
  );
}
