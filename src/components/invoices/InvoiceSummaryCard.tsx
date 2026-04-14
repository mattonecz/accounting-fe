import { UseFormReturn } from 'react-hook-form';
import { CreateInvoiceDto } from '@/api/model';
import { FormCard } from '@/components/FormCard';

interface InvoiceSummaryCardProps {
  form: UseFormReturn<CreateInvoiceDto>;
  formatMoney: (value?: number) => string;
}

const SUMMARY_FIELDS = [
  { key: 'total' as const, label: 'Mezisoučet' },
  { key: 'totalTax' as const, label: 'DPH celkem' },
  { key: 'totalWithTax' as const, label: 'Částka celkem' },
];

export const InvoiceSummaryCard = ({
  form,
  formatMoney,
}: InvoiceSummaryCardProps) => (
  <FormCard title="Souhrn faktury">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {SUMMARY_FIELDS.map(({ key, label }) => (
        <div key={key}>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{formatMoney(form.watch(key))}</p>
        </div>
      ))}
    </div>
  </FormCard>
);
