import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Download,
  MoreHorizontal,
  Pencil,
  Printer,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInvoiceGet } from '@/api/invoices/invoices';
import { useCompanyGet } from '@/api/companies/companies';
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
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useInvoiceGet(id || '');
  const invoiceRef = useRef<HTMLDivElement | null>(null);

  const invoice = data?.data;
  const { data: companyResponse } = useCompanyGet(invoice?.companyId ?? '', {
    query: { enabled: !!invoice?.companyId },
  });
  const company = companyResponse?.data;
  const currency = invoice?.currency || 'CZK';
  const payments = invoice?.payments ?? [];
  const paidAmount = useMemo(() => getPaidAmount(invoice), [invoice]);
  const remainingAmount = Math.max(
    (invoice?.totalWithTax ?? 0) - paidAmount,
    0,
  );

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    await generateInvoicePdf(invoice, company, `faktura-${invoice.number}.pdf`);
  };

  const renderContent = () => {
    if (!id) {
      return (
        <p className="text-muted-foreground">
          {t('invoices.detail.invalidId')}
        </p>
      );
    }
    if (isLoading) {
      return (
        <p className="text-muted-foreground">{t('invoices.detail.loading')}</p>
      );
    }
    if (isError || !invoice) {
      return <p className="text-destructive">{t('invoices.detail.error')}</p>;
    }

    const isReceived = invoice.type === 'RECEIVED';
    const isSimple = invoice.kind === 'SIMPLE';
    const listRoute = isReceived ? '/incoming-invoices' : '/outgoing-invoices';
    const editRoute = isSimple
      ? `/invoices/simple/${invoice.id}/edit`
      : `/invoices/${invoice.id}/edit`;

    return (
      <>
        <style>
          {`@media print {
          @page { size: A4; margin: 0; }
          body { background: white !important; }
          body * { visibility: hidden !important; }
          #invoice-print-root, #invoice-print-root * { visibility: visible !important; }
          #invoice-print-root { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; }
          .invoice-sheet { box-shadow: none !important; width: auto !important; min-height: auto !important; }
        }`}
        </style>

        <div className="mx-auto w-full max-w-[1040px] space-y-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate(listRoute)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {isReceived
                ? t('invoices.detail.backIncoming')
                : t('invoices.detail.backOutgoing')}
            </button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => navigate(editRoute)}
              >
                <Pencil className="h-3.5 w-3.5" />
                {t('invoices.actions.edit')}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={t('invoices.detail.hero.moreLabel')}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" />
                    {t('invoices.detail.hero.print')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadPdf}>
                    <Download className="mr-2 h-4 w-4" />
                    {t('invoices.actions.downloadPdf')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <InvoiceHeroSection
            invoice={invoice}
            currency={currency}
            paidAmount={paidAmount}
            remainingAmount={remainingAmount}
          />

          <InvoiceInfoCards invoice={invoice} />
          <InvoiceItemsTable invoice={invoice} currency={currency} />
          <PaymentsCard
            invoice={invoice}
            payments={payments}
            currency={currency}
          />
          <StatusHistoryCard statusHistory={invoice.statusHistory} />
          <InvoicePrintDocument
            invoice={invoice}
            company={company}
            invoiceRef={invoiceRef}
          />
        </div>
      </>
    );
  };

  return <PageLayout>{renderContent()}</PageLayout>;
};

export default InvoiceDetail;
