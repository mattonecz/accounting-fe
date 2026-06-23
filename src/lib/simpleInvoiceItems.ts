// Synthetic line items on a simplified tax document (zjednodušený daňový doklad)
// carry a stable, language-independent name token (e.g. "VAT_RATE_21") instead of
// a translated label. This keeps the stored document independent of the UI
// language and lets the edit form fold each item back into its fixed VAT-rate row
// by the token rather than by a matched display string.
//
// The human-readable label is derived from the token at display time:
//   - the locale-aware detail table translates via i18n (simpleInvoices…lineName)
//   - the Czech-only print/PDF documents use `rateItemLabelCs` below
//
// Pure string logic only (no React/DOM/i18n/Intl) so it stays portable to the
// backend alongside the PDF view-model.

const RATE_ITEM_RE = /^VAT_RATE_(\d+(?:\.\d+)?)$/;

/** Stable, non-translated item name for a simplified-document VAT-rate row. */
export const rateItemName = (rate: number): string => `VAT_RATE_${rate}`;

/** The VAT rate encoded in a rate-item name, or null when it isn't a token. */
export const parseRateItemName = (
  name: string | null | undefined,
): number | null => {
  const match = name ? RATE_ITEM_RE.exec(name) : null;
  return match ? Number(match[1]) : null;
};

/** Czech label for a rate token — for the Czech-only print/PDF documents. */
export const rateItemLabelCs = (rate: number): string => `Plnění ${rate}% DPH`;
