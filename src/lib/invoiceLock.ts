import type { InvoiceResponseDto } from '@/api/model';

/**
 * Invoices in an active VAT filing (being generated, ready or submitted) are
 * frozen: the backend rejects both update and delete for them, whatever their
 * type — issued, received or simplified. The flag is derived on the server from
 * the filing's current status (`isLocked`), so it also clears when a filing is
 * cancelled.
 */
export const isInvoiceLocked = (
  invoice: Pick<InvoiceResponseDto, 'isLocked'> | undefined | null,
): boolean => invoice?.isLocked === true;
