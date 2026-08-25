import { CURRENCIES, type Currency, type CurrencyTotals } from "./types";

export const EXPECTED_CASH_HORIZON_DAYS = 30;
const JAMAICA_UTC_OFFSET_MS = 5 * 60 * 60 * 1_000;

export type PaymentAmountInput = {
  currency: Currency;
  amount: number;
  status: "PENDING" | "CLEARED" | "FAILED" | "REFUNDED";
};

export type InvoiceAmountInput = {
  currency: Currency;
  amount: number;
  dueAt: Date | null;
  status: "DRAFT" | "ISSUED" | "PARTIALLY_PAID" | "PAID" | "VOID";
  payments: PaymentAmountInput[];
};

export function emptyCurrencyTotals(): CurrencyTotals {
  return { JMD: 0, USD: 0 };
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateInvoiceBalance(invoice: InvoiceAmountInput): number {
  if (invoice.status === "VOID") return 0;

  const paid = invoice.payments.reduce((total, payment) => {
    if (payment.currency !== invoice.currency) {
      throw new Error("Payment currency must match invoice currency");
    }
    return payment.status === "CLEARED" ? total + payment.amount : total;
  }, 0);

  return roundMoney(Math.max(0, invoice.amount - paid));
}

export function isInvoiceOverdue(
  invoice: InvoiceAmountInput,
  now: Date,
): boolean {
  return Boolean(
    invoice.dueAt &&
      invoice.dueAt < now &&
      calculateInvoiceBalance(invoice) > 0 &&
      invoice.status !== "DRAFT" &&
      invoice.status !== "VOID",
  );
}

export function aggregateInvoiceBalances(
  invoices: InvoiceAmountInput[],
  now: Date,
): { outstanding: CurrencyTotals; overdue: CurrencyTotals } {
  const outstanding = emptyCurrencyTotals();
  const overdue = emptyCurrencyTotals();

  for (const invoice of invoices) {
    if (invoice.status === "DRAFT" || invoice.status === "VOID") continue;
    const balance = calculateInvoiceBalance(invoice);
    outstanding[invoice.currency] = roundMoney(
      outstanding[invoice.currency] + balance,
    );
    if (isInvoiceOverdue(invoice, now)) {
      overdue[invoice.currency] = roundMoney(overdue[invoice.currency] + balance);
    }
  }

  return { outstanding, overdue };
}

export function aggregateExpectedCash(
  invoices: InvoiceAmountInput[],
  now: Date,
  horizonDays = EXPECTED_CASH_HORIZON_DAYS,
): CurrencyTotals {
  const expected = emptyCurrencyTotals();
  const through = new Date(now.getTime() + horizonDays * 86_400_000);
  for (const invoice of invoices) {
    if (
      !invoice.dueAt ||
      invoice.dueAt < now ||
      invoice.dueAt > through ||
      invoice.status === "DRAFT" ||
      invoice.status === "VOID"
    ) {
      continue;
    }
    expected[invoice.currency] = roundMoney(
      expected[invoice.currency] + calculateInvoiceBalance(invoice),
    );
  }
  return expected;
}

export function jamaicaMonthStart(now: Date): Date {
  const local = new Date(now.getTime() - JAMAICA_UTC_OFFSET_MS);
  return new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) +
      JAMAICA_UTC_OFFSET_MS,
  );
}

export function aggregatePipeline(
  opportunities: ReadonlyArray<{
    currency: Currency;
    estimatedValue: number;
    probability: number;
  }>,
): { pipeline: CurrencyTotals; weightedPipeline: CurrencyTotals } {
  const pipeline = emptyCurrencyTotals();
  const weightedPipeline = emptyCurrencyTotals();

  for (const opportunity of opportunities) {
    const probability = Math.min(100, Math.max(0, opportunity.probability));
    pipeline[opportunity.currency] = roundMoney(
      pipeline[opportunity.currency] + opportunity.estimatedValue,
    );
    weightedPipeline[opportunity.currency] = roundMoney(
      weightedPipeline[opportunity.currency] +
        opportunity.estimatedValue * (probability / 100),
    );
  }

  return { pipeline, weightedPipeline };
}

export function summarizeFilteredPipeline<
  T extends {
    currency: Currency;
    estimatedValue: number;
    probability: number;
    stage: string;
  },
>(
  opportunities: readonly T[],
  filters: { currency?: Currency; stage?: string } = {},
): {
  opportunities: T[];
  pipeline: CurrencyTotals;
  weightedPipeline: CurrencyTotals;
  totalOpportunities: number;
} {
  const filtered = opportunities.filter(
    (opportunity) =>
      (!filters.currency || opportunity.currency === filters.currency) &&
      (!filters.stage || opportunity.stage === filters.stage),
  );
  return {
    opportunities: filtered,
    ...aggregatePipeline(filtered),
    totalOpportunities: filtered.length,
  };
}

export function summarizeFilteredOutstandingBalances<
  T extends {
    currency: Currency;
    balance: number;
    overdue: boolean;
  },
>(
  invoices: readonly T[],
  filters: { currency?: Currency; overdueOnly?: boolean } = {},
): { invoices: T[]; totals: CurrencyTotals; totalInvoices: number } {
  const filtered = invoices.filter(
    (invoice) =>
      invoice.balance > 0 &&
      (!filters.currency || invoice.currency === filters.currency) &&
      (!filters.overdueOnly || invoice.overdue),
  );
  return {
    invoices: filtered,
    totals: sumByCurrency(
      filtered.map((invoice) => ({
        currency: invoice.currency,
        amount: invoice.balance,
      })),
    ),
    totalInvoices: filtered.length,
  };
}

export function sumByCurrency(
  values: ReadonlyArray<{ currency: Currency; amount: number }>,
): CurrencyTotals {
  const result = emptyCurrencyTotals();
  for (const currency of CURRENCIES) {
    result[currency] = roundMoney(
      values
        .filter((value) => value.currency === currency)
        .reduce((total, value) => total + value.amount, 0),
    );
  }
  return result;
}
