import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatMoney } from '@/lib/formatters';

interface VatExplanationCardProps {
  vysledekDPH: number;
  isFetching: boolean;
}

export const VatExplanationCard = ({
  vysledekDPH,
  isFetching,
}: VatExplanationCardProps) => {
  const { t, i18n } = useTranslation();

  return (
    <Card className="bg-muted/30">
      <CardHeader>
        <CardTitle>{t('taxReport.explanation.title')}</CardTitle>
        <CardDescription>
          {t('taxReport.explanation.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <div className="rounded-lg border bg-background p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('taxReport.explanation.vatDueLabel')}
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {formatMoney(Math.abs(vysledekDPH), 'CZK', i18n.language)}
          </div>
          <p className="mt-2">
            {vysledekDPH >= 0
              ? t('taxReport.explanation.vatDue')
              : t('taxReport.explanation.vatRefund')}
          </p>
        </div>

        <div className="space-y-2">
          <p>
            <strong>{t('taxReport.statCards.inputVat')}</strong>{' '}
            {t('taxReport.explanation.inputVatDesc')}
          </p>
          <p>
            <strong>{t('taxReport.statCards.outputVat')}</strong>{' '}
            {t('taxReport.explanation.outputVatDesc')}
          </p>
          <p>{t('taxReport.explanation.dataNote')}</p>
          {isFetching ? <p>{t('taxReport.explanation.updating')}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
};
