import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { Calculator, Download, TrendingDown, TrendingUp } from 'lucide-react';
import {
  downloadTaxFilingKhXml,
  downloadTaxFilingVatXml,
  useGetTaxFiling,
} from '@/api/tax-filings/tax-filings';
import {
  TaxFilingInvoiceDetailDtoRole,
  TaxFilingResponseDtoStatus,
} from '@/api/model';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { FormCard } from '@/components/FormCard';
import { StatCard } from '@/components/StatCard';
import { TaxFilingStatusBadge } from '@/components/TaxFilingStatusBadge';
import { TaxFilingInvoiceTables } from '@/components/TaxFilingInvoiceTables';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { formatDate, formatMoney } from '@/lib/formatters';

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between border-b border-border/60 py-2 last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium">{value}</span>
  </div>
);

type XmlKind = 'vat' | 'kh';

const TaxFilingDetail = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const [downloading, setDownloading] = useState<XmlKind | null>(null);

  const { data, isLoading, isError } = useGetTaxFiling(id || '', {
    query: {
      refetchInterval: (query) =>
        query.state.data?.data.status === TaxFilingResponseDtoStatus.PROCESSING
          ? 5000
          : false,
    },
  });

  const filing = data?.data;

  if (!id) {
    return (
      <PageLayout>
        <p className="text-muted-foreground">{t('taxFilings.detail.invalidId')}</p>
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout>
        <p className="text-muted-foreground">{t('taxFilings.detail.loading')}</p>
      </PageLayout>
    );
  }

  if (isError || !filing) {
    return (
      <PageLayout>
        <p className="text-destructive">{t('taxFilings.detail.error')}</p>
      </PageLayout>
    );
  }

  const fmtMoney = (value: number | undefined | null) =>
    value == null ? '–' : formatMoney(value, 'CZK', i18n.language);
  const period = `${t(`taxReport.months.${filing.month - 1}`)} ${filing.year}`;
  const summary = filing.summary;
  const issuedInvoices = filing.invoices
    .filter((entry) => entry.role === TaxFilingInvoiceDetailDtoRole.ISSUED)
    .map((entry) => entry.invoice);
  const receivedInvoices = filing.invoices
    .filter((entry) => entry.role !== TaxFilingInvoiceDetailDtoRole.ISSUED)
    .map((entry) => entry.invoice);
  const canDownloadXml =
    filing.status === TaxFilingResponseDtoStatus.READY ||
    filing.status === TaxFilingResponseDtoStatus.SUBMITTED;

  const handleDownload = async (kind: XmlKind) => {
    setDownloading(kind);
    try {
      const response = await (kind === 'vat'
        ? downloadTaxFilingVatXml(filing.id, { responseType: 'blob' })
        : downloadTaxFilingKhXml(filing.id, { responseType: 'blob' }));
      const blob = new Blob([response.data as unknown as BlobPart], {
        type: 'application/xml',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${kind}-${filing.year}-${String(filing.month).padStart(2, '0')}.xml`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      enqueueSnackbar(t('taxFilings.detail.downloadError'), { variant: 'error' });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <PageLayout className="space-y-4">
      <PageHeader
        title={period}
        description={t('taxFilings.title')}
        backButton
        actions={
          <>
            <TaxFilingStatusBadge status={filing.status} />
            {canDownloadXml && (
              <>
                <Button
                  variant="outline"
                  className="gap-2"
                  disabled={downloading !== null}
                  onClick={() => void handleDownload('vat')}
                >
                  <Download className="h-4 w-4" />
                  {t('taxFilings.detail.downloadVatXml')}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  disabled={downloading !== null}
                  onClick={() => void handleDownload('kh')}
                >
                  <Download className="h-4 w-4" />
                  {t('taxFilings.detail.downloadKhXml')}
                </Button>
              </>
            )}
          </>
        }
      />

      {filing.status === TaxFilingResponseDtoStatus.FAILED && filing.errorMessage && (
        <Alert variant="destructive">
          <AlertTitle>{t('taxFilings.detail.errorTitle')}</AlertTitle>
          <AlertDescription>{filing.errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title={t('taxFilings.statCards.inputVat')}
          value={fmtMoney(summary?.inputVat)}
          icon={TrendingDown}
          variant="success"
        />
        <StatCard
          title={t('taxFilings.statCards.outputVat')}
          value={fmtMoney(summary?.outputVat)}
          icon={TrendingUp}
          variant="default"
        />
        <StatCard
          title={t('taxFilings.statCards.result')}
          value={fmtMoney(summary?.payableVat)}
          icon={Calculator}
          trend={
            summary
              ? summary.payableVat >= 0
                ? t('taxFilings.statCards.vatDue')
                : t('taxFilings.statCards.vatRefund')
              : undefined
          }
          variant={summary && summary.payableVat < 0 ? 'success' : 'destructive'}
        />
      </div>

      <FormCard title={t('taxFilings.detail.infoSection')}>
        <div className="space-y-1">
          <InfoRow
            label={t('taxFilings.detail.period')}
            value={<span className="capitalize">{period}</span>}
          />
          <InfoRow
            label={t('taxFilings.detail.status')}
            value={<TaxFilingStatusBadge status={filing.status} />}
          />
          <InfoRow
            label={t('taxFilings.detail.submissionType')}
            value={t(
              `taxFilings.submissionTypes.${filing.submissionType}`,
              filing.submissionType,
            )}
          />
          <InfoRow
            label={t('taxFilings.detail.createdDate')}
            value={formatDate(filing.createdAt)}
          />
          <InfoRow
            label={t('taxFilings.detail.submissionDate')}
            value={filing.submissionDate ? formatDate(filing.submissionDate) : '–'}
          />
        </div>
      </FormCard>

      <TaxFilingInvoiceTables
        issued={issuedInvoices}
        received={receivedInvoices}
      />
    </PageLayout>
  );
};

export default TaxFilingDetail;
