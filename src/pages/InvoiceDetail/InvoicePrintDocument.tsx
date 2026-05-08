import type { RefObject } from 'react';
import type { InvoiceResponseDto } from '@/api/model';
import { formatDate, formatMoney, formatCompanyAddress } from './utils';
import { toNumber } from '@/pages/UpdateInvoice/useUpdateInvoiceForm';

interface InvoicePrintDocumentProps {
  invoice: InvoiceResponseDto;
  invoiceRef: RefObject<HTMLDivElement | null>;
}

export const InvoicePrintDocument = ({
  invoice,
  invoiceRef,
}: InvoicePrintDocumentProps) => {
  const currency = invoice.currency || 'CZK';

  return (
    <div
      id="invoice-print-root"
      ref={invoiceRef}
      className="fixed left-[-99999px] top-0 w-[210mm] bg-background print:static print:left-0 print:w-full"
    >
      <div className="invoice-sheet min-h-[297mm] bg-background print:w-full print:shadow-none">
        <div className="px-[14mm] py-[12mm] text-[12px] leading-relaxed text-foreground">
          <header className="mb-6 border-b pb-4">
            <div className="flex items-start justify-between gap-8">
              <div>
                <h1 className="text-2xl font-bold uppercase tracking-wide">
                  Faktura - daňový doklad
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Číslo dokladu: {invoice.number}
                </p>
              </div>
              <div className="text-right text-sm">
                <p>
                  <span className="text-muted-foreground">
                    Datum vystavení:
                  </span>{' '}
                  {formatDate(invoice.createdDate)}
                </p>
                <p>
                  <span className="text-muted-foreground">DUZP:</span>{' '}
                  {formatDate(invoice.duzpDate)}
                </p>
                <p>
                  <span className="text-muted-foreground">
                    Datum splatnosti:
                  </span>{' '}
                  {formatDate(invoice.dueDate)}
                </p>
                <p>
                  <span className="text-muted-foreground">
                    Variabilní symbol:
                  </span>{' '}
                  {invoice.number}
                </p>
              </div>
            </div>
          </header>

          <section className="mb-6 rounded border p-4">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Odběratel
            </h2>
            <p className="font-semibold">{invoice.contactSnapshot?.name || '-'}</p>
            {formatCompanyAddress(invoice.contactSnapshot).map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p className="mt-2">IČO: {invoice.contactSnapshot?.ico || '-'}</p>
            <p>DIČ: {invoice.contactSnapshot?.dic || '-'}</p>
          </section>

          <section className="mb-6 overflow-hidden rounded border">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/40">
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">
                    Položka
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide">
                    Množství
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide">
                    Cena bez DPH
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide">
                    DPH
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide">
                    Cena s DPH
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => {
                  const quantity = toNumber(item.quantity);
                  const base = quantity * toNumber(item.unitPrice);
                  const tax = base * (toNumber(item.vatRate) / 100);
                  const total = base + tax;

                  return (
                    <tr key={`${item.name}-${index}`} className="border-t">
                      <td className="px-3 py-2">{item.name}</td>
                      <td className="px-3 py-2 text-right">{quantity}</td>
                      <td className="px-3 py-2 text-right">
                        {formatMoney(base, currency)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {toNumber(item.vatRate)}% ({formatMoney(tax, currency)})
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatMoney(total, currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <section className="mb-6 grid grid-cols-2 gap-8">
            <div className="rounded border p-4">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Platební údaje
              </h2>
              <p>
                <span className="text-muted-foreground">Banka:</span>{' '}
                {invoice.bankAccount?.name || '-'}
              </p>
              <p>
                <span className="text-muted-foreground">Číslo účtu:</span>{' '}
                {invoice.bankAccount?.number || '-'}
              </p>
              <p>
                <span className="text-muted-foreground">IBAN:</span>{' '}
                {invoice.bankAccount?.iban || '-'}
              </p>
              <p>
                <span className="text-muted-foreground">SWIFT:</span>{' '}
                {invoice.bankAccount?.swift || '-'}
              </p>
            </div>

            <div className="rounded border p-4">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Rekapitulace DPH
              </h2>
              <div className="space-y-1 text-sm">
                <div className="border-t pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Základ:</span>
                    <span>{formatMoney(invoice.total, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">DPH:</span>
                    <span>{formatMoney(invoice.totalTax, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between text-base font-semibold">
                    <span>Celkem:</span>
                    <span>{formatMoney(invoice.totalWithTax, currency)}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
