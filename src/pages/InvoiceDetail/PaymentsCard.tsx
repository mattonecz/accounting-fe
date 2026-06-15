import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Landmark } from 'lucide-react';
import type { InvoiceResponseDto, PaymentResponseDto } from '@/api/model';
import { RecordPaymentDialog } from '@/components/RecordPaymentDialog';
import { DetailCard, MetaField, SectionLabel } from './primitives';
import { formatDate, formatMoney, getPaymentMethodLabel } from './utils';

interface PaymentsCardProps {
  invoice: InvoiceResponseDto;
  payments: PaymentResponseDto[];
  currency: string;
}

export const PaymentsCard = ({
  invoice,
  payments,
  currency,
}: PaymentsCardProps) => {
  const { t } = useTranslation();
  const [recordOpen, setRecordOpen] = useState(false);

  const isReceived = invoice.type === 'RECEIVED';
  const bank = invoice.bankSnapshot;
  const bankAccount = bank?.number || bank?.name;
  const hasPaymentDetails =
    !!bankAccount ||
    !!bank?.iban ||
    !!bank?.swift ||
    !!invoice.variableSymbol ||
    !!invoice.specificSymbol ||
    !!invoice.konstantSymbol;

  return (
    <DetailCard>
      <SectionLabel className="mb-4">
        {t('invoices.detail.payments.title')}
      </SectionLabel>

      {hasPaymentDetails && (
        <div className="mb-5 grid gap-x-6 gap-y-4 border-b border-dashed border-border pb-5 sm:grid-cols-2 lg:grid-cols-4">
          {bankAccount && (
            <MetaField
              label={
                isReceived
                  ? t('invoices.detail.bank.supplierAccount')
                  : t('invoices.detail.bank.account')
              }
              value={bankAccount}
              sub={bank?.number ? bank?.name : undefined}
              mono
            />
          )}
          {bank?.iban && (
            <MetaField
              label={t('invoices.detail.bank.iban')}
              value={bank.iban}
              mono
            />
          )}
          {bank?.swift && (
            <MetaField
              label={t('invoices.detail.bank.swift')}
              value={bank.swift}
              mono
            />
          )}
          {invoice.variableSymbol && (
            <MetaField
              label={t('invoices.fields.variableSymbol')}
              value={invoice.variableSymbol}
              mono
            />
          )}
          {invoice.specificSymbol && (
            <MetaField
              label={t('invoices.fields.specificSymbol')}
              value={invoice.specificSymbol}
              mono
            />
          )}
          {invoice.konstantSymbol && (
            <MetaField
              label={t('invoices.fields.konstantSymbol')}
              value={invoice.konstantSymbol}
              mono
            />
          )}
        </div>
      )}

      <div className="mb-3.5 flex items-center justify-between">
        <SectionLabel>{t('invoices.detail.payments.received')}</SectionLabel>
        <button
          type="button"
          onClick={() => setRecordOpen(true)}
          className="text-xs font-medium text-brand transition-colors hover:text-brand/80"
        >
          + {t('invoices.detail.payments.add')}
        </button>
      </div>

      {!payments.length ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {t('invoices.detail.payments.empty')}
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 rounded-lg border border-border/70 px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="font-medium tabular-nums text-foreground">
                  {formatDate(payment.paymentDate)}
                </span>
                <span className="text-muted-foreground/50">·</span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Landmark className="h-3.5 w-3.5" />
                  {getPaymentMethodLabel(payment.paymentMethod)}
                </span>
                {payment.reference && (
                  <>
                    <span className="text-muted-foreground/50">·</span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {payment.reference}
                    </span>
                  </>
                )}
              </div>
              <span className="text-sm font-semibold tabular-nums text-success">
                {formatMoney(payment.amount, payment.currency || currency)}
              </span>
            </div>
          ))}
        </div>
      )}

      <RecordPaymentDialog
        invoice={invoice}
        hideTrigger
        open={recordOpen}
        onOpenChange={setRecordOpen}
      />
    </DetailCard>
  );
};
