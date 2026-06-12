import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { Card } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { formatMoney } from '@/lib/formatters';
import { MOCK_CASHFLOW, MOCK_CURRENCY } from './mockData';

export const CashflowCard = () => {
  const { t, i18n } = useTranslation();

  const chartData = useMemo(() => {
    const monthFormat = new Intl.DateTimeFormat(i18n.language, { month: 'short' });
    const now = new Date();
    return MOCK_CASHFLOW.map((point, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (MOCK_CASHFLOW.length - 1 - index), 1);
      return { month: monthFormat.format(date), ...point };
    });
  }, [i18n.language]);

  const totalIncome = MOCK_CASHFLOW.reduce((sum, point) => sum + point.income, 0);
  const totalExpenses = MOCK_CASHFLOW.reduce((sum, point) => sum + point.expenses, 0);

  const chartConfig: ChartConfig = {
    income: {
      label: t('dashboard.cashflow.income'),
      color: 'hsl(var(--brand))',
    },
    expenses: {
      label: t('dashboard.cashflow.expenses'),
      color: 'hsl(var(--destructive))',
    },
  };

  return (
    <Card className="flex flex-col border-border/60 p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t('dashboard.cashflow.title')}
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-brand" />
            {t('dashboard.cashflow.income')} ·{' '}
            <span className="font-semibold tabular-nums text-foreground">
              {formatMoney(totalIncome, MOCK_CURRENCY, i18n.language)}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-destructive" />
            {t('dashboard.cashflow.expenses')} ·{' '}
            <span className="font-semibold tabular-nums text-foreground">
              {formatMoney(totalExpenses, MOCK_CURRENCY, i18n.language)}
            </span>
          </span>
        </div>
      </div>
      <ChartContainer config={chartConfig} className="min-h-[220px] flex-1">
        <AreaChart data={chartData} margin={{ left: 4, right: 4, top: 4 }}>
          <defs>
            <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--brand))" stopOpacity={0.25} />
              <stop offset="95%" stopColor="hsl(var(--brand))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.2} />
              <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
          <Area
            dataKey="income"
            type="monotone"
            stroke="hsl(var(--brand))"
            strokeWidth={2}
            fill="url(#fillIncome)"
          />
          <Area
            dataKey="expenses"
            type="monotone"
            stroke="hsl(var(--destructive))"
            strokeWidth={2}
            fill="url(#fillExpenses)"
          />
        </AreaChart>
      </ChartContainer>
    </Card>
  );
};
