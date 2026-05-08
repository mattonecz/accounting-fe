import { useTranslation } from 'react-i18next';
import { StatCard } from '@/components/StatCard';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { useInvoiceGetStats } from '@/api/invoices/invoices';
import { ArrowUpRight, ArrowDownRight, Scale } from 'lucide-react';
import { formatMoney } from '@/lib/formatters';
import { RecentInvoicesCard } from './RecentInvoicesCard';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { data, isLoading, isError } = useInvoiceGetStats();
  const stats = data?.data;

  const summaryCurrency =
    stats?.recentIncomingInvoices?.[0]?.currency ??
    stats?.recentOutgoingInvoices?.[0]?.currency ??
    'CZK';

  const summary = stats?.summary;

  const formatSummary = (amount: number) =>
    formatMoney(amount, summaryCurrency, i18n.language);

  const formatPercentChange = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return t('dashboard.cards.fromLastMonth', { percent: `${sign}${Math.round(value)}` });
  };

  return (
    <PageLayout>
      <PageHeader
        title={t('dashboard.title')}
        description={t('dashboard.description')}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title={t('dashboard.cards.income')}
          value={formatSummary(summary?.totalIncome ?? 0)}
          icon={ArrowUpRight}
          trend={summary ? formatPercentChange(summary.incomeChangePct) : undefined}
          variant="success"
        />
        <StatCard
          title={t('dashboard.cards.expenses')}
          value={formatSummary(summary?.totalExpenses ?? 0)}
          icon={ArrowDownRight}
          trend={summary ? formatPercentChange(summary.expenseChangePct) : undefined}
          variant="warning"
        />
        <StatCard
          title={t('dashboard.cards.balance')}
          value={formatSummary(summary?.netBalance ?? 0)}
          icon={Scale}
          trend={summary ? formatPercentChange(summary.netChangePct) : undefined}
          variant="default"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <RecentInvoicesCard
          title={t('dashboard.cards.recentIncoming')}
          description={t('dashboard.cards.recentIncomingDesc')}
          invoices={stats?.recentIncomingInvoices}
          isLoading={isLoading}
          isError={isError}
          fallbackCurrency={summaryCurrency}
          variant="success"
        />
        <RecentInvoicesCard
          title={t('dashboard.cards.recentOutgoing')}
          description={t('dashboard.cards.recentOutgoingDesc')}
          invoices={stats?.recentOutgoingInvoices}
          isLoading={isLoading}
          isError={isError}
          fallbackCurrency={summaryCurrency}
          variant="warning"
        />
      </div>
    </PageLayout>
  );
}
