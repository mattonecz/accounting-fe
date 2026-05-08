import i18n from '@/i18n';
import type { InvoiceResponseDto } from '@/api/model';
import { formatDate as libFormatDate, formatMoney as libFormatMoney } from '@/lib/formatters';

export const formatDate = (date?: string) => {
  if (!date) return '-';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return libFormatDate(parsed);
};

export const formatMoney = (
  amount: number | string | undefined,
  currency: string,
) => {
  const numericValue = typeof amount === 'string' ? Number(amount) : amount;
  return libFormatMoney(
    Number.isFinite(numericValue ?? NaN) ? (numericValue ?? 0) : 0,
    currency,
  );
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

export const getPaymentMethodLabel = (paymentMethod?: string) =>
  i18n.t(`invoices.paymentMethods.${paymentMethod}`, paymentMethod || '-');

export const getPaidAmount = (invoice?: InvoiceResponseDto) =>
  (invoice?.payments ?? []).reduce(
    (sum, payment) => sum + Number(payment.amount ?? 0),
    0,
  );

export const getStatusHistoryLabel = (status?: string) =>
  i18n.t(`invoices.statuses.${status}`, status || '-');

export const formatHistoryValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};
