import { useTranslation } from 'react-i18next';

import { useInvoiceListByCompany } from '@/api/invoices/invoices';
import { useListTaxFilings } from '@/api/tax-filings/tax-filings';
import {
  InvoiceListByCompanySortBy,
  InvoiceListByCompanySortOrder,
  InvoiceListByCompanyStatus,
  InvoiceListByCompanyType,
  TaxFilingResponseDtoStatus,
} from '@/api/model';

const QUEUE_LIMIT = 3;

export interface QueueEntry {
  id: string;
  kind: 'overdue' | 'draft' | 'filing';
  title: string;
  amount: number;
  currency: string;
  /** Days past the due date for overdue invoices. */
  daysOverdue?: number;
  route: string;
}

/**
 * The dashboard action queue: overdue receivables, unfinished drafts and VAT
 * filings waiting to be submitted — all read from the API, capped at a few
 * items per group so the card stays short.
 */
export const useDashboardQueue = () => {
  const { i18n } = useTranslation();

  const overdueQuery = useInvoiceListByCompany({
    type: InvoiceListByCompanyType.ISSUED,
    status: InvoiceListByCompanyStatus.OVERDUE,
    sortBy: InvoiceListByCompanySortBy.dueDate,
    sortOrder: InvoiceListByCompanySortOrder.ASC,
    pageSize: QUEUE_LIMIT,
  });

  const draftsQuery = useInvoiceListByCompany({
    status: InvoiceListByCompanyStatus.DRAFT,
    sortBy: InvoiceListByCompanySortBy.createdDate,
    sortOrder: InvoiceListByCompanySortOrder.DESC,
    pageSize: QUEUE_LIMIT,
  });

  const filingsQuery = useListTaxFilings();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue: QueueEntry[] = (overdueQuery.data?.data.data ?? []).map(
    (invoice) => ({
      id: invoice.id,
      kind: 'overdue',
      title: [invoice.number, invoice.contactSnapshot?.name]
        .filter(Boolean)
        .join(' · '),
      amount: invoice.totalWithTax,
      currency: invoice.currency || 'CZK',
      daysOverdue: invoice.dueDate
        ? Math.max(
            Math.floor(
              (today.getTime() - new Date(invoice.dueDate).getTime()) /
                86_400_000,
            ),
            0,
          )
        : undefined,
      route: `/invoices/${invoice.id}`,
    }),
  );

  const drafts: QueueEntry[] = (draftsQuery.data?.data.data ?? []).map(
    (invoice) => ({
      id: invoice.id,
      kind: 'draft',
      title:
        invoice.contactSnapshot?.name ||
        invoice.number ||
        invoice.id.slice(0, 8),
      amount: invoice.totalWithTax,
      currency: invoice.currency || 'CZK',
      route:
        invoice.kind === 'SIMPLE'
          ? `/invoices/simple/${invoice.id}/edit`
          : `/invoices/${invoice.id}/edit`,
    }),
  );

  const monthFormat = new Intl.DateTimeFormat(i18n.language, { month: 'long' });
  const filings: QueueEntry[] = (filingsQuery.data?.data ?? [])
    .filter((filing) => filing.status === TaxFilingResponseDtoStatus.READY)
    .slice(0, QUEUE_LIMIT)
    .map((filing) => ({
      id: filing.id,
      kind: 'filing',
      title: `${monthFormat.format(new Date(filing.year, filing.month - 1, 1))} ${filing.year}`,
      amount: filing.summary?.payableVat ?? 0,
      currency: 'CZK',
      route: `/tax-filings/${filing.id}`,
    }));

  const items = [...overdue, ...drafts, ...filings];

  return {
    items,
    /** Total number of overdue invoices, not just the ones listed above. */
    overdueTotal: overdueQuery.data?.data.total ?? 0,
    isLoading:
      overdueQuery.isLoading || draftsQuery.isLoading || filingsQuery.isLoading,
  };
};
