import type { InvoiceResponseDto } from '@/api/model';

/**
 * Display-only invoice status. Extends the backend status set with a derived
 * `OVERDUE` value for issued invoices whose due date has passed. The backend
 * has no OVERDUE state — it is computed on the client for list summaries,
 * filters and the status dot.
 */
export type InvoiceDisplayStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'PAID'
  | 'CANCELLED'
  | 'OVERDUE';

export const getInvoiceDisplayStatus = (
  invoice: Pick<InvoiceResponseDto, 'status' | 'dueDate'>,
): InvoiceDisplayStatus => {
  if (invoice.status === 'ISSUED' && invoice.dueDate) {
    const due = new Date(invoice.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (due < today) return 'OVERDUE';
  }
  return invoice.status;
};
