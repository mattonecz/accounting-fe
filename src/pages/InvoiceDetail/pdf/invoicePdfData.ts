// Pure, environment-agnostic view-model for the invoice PDF.
//
// No React, no DOM, no i18n — depends only on the API DTOs and Intl. This is the
// piece that ports verbatim to the NestJS backend; pair it with <InvoicePdfDocument>.
// The document is intentionally Czech-only (legal/tax wording), so formatting is
// hardcoded to cs-CZ rather than going through the app's i18n locale.
import type {
  CompanyResponseDto,
  ContactSnapshotDto,
  InvoiceResponseDto,
} from '@/api/model';

const toNumber = (value: unknown): number => {
  const n = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(n as number) ? Number(n) : 0;
};

const money = (amount: number | string | undefined, currency: string): string =>
  new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNumber(amount));

const date = (value?: string): string => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed);
};

export interface PdfParty {
  name: string;
  ico?: string;
  dic?: string;
  address: string[];
}

export interface PdfRecapRow {
  rate: number;
  base: string;
  vat: string;
}

export interface PdfItem {
  name: string;
  quantityLabel: string;
  vatRate: number;
  unitPrice: string;
  total: string;
}

export interface InvoicePdfModel {
  currency: string;
  hasVat: boolean;
  number: string;
  supplierTagline?: string;
  supplier: PdfParty;
  customer: PdfParty;
  bankNumber?: string;
  iban?: string;
  variableSymbol?: string;
  createdDate: string;
  dueDate: string;
  duzpDate: string;
  items: PdfItem[];
  recap: PdfRecapRow[];
  totalWithTax: string;
  fullyPaid: boolean;
  lastPaymentDate?: string;
  note?: string;
  spayd: string | null;
}

const companyToParty = (company?: CompanyResponseDto): PdfParty => {
  const houseLine = [company?.houseNumber, company?.orientationNumber]
    .filter(Boolean)
    .join('/');
  const line1 = [company?.street, houseLine].filter(Boolean).join(' ');
  const line2 = [company?.psc, company?.city].filter(Boolean).join(' ');
  const country =
    company?.country && company.country.toUpperCase() !== 'CZ' ? company.country : undefined;
  return {
    name: company?.companyName || company?.name || '—',
    ico: company?.ico,
    dic: company?.dic,
    address: [line1, line2, country].filter(Boolean) as string[],
  };
};

const contactToParty = (contact?: ContactSnapshotDto): PdfParty => {
  const line1 = contact?.street;
  const line2 = [contact?.psc, contact?.city].filter(Boolean).join(' ');
  const country =
    contact?.country && contact.country.toUpperCase() !== 'CZ' ? contact.country : undefined;
  return {
    name: contact?.name || '—',
    ico: contact?.ico,
    dic: contact?.dic,
    address: [line1, line2, country].filter(Boolean) as string[],
  };
};

// CZ "QR Platba" SPAYD payload — only built when we have an IBAN + amount to charge.
const buildSpayd = (invoice: InvoiceResponseDto): string | null => {
  const iban = invoice.bankSnapshot?.iban?.replace(/\s+/g, '').toUpperCase();
  const amount = toNumber(invoice.totalWithTax);
  if (!iban || amount <= 0) return null;

  const swift = invoice.bankSnapshot?.swift?.replace(/\s+/g, '').toUpperCase();
  const acc = swift ? `${iban}+${swift}` : iban;
  const vs = (invoice.variableSymbol || invoice.number || '').replace(/\D/g, '');
  const msg = `FAKTURA ${invoice.number ?? ''}`.trim().slice(0, 60);

  return [
    'SPD*1.0',
    `ACC:${acc}`,
    `AM:${amount.toFixed(2)}`,
    `CC:${invoice.currency || 'CZK'}`,
    vs && `X-VS:${vs}`,
    `MSG:${msg}`,
  ]
    .filter(Boolean)
    .join('*');
};

export const buildInvoicePdfModel = (
  invoice: InvoiceResponseDto,
  company?: CompanyResponseDto,
): InvoicePdfModel => {
  const currency = invoice.currency || 'CZK';
  const isReceived = invoice.type === 'RECEIVED';

  // The party that issued the document goes top-left; the recipient top-right.
  const supplier = isReceived ? contactToParty(invoice.contactSnapshot) : companyToParty(company);
  const customer = isReceived ? companyToParty(company) : contactToParty(invoice.contactSnapshot);

  const hasVat = toNumber(invoice.totalTax) > 0;

  // VAT recapitulation per rate (basis + tax), mirroring the on-screen detail table.
  const recapMap = new Map<number, { base: number; vat: number }>();
  invoice.items.forEach((item) => {
    const rate = toNumber(item.vatRate);
    const base = toNumber(item.quantity) * toNumber(item.unitPrice);
    const entry = recapMap.get(rate) ?? { base: 0, vat: 0 };
    entry.base += base;
    entry.vat += base * (rate / 100);
    recapMap.set(rate, entry);
  });
  const recap: PdfRecapRow[] = [...recapMap.entries()]
    .sort(([a], [b]) => b - a)
    .map(([rate, value]) => ({
      rate,
      base: money(value.base, currency),
      vat: money(value.vat, currency),
    }));

  const paidAmount = (invoice.payments ?? []).reduce((sum, p) => sum + toNumber(p.amount), 0);
  const fullyPaid = paidAmount > 0 && paidAmount + 0.01 >= toNumber(invoice.totalWithTax);
  const lastPaymentDate = (invoice.payments ?? [])
    .map((p) => p.paymentDate)
    .filter(Boolean)
    .sort()
    .at(-1);

  return {
    currency,
    hasVat,
    number: invoice.number || '',
    supplierTagline: !isReceived ? company?.description || undefined : undefined,
    supplier,
    customer,
    bankNumber: invoice.bankSnapshot?.number,
    iban: invoice.bankSnapshot?.iban || undefined,
    variableSymbol: invoice.variableSymbol || invoice.number || undefined,
    createdDate: date(invoice.createdDate),
    dueDate: date(invoice.dueDate),
    duzpDate: date(invoice.duzpDate),
    items: invoice.items.map((item) => {
      const quantity = toNumber(item.quantity);
      return {
        name: item.name,
        quantityLabel: `${quantity}${item.unit ? ` ${item.unit}` : ''}`,
        vatRate: toNumber(item.vatRate),
        unitPrice: money(item.unitPrice, currency),
        total: money(quantity * toNumber(item.unitPrice), currency),
      };
    }),
    recap,
    totalWithTax: money(invoice.totalWithTax, currency),
    fullyPaid,
    lastPaymentDate: lastPaymentDate ? date(lastPaymentDate) : undefined,
    note: invoice.note || undefined,
    spayd: buildSpayd(invoice),
  };
};
