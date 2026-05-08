import { useMemo, useState } from 'react';
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
import { CreateSimpleInvoiceDialog } from './CreateSimpleInvoiceDialog';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('cs-CZ').format(new Date(date));

const columns = [
  {
    header: 'Číslo dokladu',
    cell: (i: SimpleInvoiceResponseDto) => <span className="font-medium">{i.number}</span>,
  },
  { header: 'Firma', cell: (i: SimpleInvoiceResponseDto) => i.contact?.name || '-' },
  { header: 'Datum vystavení', cell: (i: SimpleInvoiceResponseDto) => formatDate(i.createdDate) },
  { header: 'Datum plnění', cell: (i: SimpleInvoiceResponseDto) => formatDate(i.duzpDate) },
  {
    header: 'Základ',
    headerClassName: 'text-right',
    cellClassName: 'text-right',
    cell: (i: SimpleInvoiceResponseDto) => formatCurrency(i.total),
  },
  {
    header: 'DPH',
    headerClassName: 'text-right',
    cellClassName: 'text-right',
    cell: (i: SimpleInvoiceResponseDto) => formatCurrency(i.totalTax),
  },
  {
    header: 'Celkem s DPH',
    headerClassName: 'text-right',
    cellClassName: 'text-right',
    cell: (i: SimpleInvoiceResponseDto) => formatCurrency(i.totalWithTax),
  },
  { header: 'Poznámka', cell: (i: SimpleInvoiceResponseDto) => i.description || '-' },
];

const SimpleInvoices = () => {
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

  return (
    <PageLayout>
      <PageHeader
        title="Zjednodušené doklady"
        description="Přehled a evidence zjednodušených daňových dokladů z reálných dat"
        actions={
          <>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Obnovit
            </Button>
            <CreateSimpleInvoiceDialog open={open} onOpenChange={setOpen} />
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Počet dokladů</CardDescription>
            <CardTitle className="text-3xl">{invoices.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Celkové DPH</CardDescription>
            <CardTitle className="text-3xl">{formatCurrency(soucty.totalTax)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Celkem s DPH</CardDescription>
            <CardTitle className="text-3xl">{formatCurrency(soucty.totalWithTax)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <DataTableCard
        title="Seznam zjednodušených dokladů"
        columns={columns}
        data={invoices}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Zatím nemáte evidovaný žádný zjednodušený doklad."
        loadingMessage="Načítám zjednodušené doklady…"
        errorMessage="Nepodařilo se načíst zjednodušené doklady. Zkuste načtení zopakovat."
      />
    </PageLayout>
  );
};

export default SimpleInvoices;
