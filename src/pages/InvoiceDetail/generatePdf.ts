// Browser entry point for downloading the invoice PDF.
//
// This is the only FE-specific glue: it generates the QR image, renders the (portable)
// <InvoicePdfDocument> to a Blob and triggers a download. On the NestJS backend the same
// model + document are reused via renderToBuffer()/renderToStream() and streamed in the
// HTTP response instead — see ./pdf/invoicePdfData.ts and ./pdf/InvoicePdfDocument.tsx.
//
// @react-pdf/renderer (+ yoga-layout, fontkit) is a heavy ~2 MB chunk, so it and the
// document are loaded lazily — only when the user actually downloads a PDF.
import { createElement } from 'react';
import QRCode from 'qrcode';
import type { CompanyResponseDto, InvoiceResponseDto } from '@/api/model';
import { buildInvoicePdfModel } from './pdf/invoicePdfData';

export const generateInvoicePdf = async (
  invoice: InvoiceResponseDto,
  company: CompanyResponseDto | undefined,
  fileName: string,
) => {
  const model = buildInvoicePdfModel(invoice, company);

  let qrDataUrl: string | null = null;
  if (model.spayd) {
    try {
      qrDataUrl = await QRCode.toDataURL(model.spayd, {
        margin: 0,
        width: 256,
        errorCorrectionLevel: 'M',
      });
    } catch {
      qrDataUrl = null;
    }
  }

  const [{ pdf }, { registerPdfFonts }, { InvoicePdfDocument }] =
    await Promise.all([
      import('@react-pdf/renderer'),
      import('./pdf/fonts'),
      import('./pdf/InvoicePdfDocument'),
    ]);

  registerPdfFonts();

  // createElement (not JSX) keeps this a .ts util; cast bridges react-pdf's
  // pdf() expecting a <Document> element vs. our wrapper component's prop type.
  const element = createElement(InvoicePdfDocument, {
    model,
    qrDataUrl,
  }) as unknown as Parameters<typeof pdf>[0];
  const blob = await pdf(element).toBlob();

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
