import { useEffect, useRef } from 'react';
import { useInvoiceGet } from '@/api/invoices/invoices';
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
  const { data } = useInvoiceGet(invoiceId);
  const invoice = data?.data;

  useEffect(() => {
    if (!invoice || triggered.current) return;
    triggered.current = true;

    const id = requestAnimationFrame(async () => {
      try {
        if (ref.current) {
          await generateInvoicePdf(ref.current, `faktura-${invoice.number}.pdf`);
        }
      } finally {
        onDone();
      }
    });

    return () => cancelAnimationFrame(id);
  }, [invoice, onDone]);

  if (!invoice) return null;
  return <InvoicePrintDocument invoice={invoice} invoiceRef={ref} />;
};
