import type {
  CreateContactDto,
  InvoiceParseDataDto,
  ParsedPartyDto,
  ReceiptLlmCallDto,
} from '@/api/model';

/**
 * Router state handed from the upload button to the create form. The parse
 * result is not persisted anywhere — a reload drops it, which is fine for a
 * form the user fills in right away.
 */
export interface ParsedInvoiceState {
  parsedInvoice: InvoiceParseDataDto;
  llmCalls: ReceiptLlmCallDto[];
}

export const readParsedInvoiceState = (
  state: unknown,
): ParsedInvoiceState | undefined => {
  const candidate = state as Partial<ParsedInvoiceState> | null;
  return candidate?.parsedInvoice
    ? {
        parsedInvoice: candidate.parsedInvoice,
        llmCalls: candidate.llmCalls ?? [],
      }
    : undefined;
};

/**
 * The counterparty as a contact to create — the form's contact field then
 * swaps it for an existing contact with the same IČO. Null when the document
 * named nobody.
 */
export const partyToPendingContact = (
  party: ParsedPartyDto,
): CreateContactDto | null => {
  if (!party.name && !party.ico) return null;
  return {
    name: party.name ?? '',
    country: party.country ?? 'CZ',
    ico: party.ico ?? undefined,
    dic: party.dic ?? undefined,
    street: party.street ?? undefined,
    city: party.city ?? undefined,
    psc: party.psc ?? undefined,
  };
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const parsedDate = (value: string | null | undefined) =>
  value && ISO_DATE_RE.test(value) ? value : undefined;

/** Currencies the invoice forms offer; anything else falls back to CZK. */
export const parsedCurrency = (value: string | null | undefined) =>
  value && ['CZK', 'EUR', 'USD'].includes(value) ? value : undefined;
