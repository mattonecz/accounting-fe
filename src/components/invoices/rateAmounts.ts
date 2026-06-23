import type { InvoiceItemDto } from '@/api/model';
import { parseRateItemName, rateItemName } from '@/lib/simpleInvoiceItems';

// Amounts-by-VAT-rate logic shared across the received-invoice and simplified-
// document forms. One fixed row per current Czech VAT rate.
export const DEFAULT_RATES = [21, 12, 0];

export type RateField = 'base' | 'vat' | 'total';

export type RateRowValue = {
  vatRate: number;
  // base / VAT / total are all editable; empty strings mean no amount for this rate.
  base: string;
  vat: string;
  total: string;
};

export const round2 = (value: number) => Math.round(value * 100) / 100;

const numToStr = (value: number) => (value ? String(value) : '0');

export const toNumber = (value: unknown) => {
  const numericValue = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(numericValue as number) ? Number(numericValue) : 0;
};

export const getDefaultRateRows = (): RateRowValue[] =>
  DEFAULT_RATES.map((vatRate) => ({ vatRate, base: '', vat: '', total: '' }));

// The VAT rate links base/VAT/total: editing any one re-derives the other two.
// Returns the three columns as strings; the edited column keeps the raw input.
export const recomputeRow = (
  rate: number,
  field: RateField,
  raw: string,
): { base: string; vat: string; total: string } => {
  if (raw.trim() === '' || Number.isNaN(Number(raw))) {
    return { base: '', vat: '', total: '' };
  }
  const num = round2(Number(raw));
  let base: number;
  let vat: number;
  let total: number;
  if (field === 'base') {
    base = num;
    vat = round2((base * rate) / 100);
    total = round2(base + vat);
  } else if (field === 'vat') {
    vat = num;
    base = rate > 0 ? round2((vat * 100) / rate) : 0;
    total = round2(base + vat);
  } else {
    total = num;
    base = round2((total * 100) / (100 + rate));
    vat = round2(total - base);
  }
  const next = {
    base: numToStr(base),
    vat: numToStr(vat),
    total: numToStr(total),
  };
  // Preserve exactly what the user is typing in the edited column.
  next[field] = raw;
  return next;
};

export const sumRates = (rows: RateRowValue[]) =>
  rows.reduce(
    (acc, row) => ({
      base: round2(acc.base + (Number(row.base) || 0)),
      vat: round2(acc.vat + (Number(row.vat) || 0)),
      total: round2(acc.total + (Number(row.total) || 0)),
    }),
    { base: 0, vat: 0, total: 0 },
  );

// Rate rows → invoice line items. Each item carries a stable rate token in its
// name (VAT_RATE_<rate>) so the document is language-independent and the edit
// form can fold it back by token. VAT payers split each line into base + rate;
// non-VAT payers record the gross as the amount (no VAT mode, no deduction).
export const ratesToInvoiceItems = (
  rows: RateRowValue[],
  isVatPayer: boolean,
): InvoiceItemDto[] =>
  rows
    .map((row) => ({
      rate: row.vatRate,
      base: round2(Number(row.base) || 0),
      vat: round2(Number(row.vat) || 0),
      total: round2(Number(row.total) || 0),
    }))
    .filter((line) => line.total > 0)
    .map((line) => ({
      name: rateItemName(line.rate),
      quantity: 1,
      unitPrice: isVatPayer ? line.base : line.total,
      total: isVatPayer ? line.base : line.total,
      vatRate: isVatPayer ? line.rate : undefined,
    }));

// Invoice line items → rate rows, for prefilling the edit form. The rate is
// recovered from the item's name token first, falling back to its vatRate for
// documents created before the token. Each item's base (quantity × unit price)
// is folded into the matching fixed rate row; for a non-VAT payer everything is
// gross and lives in the first row's total.
export const invoiceItemsToRates = (
  items: InvoiceItemDto[] | undefined,
  isVatPayer: boolean,
): RateRowValue[] => {
  const rows = getDefaultRateRows();
  if (!items?.length) return rows;

  if (!isVatPayer) {
    const gross = round2(
      items.reduce(
        (sum, item) => sum + toNumber(item.quantity) * toNumber(item.unitPrice),
        0,
      ),
    );
    rows[0] = { ...rows[0], total: gross ? String(gross) : '' };
    return rows;
  }

  for (const item of items) {
    const rate = parseRateItemName(item.name) ?? toNumber(item.vatRate);
    const index = rows.findIndex((row) => row.vatRate === rate);
    if (index === -1) continue; // non-standard rate — no fixed row for it
    const base = round2(
      (Number(rows[index].base) || 0) +
        toNumber(item.quantity) * toNumber(item.unitPrice),
    );
    if (base <= 0) continue;
    rows[index] = {
      vatRate: rate,
      ...recomputeRow(rate, 'base', String(base)),
    };
  }
  return rows;
};
