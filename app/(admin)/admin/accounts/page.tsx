import Link from "next/link";

import { createOpportunityAction } from "@/app/(admin)/admin/actions";
import { AdminPageHeader, EmptyAdminState, Notice, StageBadge } from "@/components/admin/admin-ui";
import styles from "@/components/admin/admin.module.css";
import {
  formatAdminCurrency,
  formatAdminDate,
  opportunityHeat,
  opportunityHeatLabel,
  opportunityStageLabels,
  opportunityStages,
  opportunityTypeLabels,
  opportunityTypes,
} from "@/lib/admin/crm";
import { getTargetAccounts } from "@/lib/admin/queries";
import { opportunityFiltersSchema } from "@/lib/admin/validation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function rating(value: number | null | undefined) {
  return value ? `${value}/5` : "—";
}

export default async function AdminTargetAccountsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const parsedFilters = opportunityFiltersSchema.safeParse({
    q: first(params.q) || undefined,
    stage: first(params.stage) || undefined,
    industry: first(params.industry) || undefined,
    country: first(params.country) || undefined,
    minScore: first(params.minScore) || undefined,
    minValue: first(params.minValue) || undefined,
    followUp: first(params.followUp) || undefined,
    readiness: first(params.readiness) || undefined,
  });
  const filters = parsedFilters.success ? parsedFilters.data : {};
  const requestedPage = Number(first(params.page) ?? 1);
  const data = await getTargetAccounts(
    filters,
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
  );
  const error = first(params.error);
  const paginationParams = new URLSearchParams();
  for (const [key, item] of Object.entries(filters)) {
    if (item !== undefined) paginationParams.set(key, String(item));
  }
  const pageHref = (page: number) => {
    const next = new URLSearchParams(paginationParams);
    next.set("page", String(page));
    return `/admin/accounts?${next.toString()}`;
  };

  return (
    <>
      <AdminPageHeader
        eyebrow="Account-based outreach"
        title="Target accounts"
        description="Research high-value businesses, document a specific problem and personalization angle, then unlock a deliberate manual outreach sequence only when the account is ready."
        action={{ href: "#new-prospect", label: "Research account" }}
      />
      {error ? <Notice tone="error">{error}</Notice> : null}

      <form className={styles.toolbar} action="/admin/accounts" method="get">
        <label>Search<input name="q" defaultValue={filters.q} placeholder="Company, contact, reference…" /></label>
        <label>Stage<select name="stage" defaultValue={filters.stage ?? ""}><option value="">All stages</option>{opportunityStages.map((stage) => <option key={stage} value={stage}>{opportunityStageLabels[stage]}</option>)}</select></label>
        <label>Industry<select name="industry" defaultValue={filters.industry ?? ""}><option value="">All industries</option>{data.industries.map((industry) => <option key={industry}>{industry}</option>)}</select></label>
        <label>Country<select name="country" defaultValue={filters.country ?? ""}><option value="">All countries</option>{data.countries.map((country) => <option key={country}>{country}</option>)}</select></label>
        <label>Score<select name="minScore" defaultValue={filters.minScore ?? ""}><option value="">Any</option><option value="20">Hot · 20+</option><option value="15">Warm · 15+</option></select></label>
        <label>Research status<select name="readiness" defaultValue={filters.readiness ?? ""}><option value="">Any status</option><option value="ready">Ready for outreach</option><option value="incomplete">Research incomplete</option></select></label>
        <label>Project range<select name="minValue" defaultValue={filters.minValue ?? ""}><option value="">Any</option><option value="10000">$10,000+</option><option value="25000">$25,000+</option><option value="50000">$50,000+</option></select></label>
        <label>Follow-up<select name="followUp" defaultValue={filters.followUp ?? ""}><option value="">Any date</option><option value="overdue">Overdue</option><option value="today">Today</option><option value="upcoming">Next 7 days</option></select></label>
        <button className={styles.secondaryButton} type="submit">Apply</button>
      </form>

      <section className={styles.panel} style={{ marginTop: "0.75rem" }} aria-labelledby="target-table-title">
        <div className={styles.panelHeader}><h2 id="target-table-title">Researched accounts</h2><span>{data.total} total · page {data.page}/{data.pageCount}</span></div>
        {data.accounts.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Account</th><th>Decision maker</th><th>Opportunity</th><th>Digital / operational</th><th>Score</th><th>Research</th><th>Sequence</th><th>Next follow-up</th></tr></thead>
              <tbody>{data.accounts.map((account) => {
                const research = account.research;
                const heat = research ? opportunityHeat(research.totalScore) : "LOW";
                const nextStep = account.outreachSequence?.steps.find((step) => step.status !== "COMPLETED" && step.status !== "SKIPPED");
                const methods = account.primaryContact?.contactMethods.map((method) => method.channel).join(" · ");
                return (
                  <tr key={account.id}>
                    <td><Link href={`/admin/leads/${account.id}`}>{account.company.name}</Link><span className={styles.subtle}>{account.company.website ?? account.company.domain}<br />{account.company.industry} · {account.company.country} · {account.company.estimatedSize ?? "Size unverified"}</span></td>
                    <td>{account.primaryContact?.name ?? "Not identified"}<span className={styles.subtle}>{account.primaryContact?.title ?? "—"}<br />{methods || "No contact method"}</span></td>
                    <td>{opportunityTypeLabels[account.type]}<span className={styles.subtle}>{formatAdminCurrency(Number(account.estimatedValue))}<br /><StageBadge stage={account.stage} /></span></td>
                    <td>{rating(research?.currentWebsiteQuality)} / {rating(research?.operationalMaturity)}<span className={styles.subtle}>Website quality / operational maturity</span></td>
                    <td><span className={styles.scoreBadge} data-heat={heat.toLowerCase()}>{opportunityHeatLabel(research?.totalScore ?? 0)} · {research?.totalScore ?? 0}/25</span></td>
                    <td>{research?.readyForOutreachAt ? <span className={styles.readinessReady}>Ready for outreach</span> : <span className={styles.readinessLocked}>Research incomplete</span>}</td>
                    <td>{account.outreachSequence ? (nextStep ? `Day ${nextStep.stepNumber === 1 ? 0 : nextStep.stepNumber === 2 ? 3 : nextStep.stepNumber === 3 ? 7 : 14} · ${nextStep.status}` : "Complete") : "Not started"}<span className={styles.subtle}>{nextStep ? formatAdminDate(nextStep.scheduledFor) : "Manual only"}</span></td>
                    <td>{formatAdminDate(account.nextFollowUp)}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        ) : <EmptyAdminState>No target accounts match the current filters.</EmptyAdminState>}
        {data.pageCount > 1 ? (
          <nav className={styles.pagination} aria-label="Target account pages">
            {data.page > 1 ? <Link href={pageHref(data.page - 1)}>Previous</Link> : <span>Previous</span>}
            <span>Page {data.page} of {data.pageCount}</span>
            {data.page < data.pageCount ? <Link href={pageHref(data.page + 1)}>Next</Link> : <span>Next</span>}
          </nav>
        ) : null}
      </section>

      <details className={styles.formPanel} id="new-prospect" style={{ marginTop: "1rem" }} open={Boolean(error)}>
        <summary>Research a new target account</summary>
        <form action={createOpportunityAction} className={styles.formGrid}>
          <input type="hidden" name="returnTo" value="/admin/accounts#new-prospect" />
          <label className={styles.field}>Company<input name="companyName" required maxLength={160} /></label>
          <label className={styles.field}>Website<input name="website" type="url" placeholder="https://" /></label>
          <label className={styles.field}>Industry<input name="industry" required maxLength={100} /></label>
          <label className={styles.field}>Country<input name="country" required defaultValue="Jamaica" /></label>
          <label className={styles.field}>Estimated company size<input name="estimatedCompanySize" placeholder="e.g. 50–100 employees" /></label>
          <label className={styles.field}>Decision maker<input name="decisionMaker" required /></label>
          <label className={styles.field}>Decision maker title<input name="decisionMakerTitle" /></label>
          <label className={styles.field}>Email<input name="email" type="email" required autoComplete="email" /></label>
          <label className={styles.field}>Phone<input name="phone" type="tel" autoComplete="tel" /></label>
          <label className={styles.field}>LinkedIn<input name="linkedInUrl" type="url" placeholder="https://linkedin.com/in/…" /></label>
          <label className={styles.field}>Instagram<input name="instagramUrl" type="url" placeholder="https://instagram.com/…" /></label>
          <label className={styles.field}>WhatsApp<input name="whatsapp" placeholder="Number or business link" /></label>
          <label className={styles.field}>Other contact method<input name="otherContactMethod" /></label>
          <label className={styles.field}>Opportunity type<select name="opportunityType" defaultValue="BUSINESS_SYSTEM">{opportunityTypes.map((type) => <option key={type} value={type}>{opportunityTypeLabels[type]}</option>)}</select></label>
          <label className={styles.field}>Estimated project value<input name="estimatedProjectValue" type="number" min={3000} step={500} required defaultValue={10000} /></label>
          <label className={styles.field}>Estimated project range<input name="budget" placeholder="$10,000–$25,000" /></label>
          <label className={styles.field}>Timeline<input name="timeline" placeholder="3–6 months" /></label>
          <label className={styles.field}>Source<input name="source" required defaultValue="Manual research" /></label>
          <label className={styles.field}>Next follow-up<input name="nextFollowUp" type="datetime-local" /></label>
          <label className={styles.field}>Current website quality<select name="currentWebsiteQuality" defaultValue=""><option value="">Not assessed</option>{[1,2,3,4,5].map((item) => <option key={item} value={item}>{item} / 5</option>)}</select></label>
          <label className={styles.field}>Operational maturity<select name="operationalMaturity" defaultValue=""><option value="">Not assessed</option>{[1,2,3,4,5].map((item) => <option key={item} value={item}>{item} / 5</option>)}</select></label>
          <label className={styles.fieldFull}>Identified problem summary<textarea name="identifiedProblem" required minLength={10} /></label>
          <label className={styles.fieldFull}>Observed problems<textarea name="observedProblems" required minLength={10} /></label>
          <label className={styles.fieldFull}>Opportunity<textarea name="opportunity" required minLength={10} /></label>
          <label className={styles.fieldFull}>Recent business activity<textarea name="recentBusinessActivity" /></label>
          <label className={styles.fieldFull}>Reason for contact<textarea name="reasonForContact" required minLength={10} /></label>
          <label className={styles.fieldFull}>Personalization angle<textarea name="personalizationAngle" required minLength={10} /></label>
          <label className={styles.fieldFull}>Research notes<textarea name="researchNotes" /></label>
          {[
            ["financialCapacityScore", "Financial capacity"],
            ["problemSeverityScore", "Problem severity"],
            ["urgencyScore", "Urgency"],
            ["strategicFitScore", "Strategic fit"],
            ["decisionMakerAccessScore", "Decision-maker access"],
          ].map(([name, label]) => (
            <label className={styles.field} key={name}>{label}<select name={name} defaultValue="3">{[1,2,3,4,5].map((item) => <option key={item} value={item}>{item} / 5</option>)}</select></label>
          ))}
          <div className={styles.formActions}><button className={styles.primaryButton} type="submit">Create target account</button></div>
        </form>
      </details>
    </>
  );
}
