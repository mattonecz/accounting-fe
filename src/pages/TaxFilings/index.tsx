import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plug, Plus } from 'lucide-react';
import { useListTaxFilings } from '@/api/tax-filings/tax-filings';
import { dataMessagesTestLogin } from '@/api/data-messages/data-messages';
import {
  TaxFilingResponseDtoStatus,
  type TaxFilingResponseDto,
} from '@/api/model';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { DataTableCard } from '@/components/DataTableCard';
import { TaxFilingStatusBadge } from '@/components/TaxFilingStatusBadge';
import { formatDate, formatMoney } from '@/lib/formatters';

const TaxFilings = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isTestingLogin, setIsTestingLogin] = useState(false);

  const handleTestIsdsLogin = async () => {
    if (isTestingLogin) return;
    setIsTestingLogin(true);
    try {
      const response = await dataMessagesTestLogin({});
      console.log('data-messages/test-login result', response.data);
    } catch (error) {
      console.error('data-messages/test-login failed', error);
    } finally {
      setIsTestingLogin(false);
    }
  };

  const { data, isLoading, isError } = useListTaxFilings({
    query: {
      refetchInterval: (query) =>
        query.state.data?.data.some(
          (filing) => filing.status === TaxFilingResponseDtoStatus.PROCESSING,
        )
          ? 5000
          : false,
    },
  });

  const fmtMoney = (value: number | undefined | null) =>
    value == null ? '–' : formatMoney(value, 'CZK', i18n.language);

  const columns = [
    {
      header: t('taxFilings.list.columns.period'),
      cell: (filing: TaxFilingResponseDto) =>
        `${t(`taxReport.months.${filing.month - 1}`)} ${filing.year}`,
      cellClassName: 'font-medium capitalize',
    },
    {
      header: t('taxFilings.list.columns.status'),
      cell: (filing: TaxFilingResponseDto) => (
        <TaxFilingStatusBadge status={filing.status} />
      ),
    },
    {
      header: t('taxFilings.list.columns.submissionType'),
      cell: (filing: TaxFilingResponseDto) =>
        t(`taxFilings.submissionTypes.${filing.submissionType}`, filing.submissionType),
    },
    {
      header: t('taxFilings.list.columns.createdDate'),
      cell: (filing: TaxFilingResponseDto) => formatDate(filing.createdAt),
      cellClassName: 'text-muted-foreground',
    },
    {
      header: t('taxFilings.list.columns.submissionDate'),
      cell: (filing: TaxFilingResponseDto) =>
        filing.submissionDate ? formatDate(filing.submissionDate) : '–',
      cellClassName: 'text-muted-foreground',
    },
    {
      header: t('taxFilings.list.columns.outputVat'),
      headerClassName: 'text-right',
      cellClassName: 'text-right tabular-nums',
      cell: (filing: TaxFilingResponseDto) => fmtMoney(filing.summary?.outputVat),
    },
    {
      header: t('taxFilings.list.columns.inputVat'),
      headerClassName: 'text-right',
      cellClassName: 'text-right tabular-nums',
      cell: (filing: TaxFilingResponseDto) => fmtMoney(filing.summary?.inputVat),
    },
    {
      header: t('taxFilings.list.columns.result'),
      headerClassName: 'text-right',
      cellClassName: 'text-right font-semibold tabular-nums',
      cell: (filing: TaxFilingResponseDto) => fmtMoney(filing.summary?.payableVat),
    },
  ];

  return (
    <PageLayout>
      <PageHeader
        title={t('taxFilings.title')}
        description={t('taxFilings.description')}
        actions={
          <>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => void handleTestIsdsLogin()}
              disabled={isTestingLogin}
            >
              <Plug className="h-4 w-4" />
              {t('taxFilings.actions.testIsdsLogin')}
            </Button>
            <Button className="gap-2" onClick={() => navigate('/tax-filings/create')}>
              <Plus className="h-4 w-4" />
              {t('taxFilings.actions.create')}
            </Button>
          </>
        }
      />

      <DataTableCard
        title={t('taxFilings.list.card')}
        columns={columns}
        data={data?.data}
        isLoading={isLoading}
        isError={isError}
        emptyMessage={t('taxFilings.list.empty')}
        onRowClick={(filing) => navigate(`/tax-filings/${filing.id}`)}
      />
    </PageLayout>
  );
};

export default TaxFilings;
