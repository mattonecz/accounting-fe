import { useTranslation } from 'react-i18next';
import type { InvoiceResponseDto } from '@/api/model';
import {
  InvoiceResponseDtoKind,
  InvoiceResponseDtoVatClaimStatus,
} from '@/api/model';
import { Lock } from 'lucide-react';
import { isInvoiceLocked } from '@/lib/invoiceLock';
import { cn } from '@/lib/utils';
import { DetailCard, MetaField, SectionLabel } from './primitives';
import { formatDate, formatCompanyAddress } from './utils';

interface InvoiceInfoCardsProps {
  invoice: InvoiceResponseDto;
}

export const InvoiceInfoCards = ({ invoice }: InvoiceInfoCardsProps) => {
  const { t } = useTranslation();
  // "Claimed" is no longer stored: a document the user wants to deduct that
  // already sits in an active VAT filing is shown as included in it.
  const claimDisplay =
    invoice.vatClaimStatus === InvoiceResponseDtoVatClaimStatus.PENDING &&
    isInvoiceLocked(invoice)
      ? 'IN_FILING'
      : invoice.vatClaimStatus;
  const counterparty = invoice.contactSnapshot;
  const isReceived = invoice.type === 'RECEIVED';
  const addressLines = formatCompanyAddress(counterparty);

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <DetailCard>
          <SectionLabel className="mb-4">
            {t('invoices.detail.invoice.title')}
          </SectionLabel>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <MetaField
              label={t('invoices.fields.number')}
              value={invoice.number}
              mono
            />
            {isReceived && invoice.originalNumber && (
              <MetaField
                label={t('invoices.fields.originalNumber')}
                value={invoice.originalNumber}
                mono
              />
            )}
            <MetaField
              label={t('invoices.fields.createdDate')}
              value={formatDate(invoice.createdDate)}
              mono
            />
            <MetaField
              label={t('invoices.fields.dueDate')}
              value={formatDate(invoice.dueDate)}
              mono
            />
            <MetaField
              label={t('invoices.fields.duzpDate')}
              value={formatDate(invoice.duzpDate)}
              mono
            />
            <MetaField
              label={t('invoices.fields.vatMode')}
              value={
                invoice.vatMode
                  ? t(`invoices.vatModes.${invoice.vatMode}`)
                  : '-'
              }
            />
          </div>
        </DetailCard>

        <DetailCard>
          <SectionLabel className="mb-4">
            {isReceived
              ? t('invoices.fields.supplier')
              : t('invoices.fields.contact')}
          </SectionLabel>
          <div className="mb-4 text-base font-semibold tracking-tight text-foreground">
            {counterparty?.name || '-'}
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <MetaField
              label={t('contacts.fields.ico')}
              value={counterparty?.ico}
              mono
            />
            <MetaField
              label={t('contacts.fields.dic')}
              value={counterparty?.dic}
              mono
            />
          </div>
          {addressLines.length > 0 && (
            <div className="mt-4 space-y-0.5 text-sm leading-relaxed text-muted-foreground">
              {addressLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          )}
        </DetailCard>
      </div>

      {(invoice.note || invoice.internalNote) && (
        <DetailCard>
          <SectionLabel className="mb-4">
            {t('invoices.detail.notes.title')}
          </SectionLabel>
          <div className="space-y-4">
            {invoice.note && (
              <div>
                <div className="text-[11px] text-muted-foreground">
                  {t('invoices.detail.notes.note')}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                  {invoice.note}
                </p>
              </div>
            )}
            {invoice.internalNote && (
              <div className="rounded-lg border border-warning/30 bg-warning/10 p-3.5">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-warning">
                  <Lock className="h-3.5 w-3.5" />
                  {t('invoices.detail.notes.internalNote')}
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground">
                  {invoice.internalNote}
                </p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {t('invoices.detail.notes.internalNoteDisclaimer')}
                </p>
              </div>
            )}
          </div>
        </DetailCard>
      )}

      {invoice.vatClaimStatus &&
        (invoice.type === 'RECEIVED' ||
          invoice.kind === InvoiceResponseDtoKind.SIMPLE) && (
          <DetailCard>
            <SectionLabel className="mb-4">
              {t('invoices.vatClaim.title')}
            </SectionLabel>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-muted-foreground">
                  {t('invoices.vatClaim.statusLabel')}
                </span>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-medium',
                    claimDisplay === 'IN_FILING' &&
                      'bg-success/15 text-success',
                    claimDisplay === InvoiceResponseDtoVatClaimStatus.SKIPPED &&
                      'bg-muted text-muted-foreground',
                    claimDisplay === InvoiceResponseDtoVatClaimStatus.PENDING &&
                      'bg-warning/15 text-warning',
                  )}
                >
                  {t(`invoices.vatClaim.status.${claimDisplay}`)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {invoice.vatClaimType && (
                  <MetaField
                    label={t('invoices.vatClaim.claimType.label')}
                    value={
                      <>
                        {t(
                          `invoices.vatClaim.claimType.options.${invoice.vatClaimType}`,
                        )}
                        {invoice.vatClaimRatio != null &&
                          ` (${String(invoice.vatClaimRatio)})`}
                      </>
                    }
                  />
                )}
                {invoice.vatClaimMonth && (
                  <MetaField
                    label={t('invoices.vatClaim.claimMonth.label')}
                    value={invoice.vatClaimMonth.slice(0, 7)}
                    mono
                  />
                )}
                {invoice.vatClaimNote != null && (
                  <MetaField
                    label={t('invoices.vatClaim.note.label')}
                    value={String(invoice.vatClaimNote)}
                  />
                )}
              </div>
            </div>
          </DetailCard>
        )}
    </>
  );
};
