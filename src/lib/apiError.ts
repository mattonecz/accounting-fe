import type { TFunction } from 'i18next';

type ApiErrorLike = {
  response?: {
    status?: number;
    data?: { message?: string | string[] } | unknown;
  };
};

export const getApiErrorStatus = (error: unknown): number | undefined =>
  (error as ApiErrorLike)?.response?.status;

/** Raw `message` field of a Nest error response, if the server sent one. */
export const getApiErrorText = (error: unknown): string | undefined => {
  const data = (error as ApiErrorLike)?.response?.data as
    | { message?: string | string[] }
    | undefined;
  const message = data?.message;
  if (Array.isArray(message)) return message.join(' ');
  return typeof message === 'string' ? message : undefined;
};

/**
 * The backend has no stable error codes yet, so known business rules are
 * matched on the English message it returns and mapped to a translation.
 * Anything unrecognised falls back to the caller's generic message.
 */
const KNOWN_MESSAGES: [RegExp, string][] = [
  [/locked by an? (active|submitted) tax filing/i, 'errors.invoiceLocked'],
  [/same number already exists/i, 'errors.invoiceNumberTaken'],
  [/number cannot be cleared/i, 'errors.invoiceNumberRequired'],
  [/Submitted filings cannot be cancelled/i, 'errors.filingSubmitted'],
  [/Filing is already cancelled/i, 'errors.filingAlreadyCancelled'],
  [/Cannot submit filing in status/i, 'errors.filingNotReady'],
  [/linked to a contact/i, 'errors.invoiceContactLinked'],
  [
    /contact\.name is required|contact \(with a name\) is required/i,
    'errors.supplierRequired',
  ],
  [/Selected contact was not found/i, 'errors.contactNotFound'],
  [/Selected bank account was not found/i, 'errors.bankNotFound'],
  [/(Invoice|Contact|Payment|Tax filing) not found/i, 'errors.notFound'],
];

export const getApiErrorMessage = (
  error: unknown,
  t: TFunction,
  fallbackKey: string,
): string => {
  const raw = getApiErrorText(error);
  if (raw) {
    const known = KNOWN_MESSAGES.find(([pattern]) => pattern.test(raw));
    if (known) return t(known[1]);
  }
  return t(fallbackKey);
};
