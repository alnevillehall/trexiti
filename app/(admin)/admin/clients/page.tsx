import Link from "next/link";

import {
  EmptyOperationsState,
  FreshnessStatus,
  OperationsBadge,
  OperationsPageIntro,
  formatMoney,
  formatOperationsDate,
  readableStatus,
} from "@/components/admin/coo-admin-ui";
import styles from "@/components/admin/admin.module.css";
import { requireFounderSession } from "@/lib/admin/auth";
import { listClients } from "@/lib/coo/data";

export default async function AdminClientsPage() {
  await requireFounderSession();
  const clients = await listClients({ take: 100 });
  const attention = clients.filter((client) => client.health === "ATTENTION").length;
  const asOf = clients.reduce<string | null>((latest, client) => latest && latest > client.lastUpdatedAt ? latest : client.lastUpdatedAt, null);

  return (
    <>
      <OperationsPageIntro
        eyebrow="Client operations"
        title="Clients, viewed through delivery and cash."
        description="Client health is derived from active project risk, overdue invoices, blocked dependencies or approvals, and stale delivery updates."
        meta={<><FreshnessStatus asOf={asOf} /><span>{clients.length} active · {attention} need attention</span></>}
      />

      <section className={styles.operationsSection} aria-labelledby="client-register-title">
        <div className={styles.operationsSectionHeader}><div><h2 id="client-register-title">Active client register</h2><p>Each signal links to the underlying company record</p></div><Link href="/admin/companies">Manage companies</Link></div>
        {clients.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.operationsTable}>
              <thead><tr><th>Client</th><th>Health</th><th>Why</th><th>Active projects</th><th>Outstanding JMD</th><th>Outstanding USD</th><th>Last update</th></tr></thead>
              <tbody>{clients.map((client) => (
                <tr id={`client-${client.id}`} key={client.id}>
                  <td><Link href={client.record.href}>{client.name}</Link><small>{client.domain}<br />{client.industry} · {client.country}</small></td>
                  <td><OperationsBadge tone={client.health === "HEALTHY" ? "success" : "warning"}>{readableStatus(client.health)}</OperationsBadge></td>
                  <td>{client.healthReasons.length ? client.healthReasons.map(readableStatus).join(" · ") : "No active exception"}</td>
                  <td>{client.activeProjects}</td>
                  <td>{formatMoney(client.outstanding.JMD, "JMD")}</td>
                  <td>{formatMoney(client.outstanding.USD, "USD")}</td>
                  <td>{formatOperationsDate(client.lastUpdatedAt)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <EmptyOperationsState title="No active clients yet" description="Change a company to client status, then add its delivery project and invoices." />}
      </section>
    </>
  );
}
