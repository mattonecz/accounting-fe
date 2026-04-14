import { StatCard } from '@/components/StatCard';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { useInvoiceGetStats } from '@/api/invoices/invoices';
import { ArrowUpRight, ArrowDownRight, Scale } from 'lucide-react';
import { RecentInvoicesCard } from './RecentInvoicesCard';

const formatSummaryCurrency = (amount: number, currency = 'USD') =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 0,
  }).format(amount);

const formatPercentChange = (value: number) => {
  const sign = value > 0 ? '+' : '';
  return `${sign}${Math.round(value)}% from last month`;
};

export default function Dashboard() {
  const { data, isLoading, isError } = useInvoiceGetStats();
  const stats = data?.data;

  const summaryCurrency =
    stats?.recentIncomingInvoices?.[0]?.currency ??
    stats?.recentOutgoingInvoices?.[0]?.currency ??
    'USD';

  const summary = stats?.summary;

  return (
    <PageLayout>
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's your financial overview."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Income"
          value={formatSummaryCurrency(summary?.totalIncome ?? 0, summaryCurrency)}
          icon={ArrowUpRight}
          trend={summary ? formatPercentChange(summary.incomeChangePct) : undefined}
          variant="success"
        />
        <StatCard
          title="Total Expenses"
          value={formatSummaryCurrency(summary?.totalExpenses ?? 0, summaryCurrency)}
          icon={ArrowDownRight}
          trend={summary ? formatPercentChange(summary.expenseChangePct) : undefined}
          variant="warning"
        />
        <StatCard
          title="Net Balance"
          value={formatSummaryCurrency(summary?.netBalance ?? 0, summaryCurrency)}
          icon={Scale}
          trend={summary ? formatPercentChange(summary.netChangePct) : undefined}
          variant="default"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <RecentInvoicesCard
          title="Recent Incoming Invoices"
          description="Latest invoices you received."
          invoices={stats?.recentIncomingInvoices}
          isLoading={isLoading}
          isError={isError}
          fallbackCurrency={summaryCurrency}
          variant="success"
        />
        <RecentInvoicesCard
          title="Recent Outgoing Invoices"
          description="Latest invoices you issued."
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
