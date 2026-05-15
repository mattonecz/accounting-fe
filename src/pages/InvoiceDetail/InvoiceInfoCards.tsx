import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { InvoiceResponseDto } from '@/api/model';
import { InvoiceResponseDtoKind, InvoiceResponseDtoVatClaimStatus } from '@/api/model';
import { Lock } from 'lucide-react';
import { formatDate, formatCompanyAddress } from './utils';

interface InvoiceInfoCardsProps {
  invoice: InvoiceResponseDto;
}

export const InvoiceInfoCards = ({ invoice }: InvoiceInfoCardsProps) => {
  const { t } = useTranslation();
  const counterparty = invoice.contactSnapshot;
  const isReceived = invoice.type === 'RECEIVED';
  const bank = invoice.bankAccount;
  const hasBankInfo = !!bank?.name || !!bank?.number || !!bank?.iban || !!bank?.swift;
  const hasPaymentSymbols =
    !!invoice.variableSymbol || !!invoice.specificSymbol || !!invoice.konstantSymbol;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-3xl tracking-tight text-slate-900">
              {t('invoices.detail.invoice.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-base text-muted-foreground">
                  {t('invoices.fields.number')}
                </div>
                <div className="mt-1 text-xl font-semibold text-slate-900">
                  {invoice.number}
                </div>
              </div>
              {isReceived && invoice.originalNumber && (
                <div>
                  <div className="text-base text-muted-foreground">
                    {t('invoices.fields.originalNumber')}
                  </div>
                  <div className="mt-1 text-xl font-semibold text-slate-900">
                    {invoice.originalNumber}
                  </div>
                </div>
              )}
              <div>
                <div className="text-base text-muted-foreground">
                  {t('invoices.fields.createdDate')}
                </div>
                <div className="mt-1 text-xl font-semibold text-slate-900">
                  {formatDate(invoice.createdDate)}
                </div>
              </div>
              <div>
                <div className="text-base text-muted-foreground">{t('invoices.fields.dueDate')}</div>
                <div className="mt-1 text-xl font-semibold text-slate-900">
                  {formatDate(invoice.dueDate)}
                </div>
              </div>
              <div>
                <div className="text-base text-muted-foreground">
                  {t('invoices.fields.duzpDate')}
                </div>
                <div className="mt-1 text-xl font-semibold text-slate-900">
                  {formatDate(invoice.duzpDate)}
                </div>
              </div>
              <div>
                <div className="text-base text-muted-foreground">{t('invoices.fields.vatMode')}</div>
                <div className="mt-1 text-xl font-semibold text-slate-900">
                  {invoice.vatMode ? t(`invoices.vatModes.${invoice.vatMode}`) : '-'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-3xl tracking-tight text-slate-900">
              {isReceived
                ? t('invoices.fields.supplier')
                : t('invoices.fields.contact')}
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
                <div className="text-base text-muted-foreground">{t('contacts.fields.ico')}</div>
                <div className="mt-1 text-lg font-medium text-slate-900">
                  {counterparty?.ico || '-'}
                </div>
              </div>
              <div>
                <div className="text-base text-muted-foreground">{t('contacts.fields.dic')}</div>
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
              {t('invoices.detail.bank.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {hasBankInfo && (
              <div className="space-y-2">
                <div className="text-base font-medium text-slate-900">
                  {isReceived
                    ? t('invoices.detail.bank.supplierAccount')
                    : t('invoices.detail.bank.account')}
                </div>
                {bank?.name && (
                  <div>
                    <span className="text-muted-foreground">{t('invoices.detail.bank.name')}: </span>
                    <span className="text-slate-900">{bank.name}</span>
                  </div>
                )}
                {bank?.number && (
                  <div>
                    <span className="text-muted-foreground">{t('invoices.detail.bank.number')}: </span>
                    <span className="text-slate-900">{bank.number}</span>
                  </div>
                )}
                {bank?.iban && (
                  <div>
                    <span className="text-muted-foreground">{t('invoices.detail.bank.iban')}: </span>
                    <span className="text-slate-900">{bank.iban}</span>
                  </div>
                )}
                {bank?.swift && (
                  <div>
                    <span className="text-muted-foreground">{t('invoices.detail.bank.swift')}: </span>
                    <span className="text-slate-900">{bank.swift}</span>
                  </div>
                )}
              </div>
            )}
            {hasPaymentSymbols && (
              <div className="space-y-2">
                <div className="text-base font-medium text-slate-900">
                  {t('invoices.detail.symbols.title')}
                </div>
                {invoice.variableSymbol && (
                  <div>
                    <span className="text-muted-foreground">{t('invoices.detail.symbols.vs')}: </span>
                    <span className="text-slate-900">{invoice.variableSymbol}</span>
                  </div>
                )}
                {invoice.specificSymbol && (
                  <div>
                    <span className="text-muted-foreground">{t('invoices.detail.symbols.ss')}: </span>
                    <span className="text-slate-900">{invoice.specificSymbol}</span>
                  </div>
                )}
                {invoice.konstantSymbol && (
                  <div>
                    <span className="text-muted-foreground">{t('invoices.detail.symbols.ks')}: </span>
                    <span className="text-slate-900">{invoice.konstantSymbol}</span>
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
              {t('invoices.detail.notes.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {invoice.note && (
              <div>
                <div className="text-base text-muted-foreground">{t('invoices.detail.notes.note')}</div>
                <p className="mt-1 whitespace-pre-wrap text-slate-900">{invoice.note}</p>
              </div>
            )}
            {invoice.internalNote && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-center gap-2 text-base font-medium text-amber-900">
                  <Lock className="h-4 w-4" />
                  {t('invoices.detail.notes.internalNote')}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-amber-900">{invoice.internalNote}</p>
                <p className="mt-2 text-xs text-amber-700">
                  {t('invoices.detail.notes.internalNoteDisclaimer')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {invoice.vatClaimStatus &&
        (invoice.type === 'RECEIVED' || invoice.kind === InvoiceResponseDtoKind.SIMPLE) && (
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl tracking-tight text-slate-900">
                {t('invoices.vatClaim.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-base text-muted-foreground">
                  {t('invoices.vatClaim.statusLabel')}
                </span>
                <span
                  className={
                    invoice.vatClaimStatus === InvoiceResponseDtoVatClaimStatus.CLAIMED
                      ? 'rounded-full bg-green-100 px-3 py-0.5 text-sm font-medium text-green-800'
                      : invoice.vatClaimStatus === InvoiceResponseDtoVatClaimStatus.SKIPPED
                        ? 'rounded-full bg-slate-100 px-3 py-0.5 text-sm font-medium text-slate-600'
                        : 'rounded-full bg-amber-100 px-3 py-0.5 text-sm font-medium text-amber-800'
                  }
                >
                  {t(`invoices.vatClaim.status.${invoice.vatClaimStatus}`)}
                </span>
              </div>
              {invoice.vatClaimType && (
                <div>
                  <span className="text-base text-muted-foreground">
                    {t('invoices.vatClaim.claimType.label')}:{' '}
                  </span>
                  <span className="text-slate-900">
                    {t(`invoices.vatClaim.claimType.options.${invoice.vatClaimType}`)}
                    {invoice.vatClaimRatio != null &&
                      ` (${String(invoice.vatClaimRatio)})`}
                  </span>
                </div>
              )}
              {invoice.vatClaimMonth && (
                <div>
                  <span className="text-base text-muted-foreground">
                    {t('invoices.vatClaim.claimMonth.label')}:{' '}
                  </span>
                  <span className="text-slate-900">
                    {invoice.vatClaimMonth.slice(0, 7)}
                  </span>
                </div>
              )}
              {invoice.vatClaimStatus === InvoiceResponseDtoVatClaimStatus.CLAIMED &&
                invoice.vatClaimedAt && (
                  <div>
                    <span className="text-base text-muted-foreground">
                      {t('invoices.vatClaim.claimedAt')}:{' '}
                    </span>
                    <span className="text-slate-900">
                      {formatDate(invoice.vatClaimedAt)}
                    </span>
                  </div>
                )}
              {invoice.vatClaimNote != null && (
                <div>
                  <span className="text-base text-muted-foreground">
                    {t('invoices.vatClaim.note.label')}:{' '}
                  </span>
                  <span className="text-slate-900">
                    {String(invoice.vatClaimNote)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
    </div>
  );
};
