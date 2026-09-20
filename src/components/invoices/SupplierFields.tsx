import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form';
import { ChevronDown } from 'lucide-react';

import type { ContactResponseDto } from '@/api/model';
import { RequiredMark, labelClass } from '@/components/invoices/formFields';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

/** Sentinel value of the supplier select for "type the name by hand". */
export const MANUAL_SUPPLIER = '__manual__';

export interface SupplierFormValues extends FieldValues {
  companySelect: string;
  companyName: string;
  companyIco: string;
  companyDic: string;
}

interface SupplierFieldsProps<T extends SupplierFormValues> {
  form: UseFormReturn<T>;
  contacts: ContactResponseDto[];
  isContactsLoading?: boolean;
  /**
   * False for a document already linked to a contact: the API rejects a manual
   * snapshot for those, so only another contact can be picked.
   */
  allowManual?: boolean;
}

/**
 * Supplier picker for simplified tax documents. The backend needs either a
 * contactId or a contact snapshot carrying a name (`invoices.service.ts` —
 * "contactId or contact (with a name) is required for kind=SIMPLE"), so the
 * name is validated here rather than discovered as a 400 after submit.
 *
 * Shared by the create and edit forms so the rule cannot drift between them.
 */
export const SupplierFields = <T extends SupplierFormValues>({
  form,
  contacts,
  isContactsLoading,
  allowManual = true,
}: SupplierFieldsProps<T>) => {
  const { t } = useTranslation();
  const [identifiersOpen, setIdentifiersOpen] = useState(false);

  // The literal field names are guaranteed by the SupplierFormValues
  // constraint, but TypeScript cannot narrow FieldPath<T> down to them.
  const path = (name: keyof SupplierFormValues) => name as FieldPath<T>;

  const companySelect = form.watch(path('companySelect'));
  const isManual = companySelect === MANUAL_SUPPLIER;

  const options = [
    ...(allowManual
      ? [
          {
            value: MANUAL_SUPPLIER,
            label: t('simpleInvoices.create.manualOption'),
          },
        ]
      : []),
    ...contacts.map((contact) => ({ value: contact.id, label: contact.name })),
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name={path('companySelect')}
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className={labelClass}>
                {t('simpleInvoices.create.fields.companySelect')}
                <RequiredMark />
              </FormLabel>
              <Select
                value={(field.value as string) ?? ''}
                onValueChange={field.onChange}
                disabled={isContactsLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t(
                        'simpleInvoices.create.placeholders.companySelect',
                      )}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!allowManual && (
                <p className="text-[11px] text-muted-foreground/80">
                  {t('simpleInvoices.update.contactLocked')}
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {isManual && (
          <FormField
            control={form.control}
            name={path('companyName')}
            rules={{
              validate: (value) =>
                form.getValues(path('companySelect')) !== MANUAL_SUPPLIER ||
                !!String(value ?? '').trim() ||
                t('simpleInvoices.create.validation.companyNameRequired'),
            }}
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className={labelClass}>
                  {t('simpleInvoices.create.fields.companyName')}
                  <RequiredMark />
                </FormLabel>
                <FormControl>
                  <Input
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    onChange={field.onChange}
                    value={(field.value as string) ?? ''}
                    placeholder={t(
                      'simpleInvoices.create.placeholders.companyName',
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      {/* IČO / DIČ are genuinely optional — and come from the contact when one
          is selected, so the section only makes sense for manual entry. */}
      {isManual && (
        <Collapsible open={identifiersOpen} onOpenChange={setIdentifiersOpen}>
          <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 transition-transform',
                identifiersOpen && 'rotate-180',
              )}
            />
            {t('simpleInvoices.create.company.identifiers')}
            <span className="text-muted-foreground/70">
              · {t('simpleInvoices.create.company.identifiersHint')}
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid gap-4 pt-3 sm:grid-cols-2">
              {(['companyIco', 'companyDic'] as const).map((name) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={path(name)}
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className={labelClass}>
                        {t(`simpleInvoices.create.fields.${name}`)}
                      </FormLabel>
                      <FormControl>
                        <Input
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          onChange={field.onChange}
                          value={(field.value as string) ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};
