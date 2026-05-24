import { useTranslation } from 'react-i18next';
import { InvoiceResponseDtoKind, type InvoiceResponseDto } from '@/api/model';
import { DataTableCard } from '@/components/DataTableCard';
import { formatDate, formatMoney } from '@/lib/formatters';

interface TaxFilingInvoiceTablesProps {
  issued: InvoiceResponseDto[];
  received: InvoiceResponseDto[];
  isLoading?: boolean;
  isError?: boolean;
}

export const TaxFilingInvoiceTables = ({
  issued,
  received,
  isLoading,
  isError,
}: TaxFilingInvoiceTablesProps) => {
  const { t, i18n } = useTranslation();

  const fmtMoney = (value: number) => formatMoney(value, 'CZK', i18n.language);
  const partner = (invoice: InvoiceResponseDto) =>
    invoice.contactSnapshot?.name || '-';

  const issuedColumns = [
    {
      header: t('taxFilings.invoiceTables.columns.number'),
      cell: (invoice: InvoiceResponseDto) => invoice.number,
      cellClassName: 'font-mono font-medium',
    },
    {
      header: t('taxFilings.invoiceTables.columns.partner'),
      cell: partner,
    },
    {
      header: t('taxFilings.invoiceTables.columns.duzp'),
      cell: (invoice: InvoiceResponseDto) => formatDate(invoice.duzpDate),
      cellClassName: 'text-muted-foreground',
    },
    {
      header: t('taxFilings.invoiceTables.columns.base'),
      headerClassName: 'text-right',
      cellClassName: 'text-right tabular-nums',
      cell: (invoice: InvoiceResponseDto) => fmtMoney(Number(invoice.total ?? 0)),
    },
    {
      header: t('taxFilings.invoiceTables.columns.vat'),
      headerClassName: 'text-right',
      cellClassName: 'text-right tabular-nums',
      cell: (invoice: InvoiceResponseDto) => fmtMoney(Number(invoice.totalTax ?? 0)),
    },
    {
      header: t('taxFilings.invoiceTables.columns.total'),
      headerClassName: 'text-right',
      cellClassName: 'text-right font-semibold tabular-nums',
      cell: (invoice: InvoiceResponseDto) =>
        fmtMoney(Number(invoice.totalWithTax ?? 0)),
    },
  ];

  const receivedColumns = [
    ...issuedColumns.slice(0, 1),
    {
      header: t('taxFilings.invoiceTables.columns.type'),
      cell: (invoice: InvoiceResponseDto) =>
        invoice.kind === InvoiceResponseDtoKind.SIMPLE
          ? t('taxFilings.invoiceTables.kindSimple')
          : t('taxFilings.invoiceTables.kindInvoice'),
      cellClassName: 'text-muted-foreground',
    },
    ...issuedColumns.slice(1),
    {
      header: t('taxFilings.invoiceTables.columns.claimType'),
      cell: (invoice: InvoiceResponseDto) => invoice.vatClaimType ?? '–',
    },
    {
      header: t('taxFilings.invoiceTables.columns.claimRatio'),
      cellClassName: 'tabular-nums',
      cell: (invoice: InvoiceResponseDto) => {
        const raw = invoice.vatClaimRatio as unknown;
        const value = typeof raw === 'number' ? raw : Number(raw);
        return Number.isFinite(value) ? value : '–';
      },
    },
    {
      header: t('taxFilings.invoiceTables.columns.claimMonth'),
      cell: (invoice: InvoiceResponseDto) => invoice.vatClaimMonth ?? '–',
    },
  ];

  return (
    <>
      <DataTableCard
        title={t('taxFilings.invoiceTables.issued')}
        columns={issuedColumns}
        data={issued}
        isLoading={isLoading}
        isError={isError}
        emptyMessage={t('taxFilings.invoiceTables.empty')}
      />
      <DataTableCard
        title={t('taxFilings.invoiceTables.received')}
        columns={receivedColumns}
        data={received}
        isLoading={isLoading}
        isError={isError}
        emptyMessage={t('taxFilings.invoiceTables.empty')}
      />
    </>
  );
};
