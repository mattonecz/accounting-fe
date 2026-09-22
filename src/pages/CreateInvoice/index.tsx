import { ChangeEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Loader2,
  Minus,
  Plus,
} from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import {
  SelectField,
  TextField,
  sectionLabelClass,
} from '@/components/invoices/formFields';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useInvoiceForm } from '@/components/invoices/useInvoiceForm';
import CreateIncomingInvoice from '@/pages/CreateIncomingInvoice';
import { InvoiceItemsEditor } from '@/components/invoices/InvoiceItemsEditor';
import { InvoiceContactField } from '@/components/invoices/InvoiceContactField';
import { ParsedDocumentStats } from '@/components/ParsedDocumentStats';
import {
  CreateInvoiceDtoPaymentMethod,
  CreateInvoiceDtoVatClaimType,
  CreateInvoiceDtoVatMode,
} from '@/api/model';
import { addDays, daysBetween } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const CreateIssuedInvoice = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    parsedState,
    form,
    fieldArray,
    isCreatingInvoice,
    isCzkCurrency,
    isReceived,
    isVatPayer,
    sortedBanks,
    sortedContacts,
    formatMoney,
    getBankAccountLabel,
    calculateTotals,
    submitInvoice,
  } = useInvoiceForm();

  const { fields, append, remove } = fieldArray;
  const [symbolsOpen, setSymbolsOpen] = useState(false);

  const listRoute = isReceived ? '/incoming-invoices' : '/outgoing-invoices';

  const bankOptions = sortedBanks.map((b) => ({
    value: b.id,
    label: getBankAccountLabel(b),
  }));
  const currencyOptions = [
    { value: 'CZK', label: t('currencies.CZK') },
    { value: 'EUR', label: t('currencies.EUR') },
    { value: 'USD', label: t('currencies.USD') },
  ];
  const vatModeOptions = [
    {
      value: CreateInvoiceDtoVatMode.STANDARD,
      label: t('invoices.vatModes.STANDARD'),
    },
    {
      value: CreateInvoiceDtoVatMode.REVERSE_CHARGE,
      label: t('invoices.vatModes.REVERSE_CHARGE'),
    },
  ];
  const paymentMethodOptions = Object.values(CreateInvoiceDtoPaymentMethod).map(
    (method) => ({
      value: method,
      label: t(`invoices.paymentMethods.${method}`),
    }),
  );

  const defaultItem = {
    name: '',
    quantity: 1,
    unitPrice: 0,
    vatRate: isVatPayer ? 21 : undefined,
    total: 0,
  };

  // Issue date drives the tax date and the due date (via the payment term).
  const handleCreatedDateChange = (
    e: ChangeEvent<HTMLInputElement>,
    onChange: (...event: unknown[]) => void,
  ) => {
    const value = e.target.value;
    onChange(value);
    form.setValue('duzpDate', value);
    const days = Number(form.getValues('paymentDays')) || 0;
    form.setValue('dueDate', addDays(value, days));
  };

  const handleDueDateChange = (
    e: ChangeEvent<HTMLInputElement>,
    onChange: (...event: unknown[]) => void,
  ) => {
    const value = e.target.value;
    onChange(value);
    const createdDate = form.getValues('createdDate') ?? '';
    form.setValue('paymentDays', daysBetween(createdDate, value));
  };

  const handleIsPaidChange = (
    checked: boolean,
    onChange: (...event: unknown[]) => void,
  ) => {
    onChange(checked);
    form.setValue('paidDate', checked ? form.getValues('dueDate') : undefined);
  };

  const handleSaveDraft = () =>
    form.handleSubmit((data) => submitInvoice(data, 'draft'))();

  const items = form.watch('items') ?? [];
  const subtotal = items.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0,
  );
  const totalTax = isVatPayer
    ? items.reduce((sum, item) => {
        const base = (item.quantity || 0) * (item.unitPrice || 0);
        return sum + base * ((item.vatRate || 0) / 100);
      }, 0)
    : 0;
  const totalWithTax = subtotal + totalTax;

  const isPaid = form.watch('isPaid');
  const createdDate = form.watch('createdDate');
  const dueDate = form.watch('dueDate');
  const dueDays =
    createdDate && dueDate ? daysBetween(createdDate, dueDate) : null;

  const vatMode = form.watch('vatMode');
  const shouldClaimVat = form.watch('shouldClaimVat');
  const vatClaimType = form.watch('vatClaimType');
  // VAT-deduction evidence applies only to received invoices in standard mode.
  const showVatClaim =
    isVatPayer && isReceived && vatMode === CreateInvoiceDtoVatMode.STANDARD;

  const contactLabel = isReceived
    ? t('invoices.fields.supplier')
    : t('invoices.fields.contact');

  return (
    <PageLayout>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => submitInvoice(data, 'issued'))}
          className="mx-auto max-w-[860px] space-y-4"
        >
          {/* Header */}
          <div className="space-y-1">
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto gap-1 p-0 text-xs text-muted-foreground"
              onClick={() => navigate(listRoute)}
            >
              <ArrowLeft className="h-3 w-3" />
              {isReceived
                ? t('invoices.create.backReceived')
                : t('invoices.create.backIssued')}
            </Button>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                {isReceived
                  ? t('invoices.create.titleReceived')
                  : t('invoices.create.title')}
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isReceived
                  ? t('invoices.create.descriptionReceived')
                  : t('invoices.create.description')}
              </p>
            </div>
          </div>

          {parsedState && (
            <ParsedDocumentStats llmCalls={parsedState.llmCalls} />
          )}

          {/* Customer / supplier */}
          <Card className="border-border/60 p-5 shadow-sm">
            <InvoiceContactField
              form={form}
              contacts={sortedContacts}
              label={contactLabel}
              placeholder={
                isReceived
                  ? t('invoices.placeholders.selectSupplier')
                  : t('invoices.placeholders.selectContact')
              }
              requiredMessage={t('validation.required', {
                field: contactLabel,
              })}
              autoSelectMatch={!!parsedState}
            />
          </Card>

          {/* Number, dates, payment */}
          <Card className="border-border/60 p-5 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <TextField
                control={form.control}
                name="number"
                required
                label={t('invoices.fields.number')}
                placeholder={t('invoices.placeholders.number')}
                className="tabular-nums"
                rules={{
                  required: t('validation.required', {
                    field: t('invoices.fields.number'),
                  }),
                }}
              />
              {isReceived && (
                <TextField
                  control={form.control}
                  name="originalNumber"
                  label={t('invoices.fields.originalNumber')}
                  placeholder={t('invoices.placeholders.originalNumber')}
                />
              )}
              <TextField
                control={form.control}
                name="createdDate"
                required
                type="date"
                label={t('invoices.fields.createdDate')}
                className="tabular-nums"
                rules={{
                  required: t('validation.required', {
                    field: t('invoices.fields.createdDate'),
                  }),
                }}
                onChangeOverride={handleCreatedDateChange}
              />
              <TextField
                control={form.control}
                name="duzpDate"
                required
                type="date"
                label={t('invoices.fields.duzpDate')}
                className="tabular-nums"
                rules={{
                  required: t('validation.required', {
                    field: t('invoices.fields.duzpDate'),
                  }),
                }}
              />
              <TextField
                control={form.control}
                name="dueDate"
                required
                type="date"
                label={t('invoices.fields.dueDate')}
                className="tabular-nums"
                rules={{
                  required: t('validation.required', {
                    field: t('invoices.fields.dueDate'),
                  }),
                }}
                onChangeOverride={handleDueDateChange}
                hint={
                  dueDays != null
                    ? t('invoices.create.dueDays', { days: dueDays })
                    : undefined
                }
              />
              <SelectField
                control={form.control}
                name="paymentMethod"
                label={t('invoices.fields.paymentMethod')}
                placeholder={t('payments.placeholders.selectMethod')}
                options={paymentMethodOptions}
              />
              {!isReceived && (
                <SelectField
                  control={form.control}
                  name="bankId"
                  required
                  label={t('invoices.fields.bank')}
                  placeholder={t('invoices.placeholders.selectBank')}
                  options={bankOptions}
                  rules={{
                    required: t('validation.required', {
                      field: t('invoices.fields.bank'),
                    }),
                  }}
                />
              )}
              <SelectField
                control={form.control}
                name="currency"
                label={t('invoices.fields.currency')}
                placeholder={t('invoices.placeholders.selectCurrency')}
                options={currencyOptions}
              />
              {isVatPayer && (
                <SelectField
                  control={form.control}
                  name="vatMode"
                  required
                  label={t('invoices.fields.vatMode')}
                  placeholder={t('invoices.placeholders.selectVatMode')}
                  options={vatModeOptions}
                  rules={{
                    required: t('validation.required', {
                      field: t('invoices.fields.vatMode'),
                    }),
                  }}
                />
              )}
              {!isCzkCurrency && (
                <TextField
                  control={form.control}
                  name="exchangeRate"
                  type="number"
                  step="0.01"
                  label={t('invoices.fields.exchangeRate')}
                  placeholder={t('common.optional')}
                  onChangeOverride={(e, onChange) =>
                    onChange(parseFloat(e.target.value) || undefined)
                  }
                />
              )}
            </div>
            <p className="mt-3 text-xs text-muted-foreground/80">
              {t('invoices.create.metaHint')}
            </p>
          </Card>

          {/* Payment symbols, supplier bank & notes — collapsed by default */}
          <Collapsible open={symbolsOpen} onOpenChange={setSymbolsOpen}>
            <Card className="border-border/60 p-0 shadow-sm">
              <CollapsibleTrigger className="flex w-full items-center gap-3 px-5 py-3.5 text-left">
                <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border-[1.5px] border-dashed border-muted-foreground/60 text-muted-foreground">
                  {symbolsOpen ? (
                    <Minus className="h-2.5 w-2.5" />
                  ) : (
                    <Plus className="h-2.5 w-2.5" />
                  )}
                </span>
                <span className="flex-1">
                  <span className="block text-[13px] font-medium">
                    {t('invoices.create.symbols.title')}
                  </span>
                  <span className="block text-xs text-muted-foreground/80">
                    {t('invoices.create.symbols.subtitle')}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform',
                    symbolsOpen && 'rotate-180',
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-4 px-5 pb-5 pt-1">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <TextField
                      control={form.control}
                      name="variableSymbol"
                      label={t('invoices.fields.variableSymbol')}
                      placeholder={t('common.optional')}
                    />
                    <TextField
                      control={form.control}
                      name="specificSymbol"
                      label={t('invoices.fields.specificSymbol')}
                      placeholder={t('common.optional')}
                    />
                    <TextField
                      control={form.control}
                      name="konstantSymbol"
                      label={t('invoices.fields.konstantSymbol')}
                      placeholder={t('common.optional')}
                    />
                  </div>
                  {isReceived && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField
                        control={form.control}
                        name="bankSnapshot.name"
                        label={t('invoices.fields.bankName')}
                        placeholder={t('common.optional')}
                      />
                      <TextField
                        control={form.control}
                        name="bankSnapshot.number"
                        label={t('invoices.fields.bankNumber')}
                        placeholder="123456789/0100"
                      />
                      <TextField
                        control={form.control}
                        name="bankSnapshot.iban"
                        label={t('invoices.fields.bankIban')}
                        placeholder="CZ65..."
                      />
                      <TextField
                        control={form.control}
                        name="bankSnapshot.swift"
                        label={t('invoices.fields.bankSwift')}
                        placeholder={t('common.optional')}
                      />
                    </div>
                  )}
                  <TextField
                    control={form.control}
                    name="note"
                    label={t('invoices.fields.note')}
                    placeholder={t('invoices.placeholders.note')}
                  />
                  <TextField
                    control={form.control}
                    name="internalNote"
                    label={t('invoices.fields.internalNote')}
                    placeholder={t('invoices.placeholders.internalNote')}
                  />
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Line items + summary */}
          <Card className="border-border/60 p-5 shadow-sm">
            <InvoiceItemsEditor
              fields={fields}
              isVatPayer={isVatPayer}
              onRecalculate={calculateTotals}
              onAppend={() => append(defaultItem)}
              onRemoveAt={(index) => {
                remove(index);
                calculateTotals();
              }}
            />

            {/* Summary inside the items card — one glance */}
            <div className="mt-4 flex items-end justify-between border-t pt-3.5">
              <div className="flex gap-8">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {isVatPayer
                      ? t('invoices.summary.subtotal')
                      : t('invoices.summary.total')}
                  </p>
                  <p className="mt-0.5 text-sm font-medium tabular-nums">
                    {formatMoney(subtotal)}
                  </p>
                </div>
                {isVatPayer && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t('invoices.summary.totalTax')}
                    </p>
                    <p className="mt-0.5 text-sm font-medium tabular-nums text-foreground/70">
                      {formatMoney(totalTax)}
                    </p>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  {t('invoices.summary.totalDue')}
                </p>
                <p className="mt-0.5 text-2xl font-bold tracking-tight tabular-nums">
                  {formatMoney(totalWithTax)}
                </p>
              </div>
            </div>
          </Card>

          {/* Status & bookkeeping */}
          <Card className="border-border/60 p-5 shadow-sm">
            <p className={cn(sectionLabelClass, 'mb-3')}>
              {t('invoices.create.status.section')}
            </p>

            <FormField
              control={form.control}
              name="isPaid"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0">
                  <div className="pr-4">
                    <FormLabel className="text-[13px] font-medium">
                      {t('invoices.create.status.markPaid')}
                    </FormLabel>
                    <p className="text-xs text-muted-foreground/80">
                      {t('invoices.create.status.markPaidDesc')}
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={!!field.value}
                      onCheckedChange={(checked) =>
                        handleIsPaidChange(checked, field.onChange)
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {isPaid && (
              <div className="mt-4 max-w-[220px]">
                <TextField
                  control={form.control}
                  name="paidDate"
                  required
                  type="date"
                  label={t('invoices.fields.paidDate')}
                  className="tabular-nums"
                  rules={{
                    required: t('validation.required', {
                      field: t('invoices.fields.paidDate'),
                    }),
                  }}
                />
              </div>
            )}

            {/* VAT deduction — only for received invoices in standard mode */}
            {showVatClaim && (
              <div className="mt-4 space-y-4 border-t pt-4">
                <FormField
                  control={form.control}
                  name="shouldClaimVat"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0">
                      <div className="pr-4">
                        <FormLabel className="text-[13px] font-medium">
                          {t('invoices.vatClaim.shouldClaim')}
                        </FormLabel>
                        <p className="text-xs text-muted-foreground/80">
                          {t('invoices.vatClaim.shouldClaimDescription')}
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={!!field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {shouldClaimVat && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <SelectField
                        control={form.control}
                        name="vatClaimType"
                        label={t('invoices.vatClaim.claimType.label')}
                        options={[
                          {
                            value: CreateInvoiceDtoVatClaimType.FULL,
                            label: t(
                              'invoices.vatClaim.claimType.options.FULL',
                            ),
                          },
                          {
                            value: CreateInvoiceDtoVatClaimType.PARTIAL,
                            label: t(
                              'invoices.vatClaim.claimType.options.PARTIAL',
                            ),
                          },
                        ]}
                      />
                      {vatClaimType ===
                        CreateInvoiceDtoVatClaimType.PARTIAL && (
                        <TextField
                          control={form.control}
                          name="vatClaimRatio"
                          type="number"
                          step="0.01"
                          label={t('invoices.vatClaim.claimRatio.label')}
                          placeholder={t(
                            'invoices.vatClaim.claimRatio.placeholder',
                          )}
                          hint={t('invoices.vatClaim.claimRatio.hint')}
                          rules={{
                            required: t(
                              'invoices.vatClaim.validation.ratioRequired',
                            ),
                            validate: (value) => {
                              const n =
                                typeof value === 'string'
                                  ? Number(value)
                                  : (value as number);
                              return (
                                (Number.isFinite(n) && n > 0 && n < 1) ||
                                t('invoices.vatClaim.validation.ratioRange')
                              );
                            },
                          }}
                          onChangeOverride={(e, onChange) =>
                            onChange(
                              e.target.value === ''
                                ? undefined
                                : Number(e.target.value),
                            )
                          }
                        />
                      )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField
                        control={form.control}
                        name="vatClaimMonth"
                        type="month"
                        label={t('invoices.vatClaim.claimMonth.label')}
                        className="tabular-nums"
                      />
                      <TextField
                        control={form.control}
                        name="vatClaimNote"
                        label={t('invoices.vatClaim.note.label')}
                        placeholder={t('invoices.vatClaim.note.placeholder')}
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </Card>

          {/* Footer actions */}
          <div className="flex items-center justify-between gap-2 pb-8">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isCreatingInvoice}
              onClick={() => navigate(listRoute)}
            >
              {t('invoices.actions.cancel')}
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isCreatingInvoice}
                onClick={handleSaveDraft}
              >
                {t('invoices.actions.createDraft')}
              </Button>
              <Button
                type="submit"
                size="sm"
                className="gap-1.5"
                disabled={isCreatingInvoice}
              >
                {isCreatingInvoice ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('invoices.actions.creating')}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    {t('invoices.actions.create')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </PageLayout>
  );
};

// Received invoices use a distinct layout (amounts by VAT rate, no line items),
// so delegate to the dedicated page; the issued form stays here.
const CreateInvoice = () => {
  const [searchParams] = useSearchParams();
  return searchParams.get('type') === 'received' ? (
    <CreateIncomingInvoice />
  ) : (
    <CreateIssuedInvoice />
  );
};

export default CreateInvoice;
