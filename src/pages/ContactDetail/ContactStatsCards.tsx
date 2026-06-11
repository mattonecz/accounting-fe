import { useTranslation } from 'react-i18next';
import type { ContactInvoiceStatsDto, ContactStatsResponseDto } from '@/api/model';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatMoney } from '@/lib/formatters';

const STATS_CURRENCY = 'CZK';

interface StatRowProps {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}

const StatRow = ({ label, value, valueClassName }: StatRowProps) => (
  <div className="flex items-center justify-between gap-4 py-2">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className={`text-right font-medium ${valueClassName ?? ''}`}>{value}</span>
  </div>
);

const StatsCard = ({ title, stats }: { title: string; stats: ContactInvoiceStatsDto }) => {
  const { t, i18n } = useTranslation();
  const money = (amount: number) => formatMoney(amount, STATS_CURRENCY, i18n.language);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border/60">
        <StatRow label={t('contacts.detail.stats.count')} value={stats.count} />
        <StatRow label={t('contacts.detail.stats.totalWithTax')} value={money(stats.totalWithTax)} />
        <StatRow
          label={t('contacts.detail.stats.averageWithTax')}
          value={money(stats.averageWithTax)}
        />
        <StatRow
          label={t('contacts.detail.stats.unpaid')}
          value={`${stats.unpaidCount} (${money(stats.unpaidTotalWithTax)})`}
          valueClassName={stats.unpaidCount > 0 ? 'text-warning' : undefined}
        />
        <StatRow
          label={t('contacts.detail.stats.overdue')}
          value={stats.overdueCount}
          valueClassName={stats.overdueCount > 0 ? 'text-destructive' : undefined}
        />
        <StatRow
          label={t('contacts.detail.stats.firstInvoice')}
          value={formatDate(stats.firstInvoiceDate, i18n.language)}
        />
        <StatRow
          label={t('contacts.detail.stats.lastInvoice')}
          value={formatDate(stats.lastInvoiceDate, i18n.language)}
        />
      </CardContent>
    </Card>
  );
};

interface ContactStatsCardsProps {
  stats: ContactStatsResponseDto | undefined;
  isLoading: boolean;
  isError: boolean;
}

export const ContactStatsCards = ({ stats, isLoading, isError }: ContactStatsCardsProps) => {
  const { t } = useTranslation();

  if (isLoading) {
    return <p className="text-muted-foreground">{t('contacts.detail.stats.loading')}</p>;
  }

  if (isError || !stats) {
    return <p className="text-destructive">{t('contacts.detail.stats.error')}</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <StatsCard title={t('contacts.detail.stats.issuedTitle')} stats={stats.issued} />
      <StatsCard title={t('contacts.detail.stats.receivedTitle')} stats={stats.received} />
    </div>
  );
};
