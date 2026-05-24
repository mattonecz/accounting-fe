import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { Calculator, TrendingDown, TrendingUp } from 'lucide-react';
import { useVatSummaryByMonth } from '@/api/vat/vat';
import { useCreateTaxFiling } from '@/api/tax-filings/tax-filings';
import {
  CreateTaxFilingDtoSubmissionType,
  InvoiceResponseDtoKind,
  type InvoiceResponseDto,
} from '@/api/model';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { FormCard } from '@/components/FormCard';
import { StatCard } from '@/components/StatCard';
import { MonthSelector } from '@/components/MonthSelector';
import { TaxFilingInvoiceTables } from '@/components/TaxFilingInvoiceTables';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatMoney } from '@/lib/formatters';

const claimRatio = (invoice: InvoiceResponseDto): number => {
  const raw = invoice.vatClaimRatio as unknown;
  const value = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(value) && value > 0 ? value : 1;
};

const sumVat = (invoices: InvoiceResponseDto[], applyClaimRatio: boolean) =>
  invoices.reduce(
    (acc, invoice) =>
      acc + Number(invoice.totalTax ?? 0) * (applyClaimRatio ? claimRatio(invoice) : 1),
    0,
  );

const CreateTaxFiling = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [createdDate, setCreatedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const years = Array.from({ length: 5 }, (_, index) => currentYear - index);

  const { data, isLoading, isError } = useVatSummaryByMonth({
    year: selectedYear,
    month: selectedMonth + 1,
  });

  const { issued, received } = useMemo(() => {
    const invoices: InvoiceResponseDto[] = data?.data ?? [];
    return {
      issued: invoices.filter(
        (invoice) =>
          invoice.kind === InvoiceResponseDtoKind.INVOICE &&
          invoice.type === 'ISSUED',
      ),
      received: invoices.filter(
        (invoice) =>
          invoice.kind === InvoiceResponseDtoKind.SIMPLE ||
          (invoice.kind === InvoiceResponseDtoKind.INVOICE &&
            invoice.type === 'RECEIVED'),
      ),
    };
  }, [data]);

  const outputVat = sumVat(issued, false);
  const inputVat = sumVat(received, true);
  const resultVat = outputVat - inputVat;

  const fmtMoney = (value: number) => formatMoney(value, 'CZK', i18n.language);

  const createFiling = useCreateTaxFiling();

  const handleSubmit = () => {
    createFiling.mutate(
      {
        data: {
          month: selectedMonth + 1,
          year: selectedYear,
          submissionType: CreateTaxFilingDtoSubmissionType.REGULAR,
          createDate: createdDate,
        },
      },
      {
        onSuccess: () => {
          enqueueSnackbar(t('taxFilings.create.success'), { variant: 'success' });
          navigate('/tax-filings');
        },
        onError: () => {
          enqueueSnackbar(t('taxFilings.create.error'), { variant: 'error' });
        },
      },
    );
  };

  return (
    <PageLayout className="space-y-4">
      <PageHeader
        title={t('taxFilings.create.title')}
        description={t('taxFilings.create.description')}
        backButton
      />

      <FormCard title={t('taxFilings.create.periodSection')}>
        <MonthSelector
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          years={years}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />
      </FormCard>

      <TaxFilingInvoiceTables
        issued={issued}
        received={received}
        isLoading={isLoading}
        isError={isError}
      />

      <FormCard title={t('taxFilings.create.infoSection')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="createdDate">
              {t('taxFilings.create.createdDate')}
            </label>
            <Input
              id="createdDate"
              type="date"
              value={createdDate}
              onChange={(event) => setCreatedDate(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('taxFilings.create.submissionType')}
            </label>
            <Select value={CreateTaxFilingDtoSubmissionType.REGULAR} disabled>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CreateTaxFilingDtoSubmissionType.REGULAR}>
                  {t('taxFilings.submissionTypes.REGULAR')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormCard>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title={t('taxFilings.statCards.inputVat')}
          value={fmtMoney(inputVat)}
          icon={TrendingDown}
          variant="success"
        />
        <StatCard
          title={t('taxFilings.statCards.outputVat')}
          value={fmtMoney(outputVat)}
          icon={TrendingUp}
          variant="default"
        />
        <StatCard
          title={t('taxFilings.statCards.result')}
          value={fmtMoney(resultVat)}
          icon={Calculator}
          trend={
            resultVat >= 0
              ? t('taxFilings.statCards.vatDue')
              : t('taxFilings.statCards.vatRefund')
          }
          variant={resultVat < 0 ? 'success' : 'destructive'}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={createFiling.isPending}>
          {createFiling.isPending
            ? t('taxFilings.create.submitting')
            : t('taxFilings.create.submit')}
        </Button>
      </div>
    </PageLayout>
  );
};

export default CreateTaxFiling;
