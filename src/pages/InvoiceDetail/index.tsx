import { useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInvoiceGet } from '@/api/invoices/invoices';
import { PageLayout } from '@/components/PageLayout';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getPaidAmount } from './utils';
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

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current) return;

    const canvas = await html2canvas(invoiceRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: invoiceRef.current.scrollWidth,
      windowHeight: invoiceRef.current.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const margin = 10;
    const pageWidth = 210;
    const pageHeight = 297;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;
    const imgHeight = (canvas.height * contentWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(
      imgData,
      'PNG',
      margin,
      position,
      contentWidth,
      imgHeight,
      '',
      'FAST',
    );
    heightLeft -= contentHeight;

    while (heightLeft > 0) {
      position = margin - (imgHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(
        imgData,
        'PNG',
        margin,
        position,
        contentWidth,
        imgHeight,
        '',
        'FAST',
      );
      heightLeft -= contentHeight;
    }

    pdf.save(`faktura-${invoice.number}.pdf`);
  };

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
