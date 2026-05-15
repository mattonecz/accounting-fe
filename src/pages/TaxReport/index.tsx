import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { vatExport, useVatSummaryByMonth } from '@/api/vat/vat';
import {
  InvoiceResponseDtoKind,
  type InvoiceResponseDto,
} from '@/api/model';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import {
  Calculator,
  FileSpreadsheet,
  Receipt,
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

const ZERO_TOTALS: VatTotals = { base: 0, vat: 0, total: 0 };

const claimRatio = (invoice: InvoiceResponseDto): number => {
  const raw = invoice.vatClaimRatio as unknown;
  const value = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(value) && value > 0 ? value : 1;
};

const aggregate = (invoices: InvoiceResponseDto[], applyClaimRatio: boolean) =>
  invoices.reduce<VatTotals>((acc, invoice) => {
    const ratio = applyClaimRatio ? claimRatio(invoice) : 1;
    return {
      base: acc.base + Number(invoice.total ?? 0) * ratio,
      vat: acc.vat + Number(invoice.totalTax ?? 0) * ratio,
      total: acc.total + Number(invoice.totalWithTax ?? 0) * ratio,
    };
  }, ZERO_TOTALS);

const TaxReport = () => {
  const { t, i18n } = useTranslation();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [isExporting, setIsExporting] = useState(false);
  const years = Array.from({ length: 5 }, (_, index) => currentYear - index);

  const queryMonth = selectedMonth + 1;

  const { data, isLoading, isFetching, isError } = useVatSummaryByMonth({
    year: selectedYear,
    month: queryMonth,
  });

  const { vydaneFaktury, prijateFaktury, zjednoduseneDoklady } = useMemo(() => {
    const invoices: InvoiceResponseDto[] = data?.data ?? [];
    const issuedInvoices = invoices.filter(
      (invoice) =>
        invoice.kind === InvoiceResponseDtoKind.INVOICE &&
        invoice.type === 'ISSUED',
    );
    const receivedInvoices = invoices.filter(
      (invoice) =>
        invoice.kind === InvoiceResponseDtoKind.INVOICE &&
        invoice.type === 'RECEIVED',
    );
    const simpleInvoices = invoices.filter(
      (invoice) => invoice.kind === InvoiceResponseDtoKind.SIMPLE,
    );

    return {
      vydaneFaktury: aggregate(issuedInvoices, false),
      prijateFaktury: aggregate(receivedInvoices, true),
      zjednoduseneDoklady: aggregate(simpleInvoices, true),
    };
  }, [data]);

  const vstupniDPH = prijateFaktury.vat + zjednoduseneDoklady.vat;
  const vystupniDPH = vydaneFaktury.vat;
  const vysledekDPH = vystupniDPH - vstupniDPH;
  const obratNaVystupu = vydaneFaktury.total;
  const zakladNaVystupu = vydaneFaktury.base;
  const obratNaVstupu = prijateFaktury.total + zjednoduseneDoklady.total;
  const zakladNaVstupu = prijateFaktury.base + zjednoduseneDoklady.base;

  const fmt = (n: number) => formatMoney(n, 'CZK', i18n.language);

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
      <PageHeader
        title={t('taxReport.title')}
        description={t('taxReport.description')}
        actions={
          <>
            <MonthSelector
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              years={years}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
            />
            <Button onClick={() => void handleVatExport()} disabled={isExporting}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              {isExporting ? t('taxReport.actions.exporting') : t('taxReport.actions.export')}
            </Button>
          </>
        }
      />

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
