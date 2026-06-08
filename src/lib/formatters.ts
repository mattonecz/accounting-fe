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

export const formatDateTime = (
  date: string | Date | null | undefined,
  lang?: string,
): string => {
  if (!date) return '-';
  const locale = lang ?? i18n.language ?? 'cs';
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

/**
 * Adds `days` to a `YYYY-MM-DD` date string and returns a `YYYY-MM-DD` string.
 * Uses UTC arithmetic to avoid timezone-related off-by-one shifts.
 */
export const addDays = (date: string, days: number): string => {
  if (!date) return '';
  const [y, m, d] = date.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().split('T')[0];
};

/**
 * Number of whole days between two `YYYY-MM-DD` date strings (`to - from`).
 * Returns 0 if either date is missing.
 */
export const daysBetween = (from: string, to: string): number => {
  if (!from || !to) return 0;
  const [fy, fm, fd] = from.slice(0, 10).split('-').map(Number);
  const [ty, tm, td] = to.slice(0, 10).split('-').map(Number);
  return Math.round(
    (Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000,
  );
};
