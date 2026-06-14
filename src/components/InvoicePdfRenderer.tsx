import { useEffect, useRef } from 'react';
import { useInvoiceGet } from '@/api/invoices/invoices';
import { useCompanyGet } from '@/api/companies/companies';
import { InvoicePrintDocument } from '@/pages/InvoiceDetail/InvoicePrintDocument';
import { generateInvoicePdf } from '@/pages/InvoiceDetail/generatePdf';

interface InvoicePdfRendererProps {
  invoiceId: string;
  onDone: () => void;
}

export const InvoicePdfRenderer = ({
  invoiceId,
  onDone,
}: InvoicePdfRendererProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const triggered = useRef(false);
  const { data, isError } = useInvoiceGet(invoiceId);
  const invoice = data?.data;
  const { data: companyResponse } = useCompanyGet(invoice?.companyId ?? '', {
    query: { enabled: !!invoice?.companyId },
  });
  const company = companyResponse?.data;
  // Hold off rendering the PDF until the supplier company has resolved.
  const companyReady = !invoice?.companyId || !!company;

  // The endpoint returns 404 when the invoice is missing; unblock the caller
  // so the renderer gets unmounted instead of waiting forever.
  useEffect(() => {
    if (isError) onDone();
  }, [isError, onDone]);

  useEffect(() => {
    if (!invoice || !companyReady || triggered.current) return;
    triggered.current = true;

    // Small delay so the async-generated QR Platba image is rendered before capture.
    const id = setTimeout(async () => {
      try {
        if (ref.current) {
          await generateInvoicePdf(ref.current, `faktura-${invoice.number}.pdf`);
        }
      } finally {
        onDone();
      }
    }, 250);

    return () => clearTimeout(id);
  }, [invoice, companyReady, onDone]);

  if (!invoice) return null;
  return <InvoicePrintDocument invoice={invoice} company={company} invoiceRef={ref} />;
};
