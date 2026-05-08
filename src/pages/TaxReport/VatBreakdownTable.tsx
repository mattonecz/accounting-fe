import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatMoney } from '@/lib/formatters';

type VatTotals = {
  base: number;
  vat: number;
  total: number;
};

interface VatBreakdownTableProps {
  vydaneFaktury: VatTotals;
  prijateFaktury: VatTotals;
  zjednoduseneDoklady: VatTotals;
  vstupniDPH: number;
  vystupniDPH: number;
  zakladNaVstupu: number;
  zakladNaVystupu: number;
  obratNaVstupu: number;
  obratNaVystupu: number;
  selectedMonth: number;
  selectedYear: number;
  isLoading: boolean;
  isError: boolean;
}

export const VatBreakdownTable = ({
  vydaneFaktury,
  prijateFaktury,
  zjednoduseneDoklady,
  vstupniDPH,
  vystupniDPH,
  zakladNaVstupu,
  zakladNaVystupu,
  obratNaVstupu,
  obratNaVystupu,
  selectedMonth,
  selectedYear,
  isLoading,
  isError,
}: VatBreakdownTableProps) => {
  const { t, i18n } = useTranslation();
  const monthName = t(`taxReport.months.${selectedMonth}`);
  const fmt = (n: number) => formatMoney(n, 'CZK', i18n.language);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('taxReport.breakdown.title')}</CardTitle>
        <CardDescription>
          {t('taxReport.breakdown.description', { month: monthName, year: selectedYear })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            {t('taxReport.breakdown.loading')}
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            {t('taxReport.breakdown.error')}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('taxReport.breakdown.columns.type')}</TableHead>
                  <TableHead className="text-right">{t('taxReport.breakdown.columns.base')}</TableHead>
                  <TableHead className="text-right">{t('taxReport.breakdown.columns.vat')}</TableHead>
                  <TableHead className="text-right">{t('taxReport.breakdown.columns.total')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">{t('taxReport.breakdown.rows.issued')}</TableCell>
                  <TableCell className="text-right">{fmt(vydaneFaktury.base)}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(vydaneFaktury.vat)}</TableCell>
                  <TableCell className="text-right">{fmt(vydaneFaktury.total)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">{t('taxReport.breakdown.rows.received')}</TableCell>
                  <TableCell className="text-right">{fmt(prijateFaktury.base)}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(prijateFaktury.vat)}</TableCell>
                  <TableCell className="text-right">{fmt(prijateFaktury.total)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">{t('taxReport.breakdown.rows.simple')}</TableCell>
                  <TableCell className="text-right">{fmt(zjednoduseneDoklady.base)}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(zjednoduseneDoklady.vat)}</TableCell>
                  <TableCell className="text-right">{fmt(zjednoduseneDoklady.total)}</TableCell>
                </TableRow>
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell>{t('taxReport.breakdown.rows.inputTotal')}</TableCell>
                  <TableCell className="text-right">{fmt(zakladNaVstupu)}</TableCell>
                  <TableCell className="text-right">{fmt(vstupniDPH)}</TableCell>
                  <TableCell className="text-right">{fmt(obratNaVstupu)}</TableCell>
                </TableRow>
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell>{t('taxReport.breakdown.rows.outputTotal')}</TableCell>
                  <TableCell className="text-right">{fmt(zakladNaVystupu)}</TableCell>
                  <TableCell className="text-right">{fmt(vystupniDPH)}</TableCell>
                  <TableCell className="text-right">{fmt(obratNaVystupu)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
