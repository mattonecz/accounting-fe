import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const invoices = useInvoiceListByCompany({ type: InvoiceListByCompanyType.ISSUED });
  const [paymentInvoice, setPaymentInvoice] = useState<InvoiceResponseDto | null>(null);
  const [pdfInvoiceId, setPdfInvoiceId] = useState<string | null>(null);

  const columns = [
    {
      header: t('invoices.list.columns.number'),
      cell: (invoice: InvoiceResponseDto) => (
        <span className="text-primary underline-offset-4 hover:underline">{invoice.number}</span>
      ),
      cellClassName: 'font-mono font-medium',
    },
    {
      header: t('invoices.list.columns.contact'),
      headerClassName: 'w-[32%]',
      cell: (invoice: InvoiceResponseDto) => invoice.contactSnapshot?.name || '-',
      cellClassName: 'min-w-[220px]',
    },
    {
      header: t('invoices.list.columns.amount'),
      cell: (invoice: InvoiceResponseDto) => invoice.total,
      cellClassName: 'font-semibold text-warning',
    },
    {
      header: t('invoices.list.columns.status'),
      cell: (invoice: InvoiceResponseDto) => <InvoiceStatusBadge status={invoice.status} />,
    },
    {
      header: t('invoices.list.columns.createdDate'),
      cell: (invoice: InvoiceResponseDto) => invoice.createdDate,
      cellClassName: 'text-muted-foreground',
    },
    {
      header: t('invoices.list.columns.actions'),
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      cell: (invoice: InvoiceResponseDto) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
            aria-label={t('invoices.actions.editAriaLabel', { number: invoice.number })}
            title={t('invoices.actions.edit')}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label={t('invoices.actions.moreAriaLabel', { number: invoice.number })}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setPaymentInvoice(invoice)}>
                <Landmark className="mr-2 h-4 w-4" />
                {t('payments.actions.record')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                {t('invoices.actions.detail')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPdfInvoiceId(invoice.id)}>
                <Download className="mr-2 h-4 w-4" />
                {t('invoices.actions.downloadPdf')}
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
        title={t('nav.invoicesIssued')}
        description={t('invoices.list.descriptionIssued')}
        actions={
          <Button className="gap-2" onClick={() => navigate('/invoices/create')}>
            <Plus className="h-4 w-4" />
            {t('invoices.actions.create')}
          </Button>
        }
      />

      <DataTableCard
        title={t('invoices.list.allInvoices')}
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
          onOpenChange={(open) => { if (!open) setPaymentInvoice(null); }}
          hideTrigger
        />
      )}

      {pdfInvoiceId && (
        <InvoicePdfRenderer invoiceId={pdfInvoiceId} onDone={() => setPdfInvoiceId(null)} />
      )}
    </PageLayout>
  );
}
