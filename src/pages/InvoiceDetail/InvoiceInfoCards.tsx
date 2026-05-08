import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { InvoiceResponseDto } from '@/api/model';
import { formatDate, formatCompanyAddress } from './utils';

interface InvoiceInfoCardsProps {
  invoice: InvoiceResponseDto;
}

export const InvoiceInfoCards = ({ invoice }: InvoiceInfoCardsProps) => {
  const counterparty = invoice.contactSnapshot;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-3xl tracking-tight text-slate-900">
            Faktura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-base text-muted-foreground">
                Číslo faktury
              </div>
              <div className="mt-1 text-xl font-semibold text-slate-900">
                {invoice.number}
              </div>
            </div>
            <div>
              <div className="text-base text-muted-foreground">
                Datum vystavení
              </div>
              <div className="mt-1 text-xl font-semibold text-slate-900">
                {formatDate(invoice.createdDate)}
              </div>
            </div>
            <div>
              <div className="text-base text-muted-foreground">Splatnost</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">
                {formatDate(invoice.dueDate)}
              </div>
            </div>
            <div>
              <div className="text-base text-muted-foreground">
                Datum plnění
              </div>
              <div className="mt-1 text-xl font-semibold text-slate-900">
                {formatDate(invoice.taxDate)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-3xl tracking-tight text-slate-900">
            Odběratel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-base">
          <div>
            <div className="text-3xl font-semibold tracking-tight text-slate-900">
              {counterparty?.name || '-'}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="text-base text-muted-foreground">IČO</div>
              <div className="mt-1 text-lg font-medium text-slate-900">
                {counterparty?.ico || '-'}
              </div>
            </div>
            <div>
              <div className="text-base text-muted-foreground">DIČ</div>
              <div className="mt-1 text-lg font-medium text-slate-900">
                {counterparty?.dic || '-'}
              </div>
            </div>
          </div>
          <div className="space-y-1 text-base text-muted-foreground">
            {formatCompanyAddress(counterparty).length ? (
              formatCompanyAddress(counterparty).map((line) => (
                <div key={line}>{line}</div>
              ))
            ) : (
              <div>-</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
