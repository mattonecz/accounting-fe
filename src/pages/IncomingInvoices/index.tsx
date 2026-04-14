import { Button } from '@/components/ui/button';
import { InvoiceStatusBadge } from '@/components/InvoiceStatusBadge';
import { RecordPaymentDialog } from '@/components/RecordPaymentDialog';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { DataTableCard } from '@/components/DataTableCard';
import { Plus, Eye, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInvoiceListByUser } from '@/api/invoices/invoices';
import { InvoiceListByUserType } from '@/api/model/invoiceListByUserType';
import { InvoiceResponseDto } from '@/api/model/invoiceResponseDto';

export default function IncomingInvoices() {
  const navigate = useNavigate();
  const invoices = useInvoiceListByUser({
    type: InvoiceListByUserType.RECEIVED,
  });

  const columns = [
    {
      header: 'Invoice #',
      cell: (invoice: InvoiceResponseDto) => invoice.number,
      cellClassName: 'font-mono font-medium',
    },
    {
      header: 'Client',
      cell: (invoice: InvoiceResponseDto) =>
        invoice.company?.name || invoice.supplier?.name || '-',
    },
    {
      header: 'Amount',
      cell: (invoice: InvoiceResponseDto) => invoice.total,
      cellClassName: 'font-semibold text-success',
    },
    {
      header: 'Status',
      cell: (invoice: InvoiceResponseDto) => (
        <InvoiceStatusBadge status={invoice.status} />
      ),
    },
    {
      header: 'Issue Date',
      cell: (invoice: InvoiceResponseDto) => invoice.createdDate,
      cellClassName: 'text-muted-foreground',
    },
    {
      header: 'Due Date',
      cell: (invoice: InvoiceResponseDto) => invoice.dueDate,
      cellClassName: 'text-muted-foreground',
    },
    {
      header: 'Actions',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      cell: (invoice: InvoiceResponseDto) => (
        <div className="flex justify-end gap-2">
          <RecordPaymentDialog invoice={invoice} stopPropagation />
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
        title="Incoming Invoices"
        description="Track incoming invoices"
        actions={
          <Button
            className="gap-2"
            onClick={() => navigate('/invoices/create')}
          >
            <Plus className="h-4 w-4" />
            Create Invoice
          </Button>
        }
      />

      <DataTableCard
        title="All Invoices"
        columns={columns}
        data={invoices.data?.data?.data}
        isLoading={invoices.isLoading}
        isError={invoices.isError}
        emptyMessage="No incoming invoices found."
        loadingMessage="Loading invoices..."
        errorMessage="Failed to load invoices."
        onRowClick={(invoice) => navigate(`/invoices/${invoice.id}`)}
      />
    </PageLayout>
  );
}
