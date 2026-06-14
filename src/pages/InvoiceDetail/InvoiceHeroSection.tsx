import { useTranslation } from 'react-i18next';
import { InvoiceStatusBadge } from '@/components/InvoiceStatusBadge';
import type { InvoiceResponseDto } from '@/api/model';
import { cn } from '@/lib/utils';
import { DetailCard, SectionLabel } from './primitives';
import { formatMoney } from './utils';

interface InvoiceHeroSectionProps {
  invoice: InvoiceResponseDto;
  currency: string;
  paidAmount: number;
  remainingAmount: number;
}

const PayStat = ({
  label,
  value,
  tone,
  divider,
}: {
  label: string;
  value: string;
  tone?: 'pos' | 'neg' | 'muted';
  divider?: boolean;
}) => (
  <div className={cn(divider && 'border-l border-border pl-6')}>
    <SectionLabel>{label}</SectionLabel>
    <div
      className={cn(
        'mt-1.5 text-base font-semibold tabular-nums',
        tone === 'pos' && 'text-success',
        tone === 'neg' && 'text-destructive',
        tone === 'muted' && 'text-muted-foreground',
        !tone && 'text-foreground',
      )}
    >
      {value}
    </div>
  </div>
);

export const InvoiceHeroSection = ({
  invoice,
  currency,
  paidAmount,
  remainingAmount,
}: InvoiceHeroSectionProps) => {
  const { t } = useTranslation();
  const counterparty = invoice.contactSnapshot;

  return (
    <DetailCard className="p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground tabular-nums">
            # {invoice.number || '-'}
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground md:text-[26px]">
            {counterparty?.name || '-'}
          </h1>
          <InvoiceStatusBadge status={invoice.status} className="mt-3.5" />
        </div>

        <div className="sm:text-right">
          <SectionLabel>{t('invoices.summary.totalDue')}</SectionLabel>
          <div className="mt-1.5 text-[28px] font-bold leading-none tracking-tight text-foreground tabular-nums">
            {formatMoney(invoice.totalWithTax, currency)}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 border-t border-border pt-4">
        <PayStat
          label={t('invoices.detail.hero.total')}
          value={formatMoney(invoice.totalWithTax, currency)}
        />
        <PayStat
          label={t('invoices.detail.hero.paid')}
          value={formatMoney(paidAmount, currency)}
          tone={paidAmount > 0 ? 'pos' : undefined}
          divider
        />
        <PayStat
          label={t('invoices.detail.hero.remaining')}
          value={formatMoney(remainingAmount, currency)}
          tone={remainingAmount > 0 ? 'neg' : 'muted'}
          divider
        />
      </div>
    </DetailCard>
  );
};
