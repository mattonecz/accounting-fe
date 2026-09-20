import { useTranslation } from 'react-i18next';
import { labelClass } from '@/components/invoices/formFields';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { InvoiceItemRow } from './InvoiceItemRow';

const colHeadClass =
  'text-[9px] font-semibold uppercase tracking-wider text-muted-foreground';

export interface InvoiceItemsEditorProps {
  /** react-hook-form useFieldArray fields; only the React key (`id`) is read. */
  fields: { id: string }[];
  isVatPayer: boolean;
  onRecalculate: () => void;
  onAppend: () => void;
  onRemoveAt: (index: number) => void;
}

// Line-items editor: header + one InvoiceItemRow per field + an "add item"
// button. The host page keeps the useFieldArray and the totals footer; this just
// renders the table. Shared by the issued-invoice create and update pages.
export const InvoiceItemsEditor = ({
  fields,
  isVatPayer,
  onRecalculate,
  onAppend,
  onRemoveAt,
}: InvoiceItemsEditorProps) => {
  const { t } = useTranslation();

  const gridTemplate = isVatPayer
    ? '20px minmax(0,1fr) 64px 56px 92px 56px 104px 28px'
    : '20px minmax(0,1fr) 64px 56px 92px 104px 28px';

  return (
    <>
      <div className="mb-2.5 flex items-center justify-between">
        <p className={labelClass}>
          {t('invoices.sections.items')}
          <span className="ml-0.5 text-destructive">*</span>
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-2.5 text-[11px]"
          onClick={onAppend}
        >
          <Plus className="h-3 w-3" />
          {t('invoices.items.addItem')}
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <div
          className="grid items-center gap-2.5 border-b bg-muted/50 px-3 py-2"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          <span className={colHeadClass}>#</span>
          <span className={colHeadClass}>
            {t('invoices.items.columns.description')}
          </span>
          <span className={cn(colHeadClass, 'text-right')}>
            {t('invoices.fields.quantity')}
          </span>
          <span className={colHeadClass}>{t('invoices.fields.unit')}</span>
          <span className={cn(colHeadClass, 'text-right')}>
            {t('invoices.fields.unitPrice')}
          </span>
          {isVatPayer && (
            <span className={cn(colHeadClass, 'text-right')}>
              {t('invoices.items.columns.vatRatePct')}
            </span>
          )}
          <span className={cn(colHeadClass, 'text-right')}>
            {t('invoices.summary.total')}
          </span>
          <span />
        </div>
        {fields.map((field, index) => (
          <InvoiceItemRow
            key={field.id}
            index={index}
            isVatPayer={isVatPayer}
            gridTemplate={gridTemplate}
            onRecalculate={onRecalculate}
            onRemove={() => onRemoveAt(index)}
            canRemove={fields.length > 1}
          />
        ))}
      </div>
    </>
  );
};
