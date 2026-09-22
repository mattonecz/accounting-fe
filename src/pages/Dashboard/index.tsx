import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Inbox,
  MoreHorizontal,
  Plus,
  Receipt,
  Users,
} from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { UploadInvoiceButton } from '@/components/UploadInvoiceButton';
import { UploadReceiptButton } from '@/components/UploadReceiptButton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useInvoiceGetStats } from '@/api/invoices/invoices';
import type { DashboardInvoiceItemDto } from '@/api/model';
import { formatMoney } from '@/lib/formatters';
import { cn } from '@/lib/utils';
// Recharts is a heavy dependency and only this card needs it.
const CashflowCard = lazy(() =>
  import('./CashflowCard').then((m) => ({ default: m.CashflowCard })),
);
import { QueueItem } from './QueueItem';
import { useDashboardQueue } from './useDashboardQueue';

const DEFAULT_CURRENCY = 'CZK';

const getGreetingKey = (hour: number) => {
  if (hour < 12) return 'dashboard.greeting.morning';
  if (hour < 18) return 'dashboard.greeting.afternoon';
  return 'dashboard.greeting.evening';
};

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useInvoiceGetStats();
  const stats = data?.data;
  const summary = stats?.summary;
  const queue = useDashboardQueue();

  const fmt = (amount: number, currency = DEFAULT_CURRENCY) =>
    formatMoney(amount, currency, i18n.language);

  const ChangeBadge = ({ value }: { value: number | undefined }) => {
    if (value == null) return null;
    const positive = value >= 0;
    const Icon = positive ? ArrowUpRight : ArrowDownRight;
    return (
      <span
        className={cn(
          'flex items-center gap-0.5 text-xs font-semibold',
          positive ? 'text-success' : 'text-destructive',
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        {positive ? '+' : ''}
        {value}%
      </span>
    );
  };

  const now = new Date();
  const weekday = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'long',
  }).format(now);
  const longDate = new Intl.DateTimeFormat(i18n.language, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);
  const dateLine = `${weekday} · ${longDate}`.toUpperCase();

  const firstName = (user?.name || user?.email || '').split(' ')[0];
  const queueCount = queue.items.length;

  const latestInvoices: DashboardInvoiceItemDto[] = [
    ...(stats?.recentOutgoingInvoices ?? []),
    ...(stats?.recentIncomingInvoices ?? []),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const statusStyles: Record<DashboardInvoiceItemDto['status'], string> = {
    PAID: 'text-success',
    PENDING: 'text-muted-foreground',
  };

  const getStatusLabel = (status: DashboardInvoiceItemDto['status']) =>
    status === 'PAID'
      ? t('dashboard.status.paid')
      : t('dashboard.status.pending');

  const quickActions = [
    {
      icon: Plus,
      label: t('dashboard.actions.newInvoice'),
      primary: true,
      onClick: () => navigate('/invoices/create'),
    },
    {
      icon: Inbox,
      label: t('dashboard.actions.newExpense'),
      onClick: () => navigate('/invoices/create?type=received'),
    },
    {
      icon: Users,
      label: t('dashboard.actions.newContact'),
      onClick: () => navigate('/contacts/create'),
    },
    {
      icon: Receipt,
      label: t('dashboard.actions.addReceipt'),
      onClick: () => navigate('/invoices/simple/create'),
    },
  ];

  return (
    <PageLayout>
      {/* Greeting + quick actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {dateLine}
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">
            {t(getGreetingKey(now.getHours()), { name: firstName })}{' '}
            {queueCount > 0 && (
              <span className="text-base font-normal text-muted-foreground md:text-lg">
                {t('dashboard.greeting.waiting', { count: queueCount })}
              </span>
            )}
          </h1>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant={action.primary ? 'default' : 'outline'}
              size="sm"
              className="gap-1.5"
              onClick={action.onClick}
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </Button>
          ))}
          {/* Opens the issued or received form, whichever the AI recognises. */}
          <UploadInvoiceButton size="sm" className="gap-1.5" />
          <UploadReceiptButton size="sm" />
        </div>
      </div>

      {/* Hero metric — invoiced balance from /invoices/stats */}
      <Card className="border-border/60 p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('dashboard.hero.netBalance')}
            </p>
            <div className="mt-1.5 flex items-baseline gap-3">
              <span className="text-3xl font-bold tracking-tight tabular-nums md:text-4xl">
                {summary ? fmt(summary.netBalance) : '—'}
              </span>
              <ChangeBadge value={summary?.netChangePct} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('dashboard.hero.changeHint')}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <div className="sm:text-right">
              <p className="text-xs text-muted-foreground">
                {t('dashboard.hero.income')}
              </p>
              <p className="mt-0.5 text-sm font-medium tabular-nums text-success">
                {summary ? fmt(summary.totalIncome) : '—'}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs text-muted-foreground">
                {t('dashboard.hero.expenses')}
              </p>
              <p className="mt-0.5 text-sm font-medium tabular-nums text-destructive">
                {summary ? `−${fmt(summary.totalExpenses)}` : '—'}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs text-muted-foreground">
                {t('dashboard.hero.activeClients')}
              </p>
              <p className="mt-0.5 text-sm font-medium tabular-nums">
                {summary?.activeClients ?? '—'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Cash-flow chart | action queue */}
      <div className="grid items-stretch gap-6 lg:grid-cols-2">
        <Suspense
          fallback={<Card className="h-full border-border/60 p-5 shadow-sm" />}
        >
          <CashflowCard />
        </Suspense>

        <Card className="flex flex-col overflow-hidden border-border/60 p-0 shadow-sm">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t('dashboard.queue.title')}
              </p>
              <p className="mt-0.5 text-sm font-semibold">
                {t('dashboard.queue.subtitle')}
              </p>
            </div>
            {queueCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {t('dashboard.queue.items', { count: queueCount })}
              </span>
            )}
          </div>
          {queueCount > 0 ? (
            <div className="flex-1 overflow-auto">
              {queue.items.map((item) => (
                <QueueItem
                  key={`${item.kind}-${item.id}`}
                  tag={t(`dashboard.queue.tags.${item.kind}`)}
                  tagClassName={
                    item.kind === 'overdue'
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  }
                  title={item.title}
                  meta={
                    item.kind === 'overdue'
                      ? t('dashboard.queue.overdueMeta', {
                          count: item.daysOverdue ?? 0,
                          amount: fmt(item.amount, item.currency),
                        })
                      : item.kind === 'draft'
                        ? t('dashboard.queue.draftMetaAmount', {
                            amount: fmt(item.amount, item.currency),
                          })
                        : t('dashboard.queue.filingMeta', {
                            amount: fmt(item.amount, item.currency),
                          })
                  }
                  actions={[
                    {
                      label:
                        item.kind === 'draft'
                          ? t('dashboard.queue.actionEdit')
                          : item.kind === 'filing'
                            ? t('dashboard.queue.actionPrepare')
                            : t('invoices.actions.detail'),
                      primary: true,
                      onClick: () => navigate(item.route),
                    },
                  ]}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-5 py-10 text-center">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <p className="text-sm font-semibold">
                {t('dashboard.queue.emptyTitle')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.queue.emptyDesc')}
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Latest invoices */}
      <Card className="overflow-hidden border-border/60 p-0 shadow-sm">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
          <p className="text-sm font-semibold">{t('dashboard.latest.title')}</p>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs text-muted-foreground"
            onClick={() => navigate('/outgoing-invoices')}
          >
            {t('dashboard.latest.viewAll')}
          </Button>
        </div>
        {latestInvoices.length > 0 ? (
          <div>
            {latestInvoices.map((invoice, index) => (
              <div
                key={invoice.id}
                className={cn(
                  'grid grid-cols-[90px_1fr_110px_auto] items-center gap-3 px-5 py-2.5 md:grid-cols-[100px_1fr_120px_130px_auto]',
                  index > 0 && 'border-t border-border/60',
                )}
              >
                <span className="text-xs font-semibold tabular-nums">
                  {invoice.number}
                </span>
                <span className="truncate text-sm">{invoice.companyName}</span>
                <span className="text-right text-sm font-medium tabular-nums">
                  {fmt(invoice.amount, invoice.currency || DEFAULT_CURRENCY)}
                </span>
                <span
                  className={cn(
                    'hidden items-center gap-1.5 text-xs md:flex',
                    statusStyles[invoice.status],
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {getStatusLabel(invoice.status)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-5 py-8 text-center text-xs text-muted-foreground">
            {isLoading
              ? t('dashboard.latest.loading')
              : isError
                ? t('dashboard.latest.loadError')
                : t('dashboard.latest.noActivity')}
          </p>
        )}
      </Card>
    </PageLayout>
  );
}
