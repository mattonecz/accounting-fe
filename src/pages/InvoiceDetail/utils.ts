import type { InvoiceResponseDto } from '@/api/model';

export const formatDate = (date?: string) => {
  if (!date) return '-';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat('cs-CZ').format(parsed);
};

export const formatMoney = (
  amount: number | string | undefined,
  currency: string,
) => {
  const numericValue = typeof amount === 'string' ? Number(amount) : amount;
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numericValue ?? NaN) ? (numericValue ?? 0) : 0);
};

export const formatCompanyAddress = (company?: {
  street?: string;
  city?: string;
  psc?: string;
  country?: string;
}) => {
  const firstLine = [company?.street].filter(Boolean).join(', ');
  const secondLine = [company?.psc, company?.city, company?.country || '']
    .filter(Boolean)
    .join(' ');
  return [firstLine, secondLine].filter(Boolean);
};

export const getPaymentMethodLabel = (paymentMethod?: string) => {
  switch (paymentMethod) {
    case 'BANK_TRANSFER':
      return 'Bankovní převod';
    case 'CASH':
      return 'Hotovost';
    case 'CARD':
      return 'Kartou';
    case 'OTHER':
      return 'Jiná metoda';
    default:
      return paymentMethod || '-';
  }
};

export const getPaidAmount = (invoice?: InvoiceResponseDto) =>
  (invoice?.payments ?? []).reduce(
    (sum, payment) => sum + Number(payment.amount ?? 0),
    0,
  );

export const getStatusHistoryLabel = (status?: string) => {
  switch (status) {
    case 'DRAFT':
      return 'Koncept';
    case 'ISSUED':
      return 'Vystavena';
    case 'OVERDUE':
      return 'Po splatnosti';
    case 'PAID':
      return 'Uhrazena';
    case 'CANCELLED':
      return 'Zrušena';
    case 'UPDATED':
      return 'Upravena';
    default:
      return status || '-';
  }
};

export const formatHistoryValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};
