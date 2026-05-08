import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { invoiceGetVatByMonth } from '@/api/invoices/invoices';
import type { InvoiceGetVatByMonthDefault } from '@/api/model';
import { simpleInvoiceGetVatByMonth } from '@/api/simple-invoice/simple-invoice';
import { vatExport } from '@/api/vat/vat';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import {
  Calculator,
  FileSpreadsheet,
  Receipt,
  RefreshCcw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { formatMoney } from '@/lib/formatters';
import { MonthSelector } from './MonthSelector';
import { VatBreakdownTable } from './VatBreakdownTable';
import { VatExplanationCard } from './VatExplanationCard';

type VatTotals = {
  base: number;
  vat: number;
  total: number;
};

const normalizeTotals = (totals?: Partial<VatTotals>): VatTotals => ({
  base: Number(totals?.base ?? 0),
  vat: Number(totals?.vat ?? 0),
  total: Number(totals?.total ?? 0),
});

const TaxReport = () => {
  const { t, i18n } = useTranslation();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [isExporting, setIsExporting] = useState(false);
  const years = Array.from({ length: 5 }, (_, index) => currentYear - index);

  const queryMonth = selectedMonth + 1;

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['vat-overview', selectedYear, queryMonth],
    queryFn: async () => {
      const [invoiceVatResponse, simpleInvoiceVatResponse] = await Promise.all([
        invoiceGetVatByMonth({ year: selectedYear, month: queryMonth }),
        simpleInvoiceGetVatByMonth({ year: selectedYear, month: queryMonth }),
      ]);

      return {
        invoiceVat: invoiceVatResponse.data as unknown as InvoiceGetVatByMonthDefault,
        simpleInvoiceVat: simpleInvoiceVatResponse.data,
      };
    },
  });

  const vydaneFaktury = normalizeTotals(data?.invoiceVat?.payable);
  const prijateFaktury = normalizeTotals(data?.invoiceVat?.deductible);
  const zjednoduseneDoklady = normalizeTotals(data?.simpleInvoiceVat);

  const vstupniDPH = prijateFaktury.vat + zjednoduseneDoklady.vat;
  const vystupniDPH = vydaneFaktury.vat;
  const vysledekDPH = vystupniDPH - vstupniDPH;
  const obratNaVystupu = vydaneFaktury.total;
  const zakladNaVystupu = vydaneFaktury.base;
  const obratNaVstupu = prijateFaktury.total + zjednoduseneDoklady.total;
  const zakladNaVstupu = prijateFaktury.base + zjednoduseneDoklady.base;

  const fmt = (n: number) => formatMoney(n, 'CZK', i18n.language);

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((previousYear) => previousYear - 1);
    } else {
      setSelectedMonth((previousMonth) => previousMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((previousYear) => previousYear + 1);
    } else {
      setSelectedMonth((previousMonth) => previousMonth + 1);
    }
  };

  const handleVatExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const response = await vatExport({
        year: selectedYear,
        month: queryMonth,
      });
      console.log('vat/export result', response.data);
    } catch (error) {
      console.error('vat/export failed', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <PageLayout className="space-y-4">
      <div className="flex items-center justify-between">
        <PageHeader
          title={t('taxReport.title')}
          description={t('taxReport.description')}
        />
        <div className="flex flex-wrap items-center gap-4">
          <MonthSelector
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            years={years}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
            onPrevious={handlePreviousMonth}
            onNext={handleNextMonth}
          />

          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            {t('taxReport.actions.refresh')}
          </Button>

          <Button onClick={() => void handleVatExport()} disabled={isExporting}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {isExporting ? t('taxReport.actions.exporting') : t('taxReport.actions.export')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t('taxReport.statCards.inputVat')}
          value={fmt(vstupniDPH)}
          icon={TrendingDown}
          trend={t('taxReport.statCards.inputVatTrend')}
          variant="success"
        />
        <StatCard
          title={t('taxReport.statCards.outputVat')}
          value={fmt(vystupniDPH)}
          icon={TrendingUp}
          trend={t('taxReport.statCards.outputVatTrend')}
          variant="default"
        />
        <StatCard
          title={t('taxReport.statCards.simpleInvoices')}
          value={fmt(zjednoduseneDoklady.vat)}
          icon={Receipt}
          trend={t('taxReport.statCards.simpleInvoicesTrend')}
          variant="warning"
        />
        <StatCard
          title={t('taxReport.statCards.result')}
          value={fmt(Math.abs(vysledekDPH))}
          icon={Calculator}
          trend={vysledekDPH >= 0 ? t('taxReport.statCards.vatDue') : t('taxReport.statCards.vatRefund')}
          variant={vysledekDPH >= 0 ? 'destructive' : 'success'}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <VatBreakdownTable
          vydaneFaktury={vydaneFaktury}
          prijateFaktury={prijateFaktury}
          zjednoduseneDoklady={zjednoduseneDoklady}
          vstupniDPH={vstupniDPH}
          vystupniDPH={vystupniDPH}
          zakladNaVstupu={zakladNaVstupu}
          zakladNaVystupu={zakladNaVystupu}
          obratNaVstupu={obratNaVstupu}
          obratNaVystupu={obratNaVystupu}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          isLoading={isLoading}
          isError={isError}
        />

        <VatExplanationCard
          vysledekDPH={vysledekDPH}
          isFetching={isFetching}
        />
      </div>
    </PageLayout>
  );
};

export default TaxReport;
