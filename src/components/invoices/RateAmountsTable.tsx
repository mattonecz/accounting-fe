import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { RateField, RateRowValue } from './rateAmounts';

const labelClass = 'text-[11px] font-semibold text-foreground/80';
const colHeadClass =
  'text-[9px] font-semibold uppercase tracking-wider text-muted-foreground';

export interface RateAmountsTableProps {
  rates: RateRowValue[];
  isVatPayer: boolean;
  onCellChange: (index: number, field: RateField, rawValue: string) => void;
  /** Non-VAT-payer single-total fallback; required when !isVatPayer. */
  onTotalOnlyChange?: (rawValue: string) => void;
}

// Shared amounts-by-VAT-rate table for received invoices and simplified
// documents. Fixed rows per Czech VAT rate; base / VAT / total are all editable
// and kept in sync by the page (recomputeRow). Non-VAT payers enter a single
// gross total instead. Purely presentational — the page owns the form state and
// the totals footer.
export const RateAmountsTable = ({
  rates,
  isVatPayer,
  onCellChange,
  onTotalOnlyChange,
}: RateAmountsTableProps) => {
  const { t } = useTranslation();

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

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="grid grid-cols-[64px_1fr_1fr_1fr] items-center gap-3 border-b bg-muted/50 px-3.5 py-2 sm:grid-cols-[80px_1fr_1fr_1fr]">
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
      {rates.map((row, index) => {
        const isEmpty = !(Number(row.total) > 0);
        const cellClass = (value: string) =>
          cn(
            'h-8 text-right text-sm tabular-nums',
            !value && 'border-dashed',
          );
        return (
          <div
            key={row.vatRate}
            className="grid grid-cols-[64px_1fr_1fr_1fr] items-center gap-3 border-b px-3.5 py-2.5 last:border-b-0 sm:grid-cols-[80px_1fr_1fr_1fr]"
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
      })}
    </div>
  );
};
