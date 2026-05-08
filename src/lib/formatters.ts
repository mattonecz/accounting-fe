import i18n from '@/i18n';

export const formatDate = (date: string | Date | null | undefined, lang?: string): string => {
  if (!date) return '-';
  const locale = lang ?? i18n.language ?? 'cs';
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(typeof date === 'string' ? new Date(date) : date);
};

export const formatMoney = (
  amount: number,
  currency: string,
  lang?: string,
): string => {
  const locale = lang ?? i18n.language ?? 'cs';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const getActiveLanguage = (): string => i18n.language ?? 'cs';
