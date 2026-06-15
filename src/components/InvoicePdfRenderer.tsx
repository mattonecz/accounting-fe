import { useEffect, useRef } from 'react';
import { useInvoiceGet } from '@/api/invoices/invoices';
import { useCompanyGet } from '@/api/companies/companies';
import { generateInvoicePdf } from '@/pages/InvoiceDetail/generatePdf';

interface InvoicePdfRendererProps {
  invoiceId: string;
  onDone: () => void;
}

// Headless one-shot PDF download (e.g. from a list row): fetches the invoice +
// supplier company, then builds the PDF straight from the data. No hidden DOM or
// timing hacks — @react-pdf/renderer generates the QR image and vector PDF itself.
export const InvoicePdfRenderer = ({
  invoiceId,
  onDone,
}: InvoicePdfRendererProps) => {
  const triggered = useRef(false);
  const { data, isError } = useInvoiceGet(invoiceId);
  const invoice = data?.data;
  const { data: companyResponse } = useCompanyGet(invoice?.companyId ?? '', {
    query: { enabled: !!invoice?.companyId },
  });
  const company = companyResponse?.data;
  // Hold off until the supplier company has resolved.
  const companyReady = !invoice?.companyId || !!company;

  // The endpoint returns 404 when the invoice is missing; unblock the caller
  // so the renderer gets unmounted instead of waiting forever.
  useEffect(() => {
    if (isError) onDone();
  }, [isError, onDone]);

  useEffect(() => {
    if (!invoice || !companyReady || triggered.current) return;
    triggered.current = true;

    void (async () => {
      try {
        await generateInvoicePdf(invoice, company, `faktura-${invoice.number}.pdf`);
      } finally {
        onDone();
      }
    })();
  }, [invoice, company, companyReady, onDone]);

  return null;
};
