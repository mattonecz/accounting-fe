import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { labelClass } from '@/components/invoices/formFields';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  PRIMARY_RATES,
  type RateField,
  type RateRowValue,
} from './rateAmounts';

const colHeadClass =
  'text-[9px] font-semibold uppercase tracking-wider text-muted-foreground';

const gridClass =
  'grid grid-cols-[64px_1fr_1fr_1fr] items-center gap-3 sm:grid-cols-[80px_1fr_1fr_1fr]';

const hasAmount = (row: RateRowValue) =>
  Number(row.base) > 0 || Number(row.vat) > 0 || Number(row.total) > 0;

export interface RateAmountsTableProps {
  rates: RateRowValue[];
  isVatPayer: boolean;
  onCellChange: (index: number, field: RateField, rawValue: string) => void;
  /** Non-VAT-payer single-total fallback; required when !isVatPayer. */
  onTotalOnlyChange?: (rawValue: string) => void;
}

// Shared amounts-by-VAT-rate table for received invoices and simplified
// documents. Fixed rows per Czech VAT rate; base / VAT / total are all editable
// and kept in sync by the page (recomputeRow). Rates outside PRIMARY_RATES sit
// behind a toggle and open on their own when they carry an amount (a parsed
// receipt, an existing document). Non-VAT payers enter a single gross total
// instead. Purely presentational — the page owns the form state and the totals
// footer.
export const RateAmountsTable = ({
  rates,
  isVatPayer,
  onCellChange,
  onTotalOnlyChange,
}: RateAmountsTableProps) => {
  const { t } = useTranslation();
  const [extraOpen, setExtraOpen] = useState(false);

  if (!isVatPayer) {
    return (
      <div className="space-y-1.5">
        <p className={labelClass}>
          {t('invoices.create.received.totalAmount')}
        </p>
        <Input
          type="number"
          inputMode="decimal"
          step="any"
          min={0}
          placeholder="0"
          value={rates[0]?.total ?? ''}
          onChange={(e) => onTotalOnlyChange?.(e.target.value)}
          className="text-right tabular-nums"
        />
      </div>
    );
  }

  // Keep each row's index in the form state — that is what onCellChange takes.
  const rows = rates.map((row, index) => ({ row, index }));
  const primary = rows.filter(({ row }) => PRIMARY_RATES.includes(row.vatRate));
  const extra = rows.filter(({ row }) => !PRIMARY_RATES.includes(row.vatRate));
  const extraFilled = extra.some(({ row }) => hasAmount(row));
  const showExtra = extraOpen || extraFilled;

  const renderRow = ({ row, index }: { row: RateRowValue; index: number }) => {
    const isEmpty = !(Number(row.total) > 0);
    const cellClass = (value: string) =>
      cn('h-8 text-right text-sm tabular-nums', !value && 'border-dashed');
    return (
      <div
        key={row.vatRate}
        className={cn(gridClass, 'border-b px-3.5 py-2.5 last:border-b-0')}
      >
        <span
          className={cn(
            'text-sm font-semibold tabular-nums',
            isEmpty && 'text-muted-foreground/70',
          )}
        >
          {row.vatRate} %
        </span>
        <Input
          type="number"
          inputMode="decimal"
          step="any"
          min={0}
          placeholder="0"
          value={row.base}
          onChange={(e) => onCellChange(index, 'base', e.target.value)}
          className={cellClass(row.base)}
        />
        <Input
          type="number"
          inputMode="decimal"
          step="any"
          min={0}
          placeholder="0"
          value={row.vat}
          onChange={(e) => onCellChange(index, 'vat', e.target.value)}
          disabled={row.vatRate === 0}
          className={cellClass(row.vat)}
        />
        <Input
          type="number"
          inputMode="decimal"
          step="any"
          min={0}
          placeholder="0"
          value={row.total}
          onChange={(e) => onCellChange(index, 'total', e.target.value)}
          className={cellClass(row.total)}
        />
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className={cn(gridClass, 'border-b bg-muted/50 px-3.5 py-2')}>
        <span className={colHeadClass}>
          {t('simpleInvoices.create.rates.rate')}
        </span>
        <span className={cn(colHeadClass, 'text-right')}>
          {t('simpleInvoices.create.rates.base')}
        </span>
        <span className={cn(colHeadClass, 'text-right')}>
          {t('simpleInvoices.create.rates.vat')}
        </span>
        <span className={cn(colHeadClass, 'text-right')}>
          {t('simpleInvoices.create.rates.totalWithVat')}
        </span>
      </div>

      {primary.map(renderRow)}
      {showExtra && extra.map(renderRow)}

      {extra.length > 0 && !extraFilled && (
        <button
          type="button"
          onClick={() => setExtraOpen((open) => !open)}
          className="flex w-full items-center gap-1.5 border-t px-3.5 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 transition-transform',
              extraOpen && 'rotate-180',
            )}
          />
          {extraOpen
            ? t('simpleInvoices.create.rates.hideMore')
            : t('simpleInvoices.create.rates.showMore', {
                rates: extra.map(({ row }) => `${row.vatRate} %`).join(', '),
              })}
        </button>
      )}
    </div>
  );
};
