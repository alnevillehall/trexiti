import Link from "next/link";
import { notFound } from "next/navigation";

import { recordAdminPaymentAction } from "@/app/(admin)/admin/coo-actions";
import { OperationsBadge, OperationsPageIntro, formatMoney, formatOperationsDate, readableStatus, statusTone } from "@/components/admin/coo-admin-ui";
import { SubmitButton } from "@/components/admin/submit-button";
import { IdempotencyKey } from "@/components/admin/idempotency-key";
import styles from "@/components/admin/admin.module.css";
import { requireFounderSession } from "@/lib/admin/auth";
import { getInvoiceById } from "@/lib/coo/data";

export default async function AdminInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireFounderSession();
  const { id } = await params;
  const invoice = await getInvoiceById(id);
  if (!invoice) notFound();

  return (
    <>
      <OperationsPageIntro eyebrow="Invoice record" title={invoice.invoiceNumber} description={`${invoice.companyName} · ${invoice.currency}`} meta={<><OperationsBadge tone={invoice.overdue ? "danger" : statusTone(invoice.status)}>{invoice.overdue ? "Overdue" : readableStatus(invoice.status)}</OperationsBadge><Link href="/admin/finance">Back to finance</Link></>} />
      <dl className={styles.operationsKpiGrid}>
        <div className={styles.operationsKpi}><dt>Amount</dt><dd><span>{formatMoney(invoice.amount, invoice.currency)}</span><small>Recorded invoice total</small></dd></div>
        <div className={styles.operationsKpi}><dt>Paid</dt><dd><span>{formatMoney(invoice.paid, invoice.currency)}</span><small>Cleared allocations</small></dd></div>
        <div className={styles.operationsKpi}><dt>Balance</dt><dd><span>{formatMoney(invoice.balance, invoice.currency)}</span><small>Never converted to another currency</small></dd></div>
        <div className={styles.operationsKpi}><dt>Due</dt><dd><span>{formatOperationsDate(invoice.dueAt, false)}</span><small>{invoice.overdue ? "Past due with open balance" : "Current due-state"}</small></dd></div>
      </dl>
      {invoice.balance > 0 ? <details className={styles.formPanel} style={{ marginTop: "1rem" }} open><summary>Request payment allocation</summary><form action={recordAdminPaymentAction} className={styles.operationsForm}>
        <IdempotencyKey prefix={`payment-${invoice.id}`} />
        <input type="hidden" name="invoiceId" value={invoice.id} /><input type="hidden" name="companyId" value={invoice.companyId} /><input type="hidden" name="currency" value={invoice.currency} /><input type="hidden" name="returnTo" value={`/admin/finance/invoices/${invoice.id}`} />
        <label>Amount<input name="amount" type="number" min="0.01" max={invoice.balance} step="0.01" required /></label>
        <label>Paid at (Jamaica time)<input name="paidAt" type="datetime-local" required /></label>
        <label>Method<select name="method" defaultValue="BANK_TRANSFER"><option value="BANK_TRANSFER">Bank transfer</option><option value="CARD">Card</option><option value="CASH">Cash</option><option value="CHEQUE">Cheque</option><option value="MOBILE_MONEY">Mobile money</option><option value="OTHER">Other</option></select></label>
        <label>Reference<input name="reference" /></label><label className={styles.formWide}>Notes<textarea name="notes" /></label>
        <div className={styles.formActions}><span>This creates a founder approval request; it does not change the balance immediately.</span><SubmitButton pendingLabel="Requesting…">Request approval</SubmitButton></div>
      </form></details> : null}
    </>
  );
}
