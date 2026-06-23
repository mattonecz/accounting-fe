import { useTranslation } from 'react-i18next';
import type { InvoiceResponseDto } from '@/api/model';
import { cn } from '@/lib/utils';
import { parseRateItemName } from '@/lib/simpleInvoiceItems';
import { DetailCard, SectionLabel } from './primitives';
import { formatMoney } from './utils';
import { toNumber } from '@/pages/UpdateInvoice/useUpdateInvoiceForm';

interface InvoiceItemsTableProps {
  invoice: InvoiceResponseDto;
  currency: string;
}

const GRID = 'minmax(0,1fr) 70px 120px 60px 150px';

const TotalRow = ({
  label,
  value,
  muted,
  grand,
}: {
  label: string;
  value: string;
  muted?: boolean;
  grand?: boolean;
}) => (
  <div
    className={cn(
      'flex items-baseline justify-end gap-6 px-4',
      grand && 'mt-1.5 border-t border-border pt-2.5',
    )}
  >
    <span
      className={cn(
        'text-right text-xs',
        grand ? 'font-semibold text-foreground' : 'text-muted-foreground',
      )}
    >
      {label}
    </span>
    <span
      className={cn(
        'w-[150px] text-right tabular-nums',
        grand
          ? 'text-lg font-bold tracking-tight text-foreground'
          : muted
            ? 'text-sm text-muted-foreground'
            : 'text-sm font-medium text-foreground',
      )}
    >
      {value}
    </span>
  </div>
);

export const InvoiceItemsTable = ({
  invoice,
  currency,
}: InvoiceItemsTableProps) => {
  const { t } = useTranslation();

  const taxBase = toNumber(invoice.total);
  const totalTax = toNumber(invoice.totalTax);
  const totalWithTax = toNumber(invoice.totalWithTax);

  // VAT broken down per rate, mirroring the wireframe's "DPH 21 %" line(s).
  const vatByRate = new Map<number, number>();
  invoice.items.forEach((item) => {
    const rate = toNumber(item.vatRate);
    if (rate <= 0) return;
    const base = toNumber(item.quantity) * toNumber(item.unitPrice);
    vatByRate.set(rate, (vatByRate.get(rate) ?? 0) + base * (rate / 100));
  });
  const vatRows = [...vatByRate.entries()].sort(([a], [b]) => b - a);
  const hasVat = totalTax > 0;

  return (
    <DetailCard>
      <SectionLabel className="mb-3.5">
        {t('invoices.detail.items.title')}
      </SectionLabel>

      <div className="overflow-hidden rounded-lg border border-border/70">
        <div
          className="grid gap-3 border-b border-border/70 bg-muted/40 px-4 py-2.5"
          style={{ gridTemplateColumns: GRID }}
        >
          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('invoices.detail.items.columns.item')}
          </span>
          <span className="text-right text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('invoices.fields.quantity')}
          </span>
          <span className="text-right text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('invoices.fields.unitPrice')}
          </span>
          <span className="text-right text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('invoices.detail.items.columns.vat')}
          </span>
          <span className="text-right text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('invoices.list.columns.amount')}
          </span>
        </div>

        {invoice.items.map((item, index) => {
          const quantity = toNumber(item.quantity);
          const unitPrice = toNumber(item.unitPrice);
          const vatRate = toNumber(item.vatRate);
          const total = quantity * unitPrice * (1 + vatRate / 100);
          const rateFromName = parseRateItemName(item.name);
          const displayName =
            rateFromName !== null
              ? t('simpleInvoices.create.rates.lineName', { rate: rateFromName })
              : item.name;

          return (
            <div
              key={item.id ?? `${item.name}-${index}`}
              className="grid items-center gap-3 border-b border-border/60 px-4 py-3 last:border-b-0"
              style={{ gridTemplateColumns: GRID }}
            >
              <span className="text-sm font-medium text-foreground">
                {displayName}
              </span>
              <span className="text-right text-sm tabular-nums text-foreground">
                {quantity}
                {item.unit ? ` ${item.unit}` : ''}
              </span>
              <span className="text-right text-sm tabular-nums text-foreground">
                {formatMoney(unitPrice, currency)}
              </span>
              <span className="text-right text-xs tabular-nums text-muted-foreground">
                {vatRate}%
              </span>
              <span className="text-right text-sm font-semibold tabular-nums text-foreground">
                {formatMoney(total, currency)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 space-y-1.5">
        {hasVat && (
          <>
            <TotalRow
              label={t('invoices.summary.taxBase')}
              value={formatMoney(taxBase, currency)}
            />
            {vatRows.map(([rate, tax]) => (
              <TotalRow
                key={rate}
                label={`${t('invoices.detail.items.columns.vat')} ${rate}%`}
                value={formatMoney(tax, currency)}
                muted
              />
            ))}
          </>
        )}
        <TotalRow
          label={t('invoices.summary.total')}
          value={formatMoney(totalWithTax, currency)}
          grand
        />
      </div>
    </DetailCard>
  );
};
