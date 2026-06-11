import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useInvoiceListByCompany } from '@/api/invoices/invoices';
import type { InvoiceResponseDto } from '@/api/model';
import { Button } from '@/components/ui/button';
import { DataTableCard } from '@/components/DataTableCard';
import { InvoiceStatusBadge } from '@/components/InvoiceStatusBadge';
import { formatDate, formatMoney } from '@/lib/formatters';

const PAGE_SIZE = 10;

interface ContactInvoicesCardProps {
  contactId: string;
}

export const ContactInvoicesCard = ({ contactId }: ContactInvoicesCardProps) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const invoices = useInvoiceListByCompany(
    { contactId, page, pageSize: PAGE_SIZE },
    { query: { placeholderData: keepPreviousData } },
  );

  const result = invoices.data?.data;
  const totalPages = result?.totalPages ?? 0;

  const columns = [
    {
      header: t('invoices.list.columns.number'),
      cell: (invoice: InvoiceResponseDto) => invoice.number || '-',
      cellClassName: 'font-mono font-medium',
    },
    {
      header: t('contacts.detail.invoices.typeColumn'),
      cell: (invoice: InvoiceResponseDto) =>
        invoice.type === 'RECEIVED'
          ? t('contacts.detail.invoices.typeReceived')
          : t('contacts.detail.invoices.typeIssued'),
      cellClassName: 'text-muted-foreground',
    },
    {
      header: t('invoices.list.columns.amount'),
      cell: (invoice: InvoiceResponseDto) =>
        formatMoney(invoice.totalWithTax, invoice.currency || 'CZK', i18n.language),
      cellClassName: 'font-semibold',
    },
    {
      header: t('invoices.list.columns.status'),
      cell: (invoice: InvoiceResponseDto) => <InvoiceStatusBadge status={invoice.status} />,
    },
    {
      header: t('invoices.list.columns.createdDate'),
      cell: (invoice: InvoiceResponseDto) => formatDate(invoice.createdDate, i18n.language),
      cellClassName: 'text-muted-foreground',
    },
  ];

  return (
    <DataTableCard
      title={t('contacts.detail.invoices.title')}
      columns={columns}
      data={result?.data}
      isLoading={invoices.isLoading}
      isError={invoices.isError}
      emptyMessage={t('contacts.detail.invoices.empty')}
      loadingMessage={t('invoices.list.loading')}
      errorMessage={t('invoices.list.error')}
      onRowClick={(invoice) => navigate(`/invoices/${invoice.id}`)}
      footer={
        totalPages > 1 ? (
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">
              {t('common.pagination.pageOf', { page: result?.page ?? page, totalPages })}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={page <= 1 || invoices.isFetching}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                {t('common.pagination.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={page >= totalPages || invoices.isFetching}
                onClick={() => setPage((current) => current + 1)}
              >
                {t('common.pagination.next')}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : undefined
      }
    />
  );
};
