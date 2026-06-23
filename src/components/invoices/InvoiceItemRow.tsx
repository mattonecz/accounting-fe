import { useState, type ChangeEvent } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { round2, toNumber } from './rateAmounts';

// Borderless cells so each row reads like a line of text until focused.
const cellInputClass =
  'h-9 rounded-md border-0 bg-transparent px-1.5 text-sm shadow-none transition-colors hover:bg-muted/40 focus-visible:bg-muted/60 focus-visible:ring-0 focus-visible:ring-offset-0';

export interface InvoiceItemRowProps {
  index: number;
  isVatPayer: boolean;
  gridTemplate: string;
  onRecalculate: () => void;
  onRemove: () => void;
  canRemove: boolean;
}

// One editable line item (name / quantity / unit / unit price / VAT rate) plus a
// VAT-inclusive total that back-calculates the unit price when edited. Reads the
// form through context, so the host page just renders it inside its `<Form>`
// provider. Shared by the issued-invoice create and update pages.
export const InvoiceItemRow = ({
  index,
  isVatPayer,
  gridTemplate,
  onRecalculate,
  onRemove,
  canRemove,
}: InvoiceItemRowProps) => {
  const { t } = useTranslation();
  const { control, watch, setValue } = useFormContext();
  // Raw text while the user edits the total directly; null means "derive it".
  const [totalDraft, setTotalDraft] = useState<string | null>(null);

  const quantity = toNumber(watch(`items.${index}.quantity`));
  const unitPrice = toNumber(watch(`items.${index}.unitPrice`));
  const vatRate = isVatPayer ? toNumber(watch(`items.${index}.vatRate`)) : 0;
  const computedTotal = quantity * unitPrice * (1 + vatRate / 100);

  const handleNumericChange = (
    e: ChangeEvent<HTMLInputElement>,
    onChange: (value: number) => void,
  ) => {
    onChange(toNumber(e.target.value));
    onRecalculate();
  };

  // User typed a final (VAT-inclusive) total → back-calculate the unit price.
  const handleTotalChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setTotalDraft(raw);
    const newTotal = toNumber(raw);
    const divisor = quantity * (1 + vatRate / 100);
    const newUnitPrice = divisor > 0 ? round2(newTotal / divisor) : 0;
    setValue(`items.${index}.unitPrice`, newUnitPrice);
    onRecalculate();
  };

  const totalValue =
    totalDraft ?? (computedTotal ? round2(computedTotal).toString() : '0');

  return (
    <div
      className="grid items-center gap-2.5 border-b px-3 py-2 last:border-b-0"
      style={{ gridTemplateColumns: gridTemplate }}
    >
      <span className="text-xs tabular-nums text-muted-foreground">
        {index + 1}.
      </span>

      <FormField
        control={control}
        name={`items.${index}.name`}
        rules={{ required: t('invoices.items.validation.descriptionRequired') }}
        render={({ field }) => (
          <FormItem className="space-y-1">
            <FormControl>
              <Input
                {...field}
                placeholder={t('invoices.placeholders.itemDescription')}
                className={cn(cellInputClass, 'placeholder:italic')}
              />
            </FormControl>
            <FormMessage className="px-1.5 text-[11px]" />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`items.${index}.quantity`}
        rules={{
          required: t('invoices.items.validation.quantityRequired'),
          min: { value: 0, message: t('validation.minZero') },
        }}
        render={({ field }) => (
          <FormItem className="space-y-1">
            <FormControl>
              <Input
                type="number"
                {...field}
                value={field.value ?? 0}
                className={cn(cellInputClass, 'text-right tabular-nums')}
                onChange={(e) => handleNumericChange(e, field.onChange)}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`items.${index}.unit`}
        render={({ field }) => (
          <FormItem className="space-y-1">
            <FormControl>
              <Input
                {...field}
                value={(field.value as string | undefined) ?? ''}
                placeholder={t('invoices.placeholders.itemUnit')}
                className={cellInputClass}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`items.${index}.unitPrice`}
        rules={{
          required: t('invoices.items.validation.priceRequired'),
          validate: (value) =>
            Number(value) > 0 ||
            t('invoices.items.validation.priceGreaterThanZero'),
        }}
        render={({ field }) => (
          <FormItem className="space-y-1">
            <FormControl>
              <Input
                type="number"
                step="1"
                {...field}
                value={field.value ?? 0}
                className={cn(cellInputClass, 'text-right tabular-nums')}
                onChange={(e) => handleNumericChange(e, field.onChange)}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {isVatPayer && (
        <FormField
          control={control}
          name={`items.${index}.vatRate`}
          rules={{
            min: { value: 0, message: t('validation.minZero') },
            max: { value: 100, message: t('validation.maxN', { max: 100 }) },
          }}
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormControl>
                <Input
                  type="number"
                  step="1"
                  {...field}
                  value={field.value ?? 0}
                  className={cn(cellInputClass, 'text-right tabular-nums')}
                  onChange={(e) => handleNumericChange(e, field.onChange)}
                />
              </FormControl>
            </FormItem>
          )}
        />
      )}

      <Input
        type="number"
        step="1"
        value={totalValue}
        onChange={handleTotalChange}
        onBlur={() => setTotalDraft(null)}
        className={cn(cellInputClass, 'text-right font-semibold tabular-nums')}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground"
        onClick={onRemove}
        disabled={!canRemove}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};
