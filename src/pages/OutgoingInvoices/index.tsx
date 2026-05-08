import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { DataTableCard } from '@/components/DataTableCard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Pencil, MoreHorizontal, Eye, Download, Landmark } from 'lucide-react';
import { useInvoiceListByCompany } from '@/api/invoices/invoices';
import { RecordPaymentDialog } from '@/components/RecordPaymentDialog';
import { InvoiceStatusBadge } from '@/components/InvoiceStatusBadge';
import { useNavigate } from 'react-router-dom';
import { InvoiceListByCompanyType } from '@/api/model/invoiceListByCompanyType';
import { InvoiceResponseDto } from '@/api/model/invoiceResponseDto';
import { InvoicePdfRenderer } from '@/components/InvoicePdfRenderer';

export default function OutgoingInvoices() {
  const navigate = useNavigate();
  const invoices = useInvoiceListByCompany({ type: InvoiceListByCompanyType.ISSUED });
  const [paymentInvoice, setPaymentInvoice] =
    useState<InvoiceResponseDto | null>(null);
  const [pdfInvoiceId, setPdfInvoiceId] = useState<string | null>(null);

  const columns = [
    {
      header: 'Číslo faktury',
      cell: (invoice: InvoiceResponseDto) => (
        <span className="text-primary underline-offset-4 hover:underline">
          {invoice.number}
        </span>
      ),
      cellClassName: 'font-mono font-medium',
    },
    {
      header: 'Odběratel',
      headerClassName: 'w-[32%]',
      cell: (invoice: InvoiceResponseDto) =>
        invoice.contactSnapshot?.name || '-',
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
        <div
          className="flex justify-end gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
            aria-label={`Upravit fakturu ${invoice.number}`}
            title="Upravit"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label={`Další akce pro fakturu ${invoice.number}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setPaymentInvoice(invoice)}>
                <Landmark className="mr-2 h-4 w-4" />
                Zaznamenat platbu
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate(`/invoices/${invoice.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Detail
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPdfInvoiceId(invoice.id)}>
                <Download className="mr-2 h-4 w-4" />
                Stáhnout PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

      {paymentInvoice && (
        <RecordPaymentDialog
          invoice={paymentInvoice}
          open
          onOpenChange={(open) => {
            if (!open) setPaymentInvoice(null);
          }}
          hideTrigger
        />
      )}

      {pdfInvoiceId && (
        <InvoicePdfRenderer
          invoiceId={pdfInvoiceId}
          onDone={() => setPdfInvoiceId(null)}
        />
      )}
    </PageLayout>
  );
}
