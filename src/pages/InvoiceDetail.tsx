import { useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInvoiceGet } from '@/api/invoices/invoices';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const formatDate = (date?: string) => {
  if (!date) {
    return '-';
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat('cs-CZ').format(parsed);
};

const formatMoney = (amount: number | undefined, currency: string) => {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount ?? 0);
};

const formatCompanyAddress = (company?: {
  street?: string;
  city?: string;
  psc?: string;
  country?: string;
}) => {
  const firstLine = [company?.street].filter(Boolean).join(', ');
  const secondLine = [company?.psc, company?.city].filter(Boolean).join(' ');
  const thirdLine = company?.country || '';

  return [firstLine, secondLine, thirdLine].filter(Boolean);
};

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useInvoiceGet(id || '');
  const invoiceRef = useRef<HTMLDivElement | null>(null);

  const invoice = data?.data;
  const currency = invoice?.currency || 'CZK';

  const vatSummary = useMemo(() => {
    if (!invoice) {
      return [] as Array<{ vatRate: number; base: number; tax: number; total: number }>;
    }

    const grouped = new Map<number, { base: number; tax: number; total: number }>();

    invoice.items.forEach((item) => {
      const qty = item.amount || 0;
      const base = qty * (item.pricePerUnit || 0);
      const tax = base * ((item.vat || 0) / 100);
      const total = base + tax;

      const existing = grouped.get(item.vat || 0) || { base: 0, tax: 0, total: 0 };
      grouped.set(item.vat || 0, {
        base: existing.base + base,
        tax: existing.tax + tax,
        total: existing.total + total,
      });
    });

    return Array.from(grouped.entries())
      .map(([vatRate, values]) => ({ vatRate, ...values }))
      .sort((a, b) => a.vatRate - b.vatRate);
  }, [invoice]);

  if (!id) {
    return (
      <div className="flex-1 p-8">
        <p className="text-muted-foreground">Neplatné ID faktury.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-8">
        <p className="text-muted-foreground">Načítám fakturu...</p>
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="flex-1 p-8">
        <p className="text-destructive">Fakturu se nepodařilo načíst.</p>
      </div>
    );
  }

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current) {
      return;
    }

    const canvas = await html2canvas(invoiceRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
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

    pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight, '', 'FAST');
    heightLeft -= contentHeight;

    while (heightLeft > 0) {
      position = margin - (imgHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight, '', 'FAST');
      heightLeft -= contentHeight;
    }

    pdf.save(`faktura-${invoice.number}.pdf`);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <style>
        {`@media print {
          @page { size: A4; margin: 12mm; }
          body { background: white !important; }
          body * { visibility: hidden !important; }
          #invoice-print-root, #invoice-print-root * { visibility: visible !important; }
          #invoice-print-root { position: absolute; left: 0; top: 0; width: 100%; }
          .invoice-sheet { box-shadow: none !important; width: auto !important; min-height: auto !important; }
        }`}
      </style>

      <div className="print:hidden bg-background border-b sticky top-0 z-10">
        <div className="mx-auto max-w-[1200px] px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zpět
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Tisk
            </Button>
            <Button variant="default" size="sm" onClick={handleDownloadPdf}>
              <Download className="h-4 w-4 mr-2" />
              Stáhnout PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-center py-8 print:p-0">
        <div
          id="invoice-print-root"
          ref={invoiceRef}
          className="invoice-sheet w-[210mm] min-h-[297mm] bg-background shadow-xl print:w-full print:shadow-none"
        >
          <div className="px-[14mm] py-[12mm] text-[12px] leading-relaxed text-foreground">
            <header className="mb-6 border-b pb-4">
              <div className="flex items-start justify-between gap-8">
                <div>
                  <h1 className="text-2xl font-bold uppercase tracking-wide">Faktura - daňový doklad</h1>
                  <p className="mt-2 text-sm text-muted-foreground">Číslo dokladu: {invoice.number}</p>
                </div>
                <div className="text-right text-sm">
                  <p><span className="text-muted-foreground">Datum vystavení:</span> {formatDate(invoice.createdDate)}</p>
                  <p><span className="text-muted-foreground">DUZP:</span> {formatDate(invoice.taxDate)}</p>
                  <p><span className="text-muted-foreground">Datum splatnosti:</span> {formatDate(invoice.dueDate)}</p>
                  <p><span className="text-muted-foreground">Variabilní symbol:</span> {invoice.number}</p>
                </div>
              </div>
            </header>

            <section className="mb-6 grid grid-cols-2 gap-8">
              <div className="rounded border p-4">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dodavatel</h2>
                <p className="font-semibold">{invoice.supplier?.name || '-'}</p>
                {formatCompanyAddress(invoice.supplier).map((line) => (
                  <p key={line}>{line}</p>
                ))}
                <p className="mt-2">IČO: {invoice.supplier?.ico || '-'}</p>
                <p>DIČ: {invoice.supplier?.dic || '-'}</p>
              </div>
              <div className="rounded border p-4">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Odběratel</h2>
                <p className="font-semibold">{invoice.company?.name || '-'}</p>
                {formatCompanyAddress(invoice.company).map((line) => (
                  <p key={line}>{line}</p>
                ))}
                <p className="mt-2">IČO: {invoice.company?.ico || '-'}</p>
                <p>DIČ: {invoice.company?.dic || '-'}</p>
              </div>
            </section>

            <section className="mb-6 overflow-hidden rounded border">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">Položka</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide">Množství</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide">Cena bez DPH</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide">DPH</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide">Cena s DPH</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => {
                    const quantity = item.amount || 0;
                    const base = quantity * (item.pricePerUnit || 0);
                    const tax = base * ((item.vat || 0) / 100);
                    const total = base + tax;

                    return (
                      <tr key={`${item.name}-${index}`} className="border-t">
                        <td className="px-3 py-2">{item.name}</td>
                        <td className="px-3 py-2 text-right">{quantity}</td>
                        <td className="px-3 py-2 text-right">{formatMoney(base, currency)}</td>
                        <td className="px-3 py-2 text-right">{item.vat}% ({formatMoney(tax, currency)})</td>
                        <td className="px-3 py-2 text-right font-medium">{formatMoney(total, currency)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>

            <section className="mb-6 grid grid-cols-2 gap-8">
              <div className="rounded border p-4">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Platební údaje</h2>
                <p><span className="text-muted-foreground">Forma úhrady:</span> Bankovní převod</p>
                <p><span className="text-muted-foreground">Banka:</span> {invoice.bankAccount?.name || '-'}</p>
                <p><span className="text-muted-foreground">Číslo účtu:</span> {invoice.bankAccount?.number || '-'}</p>
                <p><span className="text-muted-foreground">IBAN:</span> {invoice.bankAccount?.iban || '-'}</p>
                <p><span className="text-muted-foreground">SWIFT:</span> {invoice.bankAccount?.swift || '-'}</p>
              </div>

              <div className="rounded border p-4">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rekapitulace DPH</h2>
                <div className="space-y-1 text-sm">
                  {vatSummary.map((line) => (
                    <div key={line.vatRate} className="flex items-center justify-between">
                      <span>Sazba {line.vatRate}%</span>
                      <span>{formatMoney(line.base, currency)} / {formatMoney(line.tax, currency)}</span>
                    </div>
                  ))}
                  <div className="mt-2 border-t pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Základ:</span>
                      <span>{formatMoney(invoice.total, currency)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">DPH:</span>
                      <span>{formatMoney(invoice.totalTax, currency)}</span>
                    </div>
                    <div className="flex items-center justify-between text-base font-semibold">
                      <span>Celkem k úhradě:</span>
                      <span>{formatMoney(invoice.totalWithTax, currency)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <footer className="border-t pt-4 text-xs text-muted-foreground">
              <p>Doklad byl vystaven elektronicky.</p>
              <p>Tento doklad obsahuje všechny dostupné údaje z evidovaného záznamu faktury.</p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;
