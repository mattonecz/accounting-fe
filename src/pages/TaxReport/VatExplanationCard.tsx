import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

interface VatExplanationCardProps {
  vysledekDPH: number;
  isFetching: boolean;
}

export const VatExplanationCard = ({
  vysledekDPH,
  isFetching,
}: VatExplanationCardProps) => (
  <Card className="bg-muted/30">
    <CardHeader>
      <CardTitle>Co z toho plyne</CardTitle>
      <CardDescription>
        Zjednodušené doklady jsou vedené jako přijaté nákladové doklady a
        vstupují do odpočtu DPH.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4 text-sm text-muted-foreground">
      <div className="rounded-lg border bg-background p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          DPH k úhradě / odpočtu
        </div>
        <div className="mt-2 text-2xl font-bold text-foreground">
          {formatCurrency(Math.abs(vysledekDPH))}
        </div>
        <p className="mt-2">
          {vysledekDPH >= 0
            ? 'Za zvolené období vychází závazek vůči finančnímu úřadu.'
            : 'Za zvolené období vychází nárok na odpočet DPH.'}
        </p>
      </div>

      <div className="space-y-2">
        <p>
          <strong>DPH na vstupu</strong> představuje odpočet z přijatých faktur
          a ze zjednodušených nákladových dokladů.
        </p>
        <p>
          <strong>DPH na výstupu</strong> obsahuje DPH pouze z vydaných faktur.
        </p>
        <p>
          Přehled pracuje s měsíčními souhrny z backendových endpointů, takže
          odpovídá skutečným účetním datům a neobsahuje žádná smyšlená čísla.
        </p>
        {isFetching ? <p>Probíhá aktualizace dat…</p> : null}
      </div>
    </CardContent>
  </Card>
);
