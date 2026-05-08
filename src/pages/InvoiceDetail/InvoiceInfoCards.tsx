import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type InvoiceResponseDto,
  InvoiceResponseDtoVatMode,
} from '@/api/model';
import { Lock } from 'lucide-react';
import { formatDate, formatCompanyAddress } from './utils';

interface InvoiceInfoCardsProps {
  invoice: InvoiceResponseDto;
}

const VAT_MODE_LABELS: Record<InvoiceResponseDtoVatMode, string> = {
  STANDARD: 'Standardní',
  NON_VAT_PAYER: 'Neplátce DPH',
  REVERSE_CHARGE: 'Přenesená daňová povinnost',
};

export const InvoiceInfoCards = ({ invoice }: InvoiceInfoCardsProps) => {
  const counterparty = invoice.contactSnapshot;
  const isReceived = invoice.type === 'RECEIVED';
  const bank = invoice.bankAccount;
  const hasBankInfo =
    !!bank?.name || !!bank?.number || !!bank?.iban || !!bank?.swift;
  const hasPaymentSymbols =
    !!invoice.variableSymbol ||
    !!invoice.specificSymbol ||
    !!invoice.konstantSymbol;

  return (
    <div className="space-y-4">
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
              {isReceived && invoice.originalNumber && (
                <div>
                  <div className="text-base text-muted-foreground">
                    Číslo dodavatele
                  </div>
                  <div className="mt-1 text-xl font-semibold text-slate-900">
                    {invoice.originalNumber}
                  </div>
                </div>
              )}
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
                  {formatDate(invoice.duzpDate)}
                </div>
              </div>
              <div>
                <div className="text-base text-muted-foreground">Režim DPH</div>
                <div className="mt-1 text-xl font-semibold text-slate-900">
                  {VAT_MODE_LABELS[invoice.vatMode] ?? invoice.vatMode}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-3xl tracking-tight text-slate-900">
              {isReceived ? 'Dodavatel' : 'Odběratel'}
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

      {(hasBankInfo || hasPaymentSymbols) && (
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight text-slate-900">
              Platební údaje
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {hasBankInfo && (
              <div className="space-y-2">
                <div className="text-base font-medium text-slate-900">
                  {isReceived ? 'Bankovní účet dodavatele' : 'Bankovní účet'}
                </div>
                {bank?.name && (
                  <div>
                    <span className="text-muted-foreground">Banka: </span>
                    <span className="text-slate-900">{bank.name}</span>
                  </div>
                )}
                {bank?.number && (
                  <div>
                    <span className="text-muted-foreground">Číslo účtu: </span>
                    <span className="text-slate-900">{bank.number}</span>
                  </div>
                )}
                {bank?.iban && (
                  <div>
                    <span className="text-muted-foreground">IBAN: </span>
                    <span className="text-slate-900">{bank.iban}</span>
                  </div>
                )}
                {bank?.swift && (
                  <div>
                    <span className="text-muted-foreground">SWIFT: </span>
                    <span className="text-slate-900">{bank.swift}</span>
                  </div>
                )}
              </div>
            )}
            {hasPaymentSymbols && (
              <div className="space-y-2">
                <div className="text-base font-medium text-slate-900">
                  Platební symboly
                </div>
                {invoice.variableSymbol && (
                  <div>
                    <span className="text-muted-foreground">VS: </span>
                    <span className="text-slate-900">
                      {invoice.variableSymbol}
                    </span>
                  </div>
                )}
                {invoice.specificSymbol && (
                  <div>
                    <span className="text-muted-foreground">SS: </span>
                    <span className="text-slate-900">
                      {invoice.specificSymbol}
                    </span>
                  </div>
                )}
                {invoice.konstantSymbol && (
                  <div>
                    <span className="text-muted-foreground">KS: </span>
                    <span className="text-slate-900">
                      {invoice.konstantSymbol}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {(invoice.note || invoice.internalNote) && (
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight text-slate-900">
              Poznámky
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {invoice.note && (
              <div>
                <div className="text-base text-muted-foreground">Poznámka</div>
                <p className="mt-1 whitespace-pre-wrap text-slate-900">
                  {invoice.note}
                </p>
              </div>
            )}
            {invoice.internalNote && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-center gap-2 text-base font-medium text-amber-900">
                  <Lock className="h-4 w-4" />
                  Interní poznámka
                </div>
                <p className="mt-1 whitespace-pre-wrap text-amber-900">
                  {invoice.internalNote}
                </p>
                <p className="mt-2 text-xs text-amber-700">
                  Není viditelná pro protistranu.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
