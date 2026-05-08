import { useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInvoiceGet } from '@/api/invoices/invoices';
import { PageLayout } from '@/components/PageLayout';
import { getPaidAmount } from './utils';
import { generateInvoicePdf } from './generatePdf';
import { InvoicePrintDocument } from './InvoicePrintDocument';
import { InvoiceHeroSection } from './InvoiceHeroSection';
import { InvoiceInfoCards } from './InvoiceInfoCards';
import { InvoiceItemsTable } from './InvoiceItemsTable';
import { PaymentsCard } from './PaymentsCard';
import { StatusHistoryCard } from './StatusHistoryCard';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useInvoiceGet(id || '');
  const invoiceRef = useRef<HTMLDivElement | null>(null);

  const invoice = data?.data;
  const currency = invoice?.currency || 'CZK';
  const payments = invoice?.payments ?? [];
  const paidAmount = useMemo(() => getPaidAmount(invoice), [invoice]);
  const remainingAmount = Math.max(
    (invoice?.totalWithTax ?? 0) - paidAmount,
    0,
  );

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current || !invoice) return;
    await generateInvoicePdf(invoiceRef.current, `faktura-${invoice.number}.pdf`);
  };

  if (!id) {
    return (
      <PageLayout>
        <p className="text-muted-foreground">Neplatné ID faktury.</p>
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout>
        <p className="text-muted-foreground">Načítám fakturu...</p>
      </PageLayout>
    );
  }

  if (isError || !invoice) {
    return (
      <PageLayout>
        <p className="text-destructive">Fakturu se nepodařilo načíst.</p>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="bg-slate-50/40">
      <style>
        {`@media print {
          @page { size: A4; margin: 12mm; }
          body { background: white !important; }
          body * { visibility: hidden !important; }
          #invoice-print-root, #invoice-print-root * { visibility: visible !important; }
          #invoice-print-root { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; }
          .invoice-sheet { box-shadow: none !important; width: auto !important; min-height: auto !important; }
        }`}
      </style>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Detail faktury
          </p>
          <p className="text-sm text-muted-foreground">
            Faktura {invoice.number}
          </p>
        </div>
      </div>

      <InvoiceHeroSection
        invoice={invoice}
        currency={currency}
        paidAmount={paidAmount}
        remainingAmount={remainingAmount}
        onDownloadPdf={handleDownloadPdf}
      />

      <InvoiceInfoCards invoice={invoice} />
      <InvoiceItemsTable invoice={invoice} currency={currency} />
      <PaymentsCard payments={payments} currency={currency} />
      <StatusHistoryCard statusHistory={invoice.statusHistory} />
      <InvoicePrintDocument invoice={invoice} invoiceRef={invoiceRef} />
    </PageLayout>
  );
};

export default InvoiceDetail;
