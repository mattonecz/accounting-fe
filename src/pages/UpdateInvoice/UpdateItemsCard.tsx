import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { toNumber, type UpdateInvoiceFormValues } from './useUpdateInvoiceForm';

interface UpdateItemsCardProps {
  form: UseFormReturn<UpdateInvoiceFormValues>;
  fields: FieldArrayWithId<UpdateInvoiceFormValues, 'items', 'id'>[];
  calculateInvoiceTotals: () => void;
  addItem: () => void;
  removeItem: (index: number) => void;
  isVatPayer: boolean;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

interface UpdateItemRowProps {
  form: UseFormReturn<UpdateInvoiceFormValues>;
  index: number;
  isVatPayer: boolean;
  calculateInvoiceTotals: () => void;
  onRemove: () => void;
  canRemove: boolean;
}

const UpdateItemRow = ({
  form,
  index,
  isVatPayer,
  calculateInvoiceTotals,
  onRemove,
  canRemove,
}: UpdateItemRowProps) => {
  const { t } = useTranslation();
  // Raw text while the user edits the total directly; null means "derive it".
  const [totalDraft, setTotalDraft] = useState<string | null>(null);

  const quantity = toNumber(form.watch(`items.${index}.quantity`));
  const unitPrice = toNumber(form.watch(`items.${index}.unitPrice`));
  const vatRate = isVatPayer ? toNumber(form.watch(`items.${index}.vatRate`)) : 0;
  const computedTotal = quantity * unitPrice * (1 + vatRate / 100);

  // User typed a final (VAT-inclusive) total → back-calculate the unit price
  // (price without VAT) using the currently selected VAT rate.
  const handleTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setTotalDraft(raw);
    const newTotal = parseFloat(raw) || 0;
    const divisor = quantity * (1 + vatRate / 100);
    const newUnitPrice = divisor > 0 ? round2(newTotal / divisor) : 0;
    form.setValue(`items.${index}.unitPrice`, newUnitPrice);
    calculateInvoiceTotals();
  };

  const totalValue =
    totalDraft ?? (computedTotal ? round2(computedTotal).toString() : '0');

  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-sm font-medium">{index + 1}.</span>

      <FormField
        control={form.control}
        name={`items.${index}.name`}
        rules={{ required: t('invoices.items.validation.descriptionRequired') }}
        render={({ field }) => (
          <FormItem className="flex-1">
            <FormControl>
              <Input placeholder={t('invoices.placeholders.itemDescription')} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`items.${index}.quantity`}
        rules={{
          required: t('invoices.items.validation.quantityRequired'),
          min: { value: 0, message: t('validation.minZero') },
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
          required: t('invoices.items.validation.priceRequired'),
          min: { value: 0, message: t('validation.minZero') },
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
            min: { value: 0, message: t('validation.minZero') },
            max: { value: 100, message: t('validation.maxN', { max: 100 }) },
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

      <FormItem className="w-32">
        <FormControl>
          <Input
            type="number"
            step="1"
            value={totalValue}
            onChange={handleTotalChange}
            onBlur={() => setTotalDraft(null)}
          />
        </FormControl>
      </FormItem>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        disabled={!canRemove}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export const UpdateItemsCard = ({
  form,
  fields,
  calculateInvoiceTotals,
  addItem,
  removeItem,
  isVatPayer,
}: UpdateItemsCardProps) => {
  const { t } = useTranslation();

  return (
    <FormCard
      title={t('invoices.sections.items')}
      actions={
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="mr-2 h-4 w-4" />
          {t('invoices.items.addItem')}
        </Button>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b pb-2">
          <span className="w-8 text-sm font-medium text-muted-foreground">#</span>
          <span className="flex-1 text-sm font-medium text-muted-foreground">
            {t('invoices.items.columns.description')}
          </span>
          <span className="w-24 text-sm font-medium text-muted-foreground">
            {t('invoices.fields.quantity')}
          </span>
          <span className="w-32 text-sm font-medium text-muted-foreground">
            {t('invoices.fields.unitPrice')}
          </span>
          {isVatPayer && (
            <span className="w-24 text-sm font-medium text-muted-foreground">
              {t('invoices.items.columns.vatRatePct')}
            </span>
          )}
          <span className="w-32 text-sm font-medium text-muted-foreground">
            {t('invoices.summary.total')}
          </span>
          <span className="w-10"></span>
        </div>

        {fields.map((field, index) => (
          <UpdateItemRow
            key={field.id}
            form={form}
            index={index}
            isVatPayer={isVatPayer}
            calculateInvoiceTotals={calculateInvoiceTotals}
            onRemove={() => {
              removeItem(index);
              calculateInvoiceTotals();
            }}
            canRemove={fields.length > 1}
          />
        ))}
      </div>
    </FormCard>
  );
};
