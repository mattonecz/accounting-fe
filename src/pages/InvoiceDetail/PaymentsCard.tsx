import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Landmark } from 'lucide-react';
import type { PaymentResponseDto } from '@/api/model';
import { formatDate, formatMoney, getPaymentMethodLabel } from './utils';

interface PaymentsCardProps {
  payments: PaymentResponseDto[];
  currency: string;
}

export const PaymentsCard = ({ payments, currency }: PaymentsCardProps) => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t('invoices.detail.payments.heading', { count: payments.length })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!payments.length ? (
          <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
            {t('invoices.detail.payments.empty')}
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4 text-base"
              >
                <span className="font-medium text-slate-900">
                  {formatDate(payment.paymentDate)}
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <Landmark className="h-4 w-4" />
                  {getPaymentMethodLabel(payment.paymentMethod)}
                </span>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-slate-900">
                  {formatMoney(payment.amount, payment.currency || currency)}
                </span>
                {payment.reference ? (
                  <span className="text-sm text-muted-foreground">
                    ({payment.reference})
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
