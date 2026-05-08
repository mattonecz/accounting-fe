import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormCard } from '@/components/FormCard';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Plus, Trash2 } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { FieldArrayWithId } from 'react-hook-form';
import type { UpdateInvoiceDto } from '@/api/model';
import { toNumber } from './useUpdateInvoiceForm';

interface UpdateItemsCardProps {
  form: UseFormReturn<UpdateInvoiceDto>;
  fields: FieldArrayWithId<UpdateInvoiceDto, 'items', 'id'>[];
  formatMoney: (value?: number) => string;
  calculateInvoiceTotals: () => void;
  addItem: () => void;
  removeItem: (index: number) => void;
  isVatPayer: boolean;
}

export const UpdateItemsCard = ({
  form,
  fields,
  formatMoney,
  calculateInvoiceTotals,
  addItem,
  removeItem,
  isVatPayer,
}: UpdateItemsCardProps) => (
  <FormCard
    title="Položky faktury"
    actions={
      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        <Plus className="mr-2 h-4 w-4" />
        Přidat položku
      </Button>
    }
  >
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b pb-2">
        <span className="w-8 text-sm font-medium text-muted-foreground">#</span>
        <span className="flex-1 text-sm font-medium text-muted-foreground">
          Popis
        </span>
        <span className="w-24 text-sm font-medium text-muted-foreground">
          Množství
        </span>
        <span className="w-32 text-sm font-medium text-muted-foreground">
          Cena
        </span>
        {isVatPayer && (
          <span className="w-24 text-sm font-medium text-muted-foreground">
            DPH %
          </span>
        )}
        <span className="w-32 text-sm font-medium text-muted-foreground">
          Celkem
        </span>
        <span className="w-10"></span>
      </div>

      {fields.map((field, index) => (
        <div key={field.id} className="flex items-center gap-2">
          <span className="w-8 text-sm font-medium">{index + 1}.</span>

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
            name={`items.${index}.quantity`}
            rules={{
              required: 'Množství je povinné',
              min: { value: 0, message: 'Množství musí být ≥ 0' },
            }}
            render={({ field }) => (
              <FormItem className="w-24">
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value ?? 0}
                    onChange={(e) => {
                      field.onChange(toNumber(e.target.value));
                      calculateInvoiceTotals();
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`items.${index}.unitPrice`}
            rules={{
              required: 'Cena je povinná',
              min: { value: 0, message: 'Cena musí být ≥ 0' },
            }}
            render={({ field }) => (
              <FormItem className="w-32">
                <FormControl>
                  <Input
                    type="number"
                    step="1"
                    {...field}
                    value={field.value ?? 0}
                    onChange={(e) => {
                      field.onChange(toNumber(e.target.value));
                      calculateInvoiceTotals();
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isVatPayer && (
            <FormField
              control={form.control}
              name={`items.${index}.vatRate`}
              rules={{
                min: { value: 0, message: 'DPH musí být ≥ 0' },
                max: { value: 100, message: 'DPH musí být ≤ 100' },
              }}
              render={({ field }) => (
                <FormItem className="w-24">
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) => {
                        field.onChange(toNumber(e.target.value));
                        calculateInvoiceTotals();
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="w-32">
            <p className="font-medium">
              {formatMoney(
                toNumber(form.watch(`items.${index}.quantity`)) *
                  toNumber(form.watch(`items.${index}.unitPrice`)) *
                  (1 +
                    (isVatPayer
                      ? toNumber(form.watch(`items.${index}.vatRate`)) / 100
                      : 0)),
              )}
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              removeItem(index);
              calculateInvoiceTotals();
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
