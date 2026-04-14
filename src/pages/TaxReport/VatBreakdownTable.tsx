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
import { months } from './MonthSelector';

type VatTotals = {
  base: number;
  vat: number;
  total: number;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

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
}: VatBreakdownTableProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Rozpad DPH za vybrané období</CardTitle>
      <CardDescription>
        Data jsou načtena podle data zdanitelného plnění za měsíc{' '}
        {months[selectedMonth]} {selectedYear}.
      </CardDescription>
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Načítám přehled DPH…
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          Nepodařilo se načíst podklady pro přehled DPH. Zkuste načtení
          zopakovat.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Typ dokladu</TableHead>
                <TableHead className="text-right">Základ</TableHead>
                <TableHead className="text-right">DPH</TableHead>
                <TableHead className="text-right">Celkem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Vydané faktury</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(vydaneFaktury.base)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(vydaneFaktury.vat)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(vydaneFaktury.total)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Přijaté faktury</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(prijateFaktury.base)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(prijateFaktury.vat)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(prijateFaktury.total)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">
                  Zjednodušené doklady
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(zjednoduseneDoklady.base)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(zjednoduseneDoklady.vat)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(zjednoduseneDoklady.total)}
                </TableCell>
              </TableRow>
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell>Součet na vstupu</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(zakladNaVstupu)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(vstupniDPH)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(obratNaVstupu)}
                </TableCell>
              </TableRow>
              <TableRow className="bg-muted/30 font-semibold">
                <TableCell>Součet na výstupu</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(zakladNaVystupu)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(vystupniDPH)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(obratNaVystupu)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </CardContent>
  </Card>
);
