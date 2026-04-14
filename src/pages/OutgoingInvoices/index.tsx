import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { DataTableCard } from '@/components/DataTableCard';
import { Plus, Eye, Pencil } from 'lucide-react';
import { useInvoiceListByUser } from '@/api/invoices/invoices';
import { RecordPaymentDialog } from '@/components/RecordPaymentDialog';
import { InvoiceStatusBadge } from '@/components/InvoiceStatusBadge';
import { useNavigate } from 'react-router-dom';
import { InvoiceListByUserType } from '@/api/model/invoiceListByUserType';
import { InvoiceResponseDto } from '@/api/model/invoiceResponseDto';

export default function OutgoingInvoices() {
  const navigate = useNavigate();
  const invoices = useInvoiceListByUser({ type: InvoiceListByUserType.ISSUED });

  const columns = [
    {
      header: 'Číslo faktury',
      cell: (invoice: InvoiceResponseDto) => invoice.number,
      cellClassName: 'font-mono font-medium',
    },
    {
      header: 'Odběratel',
      headerClassName: 'w-[32%]',
      cell: (invoice: InvoiceResponseDto) =>
        invoice.company?.name || invoice.supplier?.name || '-',
      cellClassName: 'min-w-[220px]',
    },
    {
      header: 'Částka',
      cell: (invoice: InvoiceResponseDto) => invoice.total,
      cellClassName: 'font-semibold text-warning',
    },
    {
      header: 'Stav',
      cell: (invoice: InvoiceResponseDto) => (
        <InvoiceStatusBadge status={invoice.status} />
      ),
    },
    {
      header: 'Datum vystavení',
      cell: (invoice: InvoiceResponseDto) => invoice.createdDate,
      cellClassName: 'text-muted-foreground',
    },
    {
      header: 'Akce',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      cell: (invoice: InvoiceResponseDto) => (
        <div className="flex justify-end gap-2">
          <RecordPaymentDialog invoice={invoice} />
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/invoices/${invoice.id}/edit`);
            }}
            aria-label={`Upravit fakturu ${invoice.number}`}
            title="Upravit"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/invoices/${invoice.id}`);
            }}
            aria-label={`Zobrazit fakturu ${invoice.number}`}
            title="Zobrazit"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageLayout>
      <PageHeader
        title="Faktury vydané"
        description="Sledujte faktury vydané"
        actions={
          <Button
            className="gap-2"
            onClick={() => navigate('/invoices/create')}
          >
            <Plus className="h-4 w-4" />
            Vytvořit fakturu
          </Button>
        }
      />

      <DataTableCard
        title="Všechny faktury"
        columns={columns}
        data={invoices.data?.data?.data}
        isLoading={invoices.isLoading}
        isError={invoices.isError}
        onRowClick={(invoice) => navigate(`/invoices/${invoice.id}`)}
      />
    </PageLayout>
  );
}
