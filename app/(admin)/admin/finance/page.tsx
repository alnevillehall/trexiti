import Link from "next/link";

import { createAdminInvoiceAction, recordAdminPaymentAction } from "@/app/(admin)/admin/coo-actions";
import {
  EmptyOperationsState,
  FreshnessStatus,
  OperationsBadge,
  OperationsPageIntro,
  formatMoney,
  formatOperationsDate,
  readableStatus,
  statusTone,
} from "@/components/admin/coo-admin-ui";
import { Notice } from "@/components/admin/admin-ui";
import { IdempotencyKey } from "@/components/admin/idempotency-key";
import { SubmitButton } from "@/components/admin/submit-button";
import styles from "@/components/admin/admin.module.css";
import { requireFounderSession } from "@/lib/admin/auth";
import { listClients, listFinanceOverview, listProjects } from "@/lib/coo/data";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminFinancePage({ searchParams }: { searchParams: SearchParams }) {
  await requireFounderSession();
  const [finance, clients, projects, query] = await Promise.all([
    listFinanceOverview(),
    listClients({ take: 100 }),
    listProjects({ take: 100 }),
    searchParams,
  ]);

  return (
    <>
      <OperationsPageIntro
        eyebrow="Cash operations"
        title="Every amount keeps its currency."
        description="Track invoices, payment allocations, overdue balances, and received cash in JMD and USD without implicit conversion or model-computed totals."
        meta={<FreshnessStatus asOf={finance.asOf} />}
      />

      {first(query.error) ? <Notice tone="error">{first(query.error)}</Notice> : null}
      {first(query.approvalRequested) ? <Notice tone="success">Approval requested. No finance record changes until the founder approves and execution succeeds.</Notice> : null}

      <dl className={`${styles.operationsKpiGrid} ${styles.financeKpiGrid}`} aria-label="Finance metrics">
        <div className={styles.operationsKpi}><dt><Link href="#invoice-register-title">Outstanding</Link></dt><dd><Link href="#invoice-register-title">{formatMoney(finance.outstanding.JMD, "JMD")}</Link><Link href="#invoice-register-title">{formatMoney(finance.outstanding.USD, "USD")}</Link><small>Open payment-derived balance</small></dd></div>
        <div className={styles.operationsKpi}><dt><Link href="#invoice-register-title">Overdue</Link></dt><dd><Link href="#invoice-register-title">{formatMoney(finance.overdue.JMD, "JMD")}</Link><Link href="#invoice-register-title">{formatMoney(finance.overdue.USD, "USD")}</Link><small>Due date passed with balance</small></dd></div>
        <div className={styles.operationsKpi}><dt><Link href="#invoice-register-title">Expected cash · 30 days</Link></dt><dd><Link href="#invoice-register-title">{formatMoney(finance.expectedCash.JMD, "JMD")}</Link><Link href="#invoice-register-title">{formatMoney(finance.expectedCash.USD, "USD")}</Link><small>Issued, non-overdue balances due in window</small></dd></div>
        <div className={styles.operationsKpi}><dt><Link href="#invoice-register-title">Invoiced revenue · month</Link></dt><dd><Link href="#invoice-register-title">{formatMoney(finance.invoicedRevenue.JMD, "JMD")}</Link><Link href="#invoice-register-title">{formatMoney(finance.invoicedRevenue.USD, "USD")}</Link><small>{formatOperationsDate(finance.invoicedRevenuePeriod.from, false)} through {formatOperationsDate(finance.invoicedRevenuePeriod.through, false)} · Jamaica</small></dd></div>
        <div className={styles.operationsKpi}><dt><Link href="#invoice-register-title">Received this month</Link></dt><dd><Link href="#invoice-register-title">{formatMoney(finance.received.JMD, "JMD")}</Link><Link href="#invoice-register-title">{formatMoney(finance.received.USD, "USD")}</Link><small>{formatOperationsDate(finance.receivedPeriod.from, false)} through {formatOperationsDate(finance.receivedPeriod.through, false)} · Jamaica</small></dd></div>
      </dl>

      <div className={styles.operationsColumns}>
        <details className={styles.formPanel} open={first(query.form) === "invoice"}>
          <summary>Record an invoice</summary>
          <form action={createAdminInvoiceAction} className={styles.operationsForm}>
            <IdempotencyKey prefix="invoice-approval" />
            <input type="hidden" name="returnTo" value="/admin/finance?form=invoice" />
            <label>Invoice number<input name="invoiceNumber" required maxLength={80} /></label>
            <label>Client<select name="companyId" required defaultValue=""><option value="" disabled>Select a client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
            <label>Project<select name="projectId" defaultValue=""><option value="">No linked project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title} · {project.companyName}</option>)}</select></label>
            <label>Currency<select name="currency" defaultValue="JMD"><option value="JMD">JMD</option><option value="USD">USD</option></select></label>
            <label>Amount<input name="amount" type="number" min="0.01" step="0.01" required /></label>
            <label>Issued date<input name="issuedAt" type="date" /></label>
            <label>Due date<input name="dueAt" type="date" /></label>
            <label>External reference<input name="externalReference" maxLength={120} /></label>
            <label className={styles.formWide}>Notes<textarea name="notes" maxLength={2000} /></label>
            <div className={styles.formActions}><span>This creates a sensitive-action approval request; it does not create the invoice yet.</span><SubmitButton pendingLabel="Requesting…">Request invoice approval</SubmitButton></div>
          </form>
        </details>

        <details className={styles.formPanel} open={first(query.form) === "payment"}>
          <summary>Allocate a payment</summary>
          <form action={recordAdminPaymentAction} className={styles.operationsForm}>
            <IdempotencyKey prefix="payment-approval" />
            <input type="hidden" name="returnTo" value="/admin/finance?form=payment" />
            <label className={styles.formWide}>Invoice<select name="invoiceId" required defaultValue=""><option value="" disabled>Select an invoice</option>{finance.invoices.filter((invoice) => invoice.balance > 0).map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.invoiceNumber} · {invoice.companyName} · {formatMoney(invoice.balance, invoice.currency)}</option>)}</select></label>
            <label>Amount<input name="amount" type="number" min="0.01" step="0.01" required /></label>
            <label>Paid at (Jamaica time)<input name="paidAt" type="datetime-local" required /></label>
            <label>Method<select name="method" defaultValue="BANK_TRANSFER"><option value="BANK_TRANSFER">Bank transfer</option><option value="CARD">Card</option><option value="CASH">Cash</option><option value="CHEQUE">Cheque</option><option value="MOBILE_MONEY">Mobile money</option><option value="OTHER">Other</option></select></label>
            <label>Status<select name="status" defaultValue="CLEARED"><option value="CLEARED">Cleared</option><option value="PENDING">Pending</option></select></label>
            <label>Reference<input name="reference" maxLength={120} /></label>
            <label className={styles.formWide}>Notes<textarea name="notes" maxLength={2000} /></label>
            <div className={styles.formActions}><span>The server derives company and currency from the invoice and requests founder approval.</span><SubmitButton pendingLabel="Requesting…">Request payment approval</SubmitButton></div>
          </form>
        </details>
      </div>

      <section className={styles.operationsSection} aria-labelledby="invoice-register-title">
        <div className={styles.operationsSectionHeader}><div><h2 id="invoice-register-title">Invoice register</h2><p>Balances are derived from cleared payment allocations</p></div><span>{finance.invoices.length} invoices</span></div>
        {finance.invoices.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.operationsTable}>
              <thead><tr><th>Invoice</th><th>Client / project</th><th>Status</th><th>Amount</th><th>Paid</th><th>Balance</th><th>Due</th></tr></thead>
              <tbody>{finance.invoices.map((invoice) => (
                <tr id={`invoice-${invoice.id}`} key={invoice.id}>
                  <td><Link href={invoice.record.href}>{invoice.invoiceNumber}</Link><small>{invoice.currency}</small></td>
                  <td>{invoice.companyName}<small>{invoice.projectId ? `Project ${invoice.projectId}` : "No linked project"}</small></td>
                  <td><OperationsBadge tone={invoice.overdue ? "danger" : statusTone(invoice.status)}>{invoice.overdue ? "Overdue" : readableStatus(invoice.status)}</OperationsBadge></td>
                  <td>{formatMoney(invoice.amount, invoice.currency)}</td>
                  <td>{formatMoney(invoice.paid, invoice.currency)}</td>
                  <td><strong>{formatMoney(invoice.balance, invoice.currency)}</strong></td>
                  <td>{formatOperationsDate(invoice.dueAt, false)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <EmptyOperationsState title="No invoices recorded" description="Use the focused form above to add the first real client invoice; no sample finance data is fabricated." />}
      </section>
    </>
  );
}
