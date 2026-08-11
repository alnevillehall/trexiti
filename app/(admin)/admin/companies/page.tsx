import Link from "next/link";

import { AdminPageHeader, EmptyAdminState, StageBadge } from "@/components/admin/admin-ui";
import styles from "@/components/admin/admin.module.css";
import { formatAdminCurrency } from "@/lib/admin/crm";
import { getAdminCompanies } from "@/lib/admin/queries";

export default async function AdminCompaniesPage() {
  const companies = await getAdminCompanies();

  return (
    <>
      <AdminPageHeader
        eyebrow="Account intelligence"
        title="Companies"
        description="Company context, decision makers, active opportunities, project history, notes, and estimated commercial value—not a flat contact list."
        action={{ href: "/admin/accounts#new-prospect", label: "Add target account" }}
      />
      {companies.length ? (
        <div className={styles.companyGrid}>
          {companies.map((company) => {
            const activeValue = company.opportunities
              .filter((item) => !["WON", "LOST"].includes(item.stage))
              .reduce((sum, item) => sum + Number(item.estimatedValue), 0);
            const projects = company.opportunities.filter((item) => item.stage === "WON");
            return (
              <article className={styles.companyCard} key={company.id}>
                <header className={styles.companyCardHeader}>
                  <div>
                    <h2>{company.name}</h2>
                    <p>{company.industry} · {company.country} · {company.estimatedSize ?? "Size unverified"}</p>
                  </div>
                  <span className={styles.stageBadge}>{company.status}</span>
                </header>
                <div className={styles.companyStats}>
                  <div><strong>{company._count.contacts}</strong><span>Contacts</span></div>
                  <div><strong>{formatAdminCurrency(activeValue)}</strong><span>Open value</span></div>
                  <div><strong>{formatAdminCurrency(Number(company.lifetimeValue))}</strong><span>Lifetime value</span></div>
                </div>
                <div className={styles.companyBody}>
                  <div>
                    <h3>Contacts</h3>
                    {company.contacts.length ? (
                      <ul>{company.contacts.slice(0, 4).map((contact) => <li key={contact.id}><strong>{contact.name}</strong><span className={styles.subtle}>{contact.title ?? contact.email ?? "Contact"}{contact.isDecisionMaker ? " · Decision maker" : ""}</span></li>)}</ul>
                    ) : <p className={styles.subtle}>No contacts recorded.</p>}
                  </div>
                  <div>
                    <h3>Opportunities</h3>
                    {company.opportunities.length ? (
                      <ul>{company.opportunities.slice(0, 4).map((opportunity) => <li key={opportunity.id}><Link href={`/admin/leads/${opportunity.id}`}>{opportunity.reference}</Link><span className={styles.subtle}><StageBadge stage={opportunity.stage} /> · {formatAdminCurrency(Number(opportunity.estimatedValue))}</span></li>)}</ul>
                    ) : <p className={styles.subtle}>No opportunities recorded.</p>}
                  </div>
                </div>
                {projects.length || company.notes ? (
                  <div className={styles.narrative}>
                    <h3>Project history / notes</h3>
                    <p>{projects.length ? `${projects.length} won project${projects.length === 1 ? "" : "s"}. ` : ""}{company.notes ?? "No additional account notes."}</p>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <section className={styles.panel}><EmptyAdminState>No company records yet.</EmptyAdminState></section>
      )}
    </>
  );
}
