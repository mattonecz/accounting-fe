import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RefreshCcw } from 'lucide-react';
import { useSimpleInvoiceListByCompany } from '@/api/simple-invoice/simple-invoice';
import type { SimpleInvoiceResponseDto } from '@/api/model';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { DataTableCard } from '@/components/DataTableCard';
import { formatDate, formatMoney } from '@/lib/formatters';
import { CreateSimpleInvoiceDialog } from './CreateSimpleInvoiceDialog';

const SimpleInvoices = () => {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const {
    data: invoices = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useSimpleInvoiceListByCompany<SimpleInvoiceResponseDto[]>({
    query: { select: (response) => response.data },
  });

  const soucty = useMemo(
    () =>
      invoices.reduce(
        (acc, inv) => ({
          total: acc.total + inv.total,
          totalTax: acc.totalTax + inv.totalTax,
          totalWithTax: acc.totalWithTax + inv.totalWithTax,
        }),
        { total: 0, totalTax: 0, totalWithTax: 0 },
      ),
    [invoices],
  );

  const lang = i18n.language;

  const columns = [
    {
      header: t('simpleInvoices.columns.number'),
      cell: (i: SimpleInvoiceResponseDto) => <span className="font-medium">{i.number}</span>,
    },
    { header: t('simpleInvoices.columns.company'), cell: (i: SimpleInvoiceResponseDto) => i.contact?.name || '-' },
    { header: t('invoices.fields.createdDate'), cell: (i: SimpleInvoiceResponseDto) => formatDate(i.createdDate, lang) },
    { header: t('invoices.fields.duzpDate'), cell: (i: SimpleInvoiceResponseDto) => formatDate(i.duzpDate, lang) },
    {
      header: t('simpleInvoices.columns.base'),
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      cell: (i: SimpleInvoiceResponseDto) => formatMoney(i.total, 'CZK', lang),
    },
    {
      header: t('simpleInvoices.columns.vat'),
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      cell: (i: SimpleInvoiceResponseDto) => formatMoney(i.totalTax, 'CZK', lang),
    },
    {
      header: t('simpleInvoices.columns.totalWithVat'),
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      cell: (i: SimpleInvoiceResponseDto) => formatMoney(i.totalWithTax, 'CZK', lang),
    },
    { header: t('invoices.fields.note'), cell: (i: SimpleInvoiceResponseDto) => i.description || '-' },
  ];

  return (
    <PageLayout>
      <PageHeader
        title={t('nav.simpleInvoices')}
        description={t('simpleInvoices.description')}
        actions={
          <>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              {t('common.refresh')}
            </Button>
            <CreateSimpleInvoiceDialog open={open} onOpenChange={setOpen} />
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{t('simpleInvoices.stats.count')}</CardDescription>
            <CardTitle className="text-3xl">{invoices.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{t('simpleInvoices.stats.totalVat')}</CardDescription>
            <CardTitle className="text-3xl">{formatMoney(soucty.totalTax, 'CZK', lang)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{t('simpleInvoices.stats.totalWithVat')}</CardDescription>
            <CardTitle className="text-3xl">{formatMoney(soucty.totalWithTax, 'CZK', lang)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <DataTableCard
        title={t('simpleInvoices.listTitle')}
        columns={columns}
        data={invoices}
        isLoading={isLoading}
        isError={isError}
        emptyMessage={t('simpleInvoices.empty')}
        loadingMessage={t('simpleInvoices.loading')}
        errorMessage={t('simpleInvoices.error')}
      />
    </PageLayout>
  );
};

export default SimpleInvoices;
