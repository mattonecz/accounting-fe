import { useTranslation } from 'react-i18next';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import { TriangleAlert, UserPlus, X } from 'lucide-react';

import type { ContactResponseDto, CreateContactDto } from '@/api/model';
import { ContactCombobox } from '@/components/invoices/ContactCombobox';
import {
  RequiredMark,
  TextField,
  labelClass,
} from '@/components/invoices/formFields';
import { Button } from '@/components/ui/button';
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { findContactByIco } from '@/lib/contactMatch';

export const DEFAULT_CONTACT_COUNTRY = 'CZ';

export interface ContactPickerValues extends FieldValues {
  contactId?: string;
  /**
   * A counterparty that does not exist as a Contact yet — picked from ARES or
   * typed by hand. It is created on submit and then referenced via contactId.
   */
  pendingContact?: CreateContactDto | null;
}

interface InvoiceContactFieldProps<T extends ContactPickerValues> {
  form: UseFormReturn<T>;
  contacts: ContactResponseDto[];
  label: string;
  placeholder: string;
  requiredMessage: string;
}

/**
 * Customer / supplier picker shared by the issued and received invoice forms:
 * an existing contact, a company found in ARES, or a new contact typed by hand.
 * ARES and hand-typed contacts open an editable card and are only created when
 * the invoice is saved, so an abandoned form leaves no stray contact behind.
 */
export const InvoiceContactField = <T extends ContactPickerValues>({
  form: typedForm,
  contacts,
  label,
  placeholder,
  requiredMessage,
}: InvoiceContactFieldProps<T>) => {
  const { t } = useTranslation();
  // The field paths below exist on every form that satisfies
  // ContactPickerValues; the cast only spares threading generic paths through.
  const form = typedForm as unknown as UseFormReturn<ContactPickerValues>;

  const contactId = form.watch('contactId');
  const pendingContact = form.watch('pendingContact');
  const selectedLabel =
    pendingContact?.name ||
    contacts.find((c) => c.id === contactId)?.name ||
    undefined;

  const selectExisting = (contact: ContactResponseDto) => {
    form.setValue('contactId', contact.id, {
      shouldValidate: true,
      shouldDirty: true,
    });
    form.setValue('pendingContact', null, { shouldDirty: true });
  };

  const startPendingContact = (contact: Partial<CreateContactDto>) => {
    // IČO is unique per company: a company we already know is simply selected
    // instead of being offered as a new (duplicate) contact.
    const existing = findContactByIco(contacts, contact.ico);
    if (existing) {
      selectExisting(existing);
      return;
    }
    form.setValue(
      'pendingContact',
      {
        ...contact,
        name: contact.name ?? '',
        country: contact.country || DEFAULT_CONTACT_COUNTRY,
      },
      { shouldDirty: true },
    );
    form.setValue('contactId', '', { shouldDirty: true });
    form.clearErrors('contactId');
  };

  const duplicate = findContactByIco(contacts, pendingContact?.ico);

  const cancelPendingContact = () => {
    form.setValue('pendingContact', null, { shouldDirty: true });
  };

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="contactId"
        rules={{
          validate: () =>
            !!form.getValues('contactId') ||
            !!form.getValues('pendingContact') ||
            requiredMessage,
        }}
        render={({ fieldState }) => (
          <FormItem className="space-y-1.5">
            <FormLabel className={labelClass}>
              {label}
              <RequiredMark />
            </FormLabel>
            <ContactCombobox
              contacts={contacts}
              selectedContactId={contactId}
              selectedLabel={selectedLabel}
              hasError={!!fieldState.error}
              placeholder={placeholder}
              onSelectContact={selectExisting}
              onSelectAres={startPendingContact}
              onCreateNew={startPendingContact}
            />
            <FormMessage />
          </FormItem>
        )}
      />

      {pendingContact && (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <UserPlus className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">
                  {t('invoices.create.newContact.title')}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {t('invoices.create.newContact.hint')}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground"
              onClick={cancelPendingContact}
            >
              <X className="h-3.5 w-3.5" />
              {t('invoices.create.newContact.cancel')}
            </Button>
          </div>

          {duplicate && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs">
              <span className="flex items-center gap-2 text-foreground">
                <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-warning" />
                {t('invoices.create.newContact.duplicate', {
                  name: duplicate.name,
                })}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => selectExisting(duplicate)}
              >
                {t('invoices.create.newContact.useExisting')}
              </Button>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextField
                control={form.control}
                name="pendingContact.name"
                required
                label={t('contacts.fields.name')}
                placeholder={t('contacts.placeholders.name')}
                rules={{
                  // Only while the card is shown: a cancelled card must not block submit.
                  validate: (value, values) =>
                    !values.pendingContact ||
                    !!String(value ?? '').trim() ||
                    t('validation.required', {
                      field: t('contacts.fields.name'),
                    }),
                }}
              />
            </div>
            <TextField
              control={form.control}
              name="pendingContact.ico"
              label={t('contacts.fields.ico')}
              placeholder="12345678"
              className="tabular-nums"
            />
            <TextField
              control={form.control}
              name="pendingContact.dic"
              label={t('contacts.fields.dic')}
              placeholder="CZ12345678"
              className="tabular-nums"
            />
            <div className="sm:col-span-2">
              <TextField
                control={form.control}
                name="pendingContact.street"
                label={t('contacts.fields.street')}
                placeholder={t('contacts.placeholders.street')}
              />
            </div>
            <TextField
              control={form.control}
              name="pendingContact.city"
              label={t('contacts.fields.city')}
              placeholder={t('contacts.placeholders.city')}
            />
            <TextField
              control={form.control}
              name="pendingContact.psc"
              label={t('contacts.fields.psc')}
              placeholder="12345"
              className="tabular-nums"
            />
            <TextField
              control={form.control}
              name="pendingContact.country"
              required
              label={t('contacts.fields.country')}
              placeholder={t('contacts.placeholders.country')}
              rules={{
                // Only while the card is shown: a cancelled card must not block submit.
                validate: (value, values) =>
                  !values.pendingContact ||
                  !!String(value ?? '').trim() ||
                  t('validation.required', {
                    field: t('contacts.fields.country'),
                  }),
              }}
            />
            <TextField
              control={form.control}
              name="pendingContact.email"
              type="email"
              label={t('contacts.fields.email')}
              placeholder={t('contacts.placeholders.email')}
            />
          </div>
        </div>
      )}
    </div>
  );
};
