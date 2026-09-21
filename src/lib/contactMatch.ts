import type { ContactResponseDto } from '@/api/model';

/**
 * Same canonical form the backend stores (contacts.service.ts `normalizeIco`):
 * IČO is unique per company, so matching has to ignore spacing.
 */
export const normalizeIco = (ico: string | null | undefined): string =>
  (ico ?? '').replace(/\s+/g, '');

/** The existing contact with this IČO, if any — a new one would be a duplicate. */
export const findContactByIco = (
  contacts: ContactResponseDto[],
  ico: string | null | undefined,
): ContactResponseDto | undefined => {
  const needle = normalizeIco(ico);
  if (!needle) return undefined;
  return contacts.find((contact) => normalizeIco(contact.ico) === needle);
};
