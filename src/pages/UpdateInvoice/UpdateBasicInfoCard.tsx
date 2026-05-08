import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormCard } from '@/components/FormCard';
import { InputController } from '@/components/InputController';
import { SelectController } from '@/components/SelectController';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  UpdateInvoiceDtoStatus,
  UpdateInvoiceDtoType,
  UpdateInvoiceDtoVatMode,
} from '@/api/model';
import { useWatch } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import type { UpdateInvoiceDto } from '@/api/model';
import { getBankAccountLabel } from './useUpdateInvoiceForm';

interface UpdateBasicInfoCardProps {
  form: UseFormReturn<UpdateInvoiceDto>;
  sortedContacts: Array<{ id: string; name: string }>;
  sortedBanks: Array<{
    id: string;
    name?: string;
    number?: string;
    iban?: string;
    currency?: string;
  }>;
  isCzkCurrency: boolean;
  isVatPayer: boolean;
}

export const UpdateBasicInfoCard = ({
  form,
  sortedContacts,
  sortedBanks,
  isCzkCurrency,
  isVatPayer,
}: UpdateBasicInfoCardProps) => {
  const { t } = useTranslation();
  const [optionalOpen, setOptionalOpen] = useState(false);
  const invoiceType = useWatch({ control: form.control, name: 'type' });
  const isReceived = invoiceType === UpdateInvoiceDtoType.RECEIVED;

  const vatModeOptions = [
    { value: UpdateInvoiceDtoVatMode.STANDARD, label: t('invoices.vatModes.STANDARD') },
    { value: UpdateInvoiceDtoVatMode.REVERSE_CHARGE, label: t('invoices.vatModes.REVERSE_CHARGE') },
  ];

  return (
    <>
      <FormCard title={t('invoices.sections.basicInfo')} titleClassName="text-center">
        <div className="mx-auto max-w-3xl space-y-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="flex items-center gap-4">
                <FormLabel className="w-[200px] text-right">{t('invoices.fields.status')}</FormLabel>
                <div className="flex flex-col">
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder={t('invoices.placeholders.selectStatus')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UpdateInvoiceDtoStatus.DRAFT}>
                        {t('invoices.statuses.DRAFT')}
                      </SelectItem>
                      <SelectItem value={UpdateInvoiceDtoStatus.ISSUED}>
                        {t('invoices.statuses.ISSUED')}
                      </SelectItem>
                      <SelectItem value={UpdateInvoiceDtoStatus.PAID}>
                        {t('invoices.statuses.PAID')}
                      </SelectItem>
                      <SelectItem value={UpdateInvoiceDtoStatus.CANCELLED}>
                        {t('invoices.statuses.CANCELLED')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactId"
            rules={{
              required: isReceived
                ? t('validation.required', { field: t('invoices.fields.supplier') })
                : t('validation.required', { field: t('invoices.fields.contact') }),
            }}
            render={({ field }) => (
              <FormItem className="flex items-center gap-4">
                <FormLabel className="w-[200px] text-right">
                  {isReceived ? t('invoices.fields.supplier') : t('invoices.fields.contact')}
                </FormLabel>
                <div className="flex flex-col">
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-[350px]">
                        <SelectValue placeholder={
                          isReceived ? t('invoices.placeholders.selectSupplier') : t('invoices.placeholders.selectContact')
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sortedContacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <InputController
            control={form.control}
            name="number"
            label={t('invoices.fields.number')}
            placeholder="20250001"
            rules={{ required: t('validation.required', { field: t('invoices.fields.number') }) }}
          />

          {isReceived && (
            <InputController
              control={form.control}
              name="originalNumber"
              label={t('invoices.fields.originalNumber')}
              placeholder={t('invoices.placeholders.originalNumber')}
            />
          )}

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem className="flex items-center gap-4">
                <FormLabel className="w-[200px] text-right">{t('invoices.fields.currency')}</FormLabel>
                <div className="flex flex-col">
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder={t('invoices.placeholders.selectCurrency')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="USD">{t('currencies.USD')}</SelectItem>
                      <SelectItem value="EUR">{t('currencies.EUR')}</SelectItem>
                      <SelectItem value="CZK">{t('currencies.CZK')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          {isVatPayer && (
            <SelectController
              control={form.control}
              name="vatMode"
              label={t('invoices.fields.vatMode')}
              placeholder={t('invoices.placeholders.selectVatMode')}
              options={vatModeOptions}
              rules={{ required: t('validation.required', { field: t('invoices.fields.vatMode') }) }}
            />
          )}

          {!isCzkCurrency && (
            <FormField
              control={form.control}
              name="exchangeRate"
              render={({ field }) => (
                <FormItem className="flex items-center gap-4">
                  <FormLabel className="w-[200px] text-right">{t('invoices.fields.exchangeRate')}</FormLabel>
                  <div className="flex flex-col">
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={t('common.optional')}
                        className="w-[100px]"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="createdDate"
            rules={{ required: t('validation.required', { field: t('invoices.fields.createdDate') }) }}
            render={({ field }) => (
              <FormItem className="flex items-center gap-4">
                <FormLabel className="w-[200px] text-right">{t('invoices.fields.createdDate')}</FormLabel>
                <div className="flex flex-col">
                  <FormControl>
                    <Input type="date" className="w-[160px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duzpDate"
            rules={{ required: t('validation.required', { field: t('invoices.fields.duzpDate') }) }}
            render={({ field }) => (
              <FormItem className="flex items-center gap-4">
                <FormLabel className="w-[200px] text-right">{t('invoices.fields.duzpDate')}</FormLabel>
                <div className="flex flex-col">
                  <FormControl>
                    <Input type="date" className="w-[160px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            rules={{ required: t('validation.required', { field: t('invoices.fields.dueDate') }) }}
            render={({ field }) => (
              <FormItem className="flex items-center gap-4">
                <FormLabel className="w-[200px] text-right">{t('invoices.fields.dueDate')}</FormLabel>
                <div className="flex flex-col">
                  <FormControl>
                    <Input type="date" className="w-[160px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          {!isReceived && (
            <FormField
              control={form.control}
              name="bankId"
              render={({ field }) => (
                <FormItem className="flex items-center gap-4">
                  <FormLabel className="w-[200px] text-right">{t('invoices.fields.bank')}</FormLabel>
                  <div className="flex flex-col">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-[400px]">
                          <SelectValue placeholder={t('invoices.placeholders.selectBank')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sortedBanks.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {getBankAccountLabel(account)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          )}
        </div>
      </FormCard>

      <Collapsible open={optionalOpen} onOpenChange={setOptionalOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 data-[state=open]:hidden"
          >
            <span>{t('invoices.sections.optionalDetails')}</span>
            <ChevronDown className="h-4 w-4 shrink-0" />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
          <div className="rounded-lg border bg-card">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <span className="text-sm font-medium text-foreground">
                {t('invoices.sections.optionalDetails')}
              </span>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
            </div>

            <div className="space-y-6 p-6">
              {isReceived && (
                <FormCard title={t('invoices.sections.bankSupplier')} titleClassName="text-center">
                  <div className="mx-auto max-w-3xl space-y-4">
                    <InputController control={form.control} name="bankSnapshot.name" label={t('invoices.fields.bankName')} placeholder={t('common.optional')} />
                    <InputController control={form.control} name="bankSnapshot.number" label={t('invoices.fields.bankNumber')} placeholder="123456789/0100" />
                    <InputController control={form.control} name="bankSnapshot.iban" label={t('invoices.fields.bankIban')} placeholder="CZ65..." />
                    <InputController control={form.control} name="bankSnapshot.swift" label={t('invoices.fields.bankSwift')} placeholder={t('common.optional')} />
                  </div>
                </FormCard>
              )}

              <FormCard title={t('invoices.sections.paymentSymbols')} titleClassName="text-center">
                <div className="mx-auto max-w-3xl space-y-4">
                  <InputController control={form.control} name="variableSymbol" label={t('invoices.fields.variableSymbol')} placeholder={t('common.optional')} />
                  <InputController control={form.control} name="specificSymbol" label={t('invoices.fields.specificSymbol')} placeholder={t('common.optional')} />
                  <InputController control={form.control} name="konstantSymbol" label={t('invoices.fields.konstantSymbol')} placeholder={t('common.optional')} />
                </div>
              </FormCard>

              <FormCard title={t('invoices.sections.notes')} titleClassName="text-center">
                <div className="mx-auto max-w-3xl space-y-4">
                  <InputController control={form.control} name="note" label={t('invoices.fields.note')} placeholder={t('invoices.placeholders.note')} variant="vertical" />
                  <InputController control={form.control} name="internalNote" label={t('invoices.fields.internalNote')} placeholder={t('invoices.placeholders.internalNote')} variant="vertical" />
                </div>
              </FormCard>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </>
  );
};
