import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyOperationsState, OperationsBadge, OperationsPageIntro, formatMoney, formatOperationsDate, readableStatus } from "@/components/admin/coo-admin-ui";
import styles from "@/components/admin/admin.module.css";
import { requireFounderSession } from "@/lib/admin/auth";
import { getClientById, listFinanceOverview, listProjects } from "@/lib/coo/data";

export default async function AdminClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireFounderSession();
  const { id } = await params;
  const [client, projects, finance] = await Promise.all([
    getClientById(id),
    listProjects({ companyId: id }),
    listFinanceOverview({ companyId: id }),
  ]);
  if (!client) notFound();
  const invoices = finance.invoices;

  return (
    <>
      <OperationsPageIntro eyebrow="Client record" title={client.name} description={`${client.industry} · ${client.country} · ${client.domain}`} meta={<><OperationsBadge tone={client.health === "HEALTHY" ? "success" : "warning"}>{readableStatus(client.health)}</OperationsBadge><Link href="/admin/clients">Back to clients</Link></>} />
      <dl className={styles.operationsKpiGrid}>
        <div className={styles.operationsKpi}><dt>Active projects</dt><dd><span>{client.activeProjects}</span><small>{projects.filter((project) => project.health === "AT_RISK").length} at risk</small></dd></div>
        <div className={styles.operationsKpi}><dt>Outstanding JMD</dt><dd><span>{formatMoney(client.outstanding.JMD, "JMD")}</span><small>Payment-derived balance</small></dd></div>
        <div className={styles.operationsKpi}><dt>Outstanding USD</dt><dd><span>{formatMoney(client.outstanding.USD, "USD")}</span><small>No implicit FX conversion</small></dd></div>
        <div className={styles.operationsKpi}><dt>Last record update</dt><dd><span>{formatOperationsDate(client.lastUpdatedAt)}</span><small>Source record freshness</small></dd></div>
      </dl>
      <div className={styles.operationsColumns}>
        <section className={styles.operationsSection} aria-labelledby="client-projects-title"><div className={styles.operationsSectionHeader}><div><h2 id="client-projects-title">Delivery</h2><p>Projects and current health</p></div><span>{projects.length}</span></div>{projects.length ? <ul className={styles.compactRecordList}>{projects.map((project) => <li className={styles.queueItem} key={project.id}><div><Link href={project.record.href}>{project.title}</Link><p>{project.progressPercent}% complete · target {formatOperationsDate(project.targetEndAt, false)}</p></div><OperationsBadge tone={project.health === "AT_RISK" ? "danger" : project.health === "ATTENTION" ? "warning" : "success"}>{readableStatus(project.health)}</OperationsBadge></li>)}</ul> : <EmptyOperationsState title="No delivery projects" description="Create the first real project from the Projects page." />}</section>
        <section className={styles.operationsSection} aria-labelledby="client-invoices-title"><div className={styles.operationsSectionHeader}><div><h2 id="client-invoices-title">Finance</h2><p>Invoices and open balances</p></div><span>{invoices.length}</span></div>{invoices.length ? <ul className={styles.compactRecordList}>{invoices.map((invoice) => <li className={styles.queueItem} key={invoice.id}><div><Link href={invoice.record.href}>{invoice.invoiceNumber}</Link><p>{formatMoney(invoice.balance, invoice.currency)} outstanding · due {formatOperationsDate(invoice.dueAt, false)}</p></div><OperationsBadge tone={invoice.overdue ? "danger" : "neutral"}>{invoice.overdue ? "Overdue" : readableStatus(invoice.status)}</OperationsBadge></li>)}</ul> : <EmptyOperationsState title="No invoices" description="Approved invoices will be shown here." />}</section>
      </div>
      {client.healthReasons.length ? <section className={styles.operationsSection} aria-labelledby="client-health-evidence"><div className={styles.operationsSectionHeader}><h2 id="client-health-evidence">Health evidence</h2><OperationsBadge tone="warning">Attention</OperationsBadge></div><ul className={styles.compactRecordList}>{client.healthReasons.map((reason) => <li className={styles.queueItem} key={reason}><div><strong>{readableStatus(reason)}</strong></div></li>)}</ul></section> : null}
    </>
  );
}
