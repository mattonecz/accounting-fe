import { useTranslation } from 'react-i18next';
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
  isVatPayer: boolean;
}

const handleNumericChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  fieldOnChange: (value: number) => void,
  onRecalculate: () => void,
) => {
  fieldOnChange(parseFloat(e.target.value) || 0);
  onRecalculate();
};

export const InvoiceItemsCard = ({
  form,
  fieldArray,
  formatMoney,
  onRecalculate,
  isVatPayer,
}: InvoiceItemsCardProps) => {
  const { t } = useTranslation();
  const { fields, append, remove } = fieldArray;

  const defaultItem = {
    name: '',
    quantity: 1,
    unitPrice: 0,
    vatRate: isVatPayer ? 21 : undefined,
    total: 0,
  };

  const columnHeaders = [
    { label: '#', className: 'w-8' },
    { label: t('invoices.items.columns.description'), className: 'flex-1' },
    { label: t('invoices.fields.quantity'), className: 'w-24' },
    { label: t('invoices.fields.unitPrice'), className: 'w-32' },
    ...(isVatPayer ? [{ label: t('invoices.items.columns.vatRatePct'), className: 'w-24' }] : []),
    { label: t('invoices.summary.total'), className: 'w-32' },
    { label: '', className: 'w-10' },
  ];

  return (
    <FormCard
      title={t('invoices.sections.items')}
      actions={
        <Button type="button" variant="outline" size="sm" onClick={() => append(defaultItem)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('invoices.items.addItem')}
        </Button>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b">
          {columnHeaders.map((col, i) => (
            <span key={i} className={`${col.className} text-sm font-medium text-muted-foreground`}>
              {col.label}
            </span>
          ))}
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-2">
            <span className="text-sm font-medium w-8 h-10 flex items-center">{index + 1}.</span>

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
                      onChange={(e) => handleNumericChange(e, field.onChange, onRecalculate)}
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
                      onChange={(e) => handleNumericChange(e, field.onChange, onRecalculate)}
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
                        onChange={(e) => handleNumericChange(e, field.onChange, onRecalculate)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="w-32 h-10 flex items-center">
              <p className="font-medium">
                {formatMoney(
                  (form.watch(`items.${index}.quantity`) || 0) *
                    (form.watch(`items.${index}.unitPrice`) || 0) *
                    (1 + (isVatPayer ? (form.watch(`items.${index}.vatRate`) || 0) / 100 : 0)),
                )}
              </p>
            </div>

            <div className="h-10 flex items-center">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => { remove(index); onRecalculate(); }}
                disabled={fields.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </FormCard>
  );
};
