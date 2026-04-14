import { UseFormReturn, UseFieldArrayReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { FormCard } from '@/components/FormCard';
import { Plus, Trash2 } from 'lucide-react';
import { CreateInvoiceDto } from '@/api/model';

interface InvoiceItemsCardProps {
  form: UseFormReturn<CreateInvoiceDto>;
  fieldArray: UseFieldArrayReturn<CreateInvoiceDto, 'items'>;
  formatMoney: (value?: number) => string;
  onRecalculate: () => void;
}

const COLUMN_HEADERS = [
  { label: '#', className: 'w-8' },
  { label: 'Popis', className: 'flex-1' },
  { label: 'Množství', className: 'w-24' },
  { label: 'Cena', className: 'w-32' },
  { label: 'DPH %', className: 'w-24' },
  { label: 'Celkem', className: 'w-32' },
  { label: '', className: 'w-10' },
];

const DEFAULT_ITEM = { name: '', amount: 1, pricePerUnit: 0, vat: 21, units: 1 };

export const InvoiceItemsCard = ({
  form,
  fieldArray,
  formatMoney,
  onRecalculate,
}: InvoiceItemsCardProps) => {
  const { fields, append, remove } = fieldArray;

  const handleNumericChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldOnChange: (value: number) => void,
  ) => {
    fieldOnChange(parseFloat(e.target.value) || 0);
    onRecalculate();
  };

  return (
    <FormCard
      title="Položky faktury"
      actions={
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append(DEFAULT_ITEM)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Přidat položku
        </Button>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b">
          {COLUMN_HEADERS.map((col, i) => (
            <span
              key={i}
              className={`${col.className} text-sm font-medium text-muted-foreground`}
            >
              {col.label}
            </span>
          ))}
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <span className="text-sm font-medium w-8">{index + 1}.</span>

            <FormField
              control={form.control}
              name={`items.${index}.name`}
              rules={{ required: 'Popis je povinný' }}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="Popis položky" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`items.${index}.amount`}
              rules={{
                required: 'Množství je povinné',
                min: { value: 0.01, message: 'Množství musí být větší než 0' },
              }}
              render={({ field }) => (
                <FormItem className="w-24">
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => handleNumericChange(e, field.onChange)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`items.${index}.pricePerUnit`}
              rules={{
                required: 'Cena je povinná',
                min: { value: 0.01, message: 'Cena musí být větší než 0' },
              }}
              render={({ field }) => (
                <FormItem className="w-32">
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      {...field}
                      onChange={(e) => handleNumericChange(e, field.onChange)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`items.${index}.vat`}
              render={({ field }) => (
                <FormItem className="w-24">
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      {...field}
                      onChange={(e) => handleNumericChange(e, field.onChange)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="w-32">
              <p className="font-medium">
                {formatMoney(
                  (form.watch(`items.${index}.amount`) || 0) *
                    (form.watch(`items.${index}.pricePerUnit`) || 0) *
                    (1 + (form.watch(`items.${index}.vat`) || 0) / 100),
                )}
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                remove(index);
                onRecalculate();
              }}
              disabled={fields.length === 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </FormCard>
  );
};
