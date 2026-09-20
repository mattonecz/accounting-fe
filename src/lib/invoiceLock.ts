import type { InvoiceResponseDto } from '@/api/model';

/**
 * Invoices pulled into a submitted VAT filing are frozen: the backend rejects
 * both update and delete for them (`invoices.service.ts` — "Invoice is locked
 * by a submitted tax filing."). Mirrored here so the UI can hide or disable
 * those actions instead of letting the request fail.
 */
export const isInvoiceLocked = (
  invoice: Pick<InvoiceResponseDto, 'vatClaimStatus'> | undefined | null,
): boolean => invoice?.vatClaimStatus === 'CLAIMED';
