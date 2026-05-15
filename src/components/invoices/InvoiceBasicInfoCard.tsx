import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UseFormReturn } from 'react-hook-form';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { CreateInvoiceDtoVatMode } from '@/api/model';
import type { InvoiceFormValues } from './useInvoiceForm';
import { InputController } from '@/components/InputController';
import { SelectController } from '@/components/SelectController';
import { FormCard } from '@/components/FormCard';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { BankResponseDto } from '@/api/model/bankResponseDto';
import { ContactResponseDto } from '@/api/model/contactResponseDto';

interface InvoiceBasicInfoCardProps {
  form: UseFormReturn<InvoiceFormValues>;
  sortedContacts: ContactResponseDto[];
  sortedBanks: BankResponseDto[];
  isCzkCurrency: boolean;
  isReceived?: boolean;
  isVatPayer: boolean;
  getBankAccountLabel: (account: {
    name?: string;
    currency?: string;
    number?: string;
    iban?: string;
  }) => string;
}

export const InvoiceBasicInfoCard = ({
  form,
  sortedContacts,
  sortedBanks,
  isCzkCurrency,
  isReceived = false,
  isVatPayer,
  getBankAccountLabel,
}: InvoiceBasicInfoCardProps) => {
  const { t } = useTranslation();
  const [optionalOpen, setOptionalOpen] = useState(false);

  const contactOptions = sortedContacts.map((c) => ({ value: c.id, label: c.name ?? '-' }));
  const bankOptions = sortedBanks.map((b) => ({ value: b.id, label: getBankAccountLabel(b) }));

  const vatModeOptions = [
    { value: CreateInvoiceDtoVatMode.STANDARD, label: t('invoices.vatModes.STANDARD') },
    { value: CreateInvoiceDtoVatMode.REVERSE_CHARGE, label: t('invoices.vatModes.REVERSE_CHARGE') },
  ];

  const currencyOptions = [
    { value: 'USD', label: t('currencies.USD') },
    { value: 'EUR', label: t('currencies.EUR') },
    { value: 'CZK', label: t('currencies.CZK') },
  ];

  return (
    <>
      <FormCard title={t('invoices.sections.basicInfo')} titleClassName="text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <SelectController
            control={form.control}
            name="contactId"
            label={isReceived ? t('invoices.fields.supplier') : t('invoices.fields.contact')}
            placeholder={isReceived ? t('invoices.placeholders.selectSupplier') : t('invoices.placeholders.selectContact')}
            options={contactOptions}
            rules={{
              required: isReceived
                ? t('validation.required', { field: t('invoices.fields.supplier') })
                : t('validation.required', { field: t('invoices.fields.contact') }),
            }}
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

          <SelectController
            control={form.control}
            name="currency"
            label={t('invoices.fields.currency')}
            placeholder={t('invoices.placeholders.selectCurrency')}
            options={currencyOptions}
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
            <InputController
              control={form.control}
              name="exchangeRate"
              label={t('invoices.fields.exchangeRate')}
              placeholder={t('common.optional')}
              type="number"
              step="0.01"
              className="w-[100px]"
              onChangeOverride={(e, onChange) => onChange(parseFloat(e.target.value) || undefined)}
            />
          )}

          <InputController
            control={form.control}
            name="createdDate"
            label={t('invoices.fields.createdDate')}
            type="date"
            className="w-[160px]"
            rules={{ required: t('validation.required', { field: t('invoices.fields.createdDate') }) }}
          />

          <InputController
            control={form.control}
            name="duzpDate"
            label={t('invoices.fields.duzpDate')}
            type="date"
            className="w-[160px]"
            rules={{ required: t('validation.required', { field: t('invoices.fields.duzpDate') }) }}
          />

          <InputController
            control={form.control}
            name="dueDate"
            label={t('invoices.fields.dueDate')}
            type="date"
            className="w-[160px]"
            rules={{ required: t('validation.required', { field: t('invoices.fields.dueDate') }) }}
          />

          {!isReceived && (
            <SelectController
              control={form.control}
              name="bankId"
              label={t('invoices.fields.bank')}
              placeholder={t('invoices.placeholders.selectBank')}
              options={bankOptions}
              triggerClassName="w-[400px]"
              rules={{ required: t('validation.required', { field: t('invoices.fields.bank') }) }}
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
                  <div className="max-w-3xl mx-auto space-y-4">
                    <InputController
                      control={form.control}
                      name="bankSnapshot.name"
                      label={t('invoices.fields.bankName')}
                      placeholder={t('common.optional')}
                    />
                    <InputController
                      control={form.control}
                      name="bankSnapshot.number"
                      label={t('invoices.fields.bankNumber')}
                      placeholder="123456789/0100"
                    />
                    <InputController
                      control={form.control}
                      name="bankSnapshot.iban"
                      label={t('invoices.fields.bankIban')}
                      placeholder="CZ65..."
                    />
                    <InputController
                      control={form.control}
                      name="bankSnapshot.swift"
                      label={t('invoices.fields.bankSwift')}
                      placeholder={t('common.optional')}
                    />
                  </div>
                </FormCard>
              )}

              <FormCard title={t('invoices.sections.paymentSymbols')} titleClassName="text-center">
                <div className="max-w-3xl mx-auto space-y-4">
                  <InputController
                    control={form.control}
                    name="variableSymbol"
                    label={t('invoices.fields.variableSymbol')}
                    placeholder={t('common.optional')}
                  />
                  <InputController
                    control={form.control}
                    name="specificSymbol"
                    label={t('invoices.fields.specificSymbol')}
                    placeholder={t('common.optional')}
                  />
                  <InputController
                    control={form.control}
                    name="konstantSymbol"
                    label={t('invoices.fields.konstantSymbol')}
                    placeholder={t('common.optional')}
                  />
                </div>
              </FormCard>

              <FormCard title={t('invoices.sections.notes')} titleClassName="text-center">
                <div className="max-w-3xl mx-auto space-y-4">
                  <InputController
                    control={form.control}
                    name="note"
                    label={t('invoices.fields.note')}
                    placeholder={t('invoices.placeholders.note')}
                    variant="vertical"
                  />
                  <InputController
                    control={form.control}
                    name="internalNote"
                    label={t('invoices.fields.internalNote')}
                    placeholder={t('invoices.placeholders.internalNote')}
                    variant="vertical"
                  />
                </div>
              </FormCard>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </>
  );
};
