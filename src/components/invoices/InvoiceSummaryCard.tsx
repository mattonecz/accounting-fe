import { UseFormReturn } from 'react-hook-form';
import { CreateInvoiceDto } from '@/api/model';
import { FormCard } from '@/components/FormCard';

interface InvoiceSummaryCardProps {
  form: UseFormReturn<CreateInvoiceDto>;
  formatMoney: (value?: number) => string;
  isVatPayer: boolean;
}

export const InvoiceSummaryCard = ({
  form,
  formatMoney,
  isVatPayer,
}: InvoiceSummaryCardProps) => {
  const items = form.watch('items') ?? [];

  const total = items.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0,
  );
  const totalTax = isVatPayer
    ? items.reduce((sum, item) => {
        const base = (item.quantity || 0) * (item.unitPrice || 0);
        return sum + base * ((item.vatRate || 0) / 100);
      }, 0)
    : 0;
  const totalWithTax = total + totalTax;

  return (
    <FormCard title="Souhrn faktury">
      <div
        className={`grid grid-cols-1 gap-4 ${
          isVatPayer ? 'md:grid-cols-3' : 'md:grid-cols-1'
        }`}
      >
        <div>
          <p className="text-sm text-muted-foreground">
            {isVatPayer ? 'Mezisoučet' : 'Částka celkem'}
          </p>
          <p className="text-2xl font-bold">{formatMoney(total)}</p>
        </div>
        {isVatPayer && (
          <>
            <div>
              <p className="text-sm text-muted-foreground">DPH celkem</p>
              <p className="text-2xl font-bold">{formatMoney(totalTax)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Částka celkem</p>
              <p className="text-2xl font-bold">{formatMoney(totalWithTax)}</p>
            </div>
          </>
        )}
      </div>
    </FormCard>
  );
};
