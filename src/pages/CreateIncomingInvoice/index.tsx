import { ChangeEvent, useEffect, useRef, useState } from 'react';
import {
  useForm,
  type Control,
  type FieldPath,
  type UseControllerProps,
} from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, ChevronDown, Loader2, Plus } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import {
  Form,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useListContacts } from '@/api/contacts/contacts';
import { useInvoiceCreate } from '@/api/invoices/invoices';
import { useCompanyGet } from '@/api/companies/companies';
import { useAuth } from '@/contexts/AuthContext';
import type { ContactResponseDto, InvoiceItemDto } from '@/api/model';
import {
  CreateInvoiceDtoType,
  CreateInvoiceDtoVatClaimType,
  CreateInvoiceDtoVatMode,
} from '@/api/model';
import { addDays, formatMoney } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const labelClass = 'text-[11px] font-semibold text-foreground/80';
const sectionLabelClass =
  'text-[10px] font-semibold uppercase tracking-wider text-muted-foreground';
const colHeadClass =
  'text-[9px] font-semibold uppercase tracking-wider text-muted-foreground';

// One fixed row per current Czech VAT rate.
const DEFAULT_RATES = [21, 12, 0];
const DEFAULT_PAYMENT_DAYS = 14;

type RateField = 'base' | 'vat' | 'total';

type RateRowValue = {
  vatRate: number;
  // base / VAT / total are all editable; empty strings mean no amount for this rate.
  base: string;
  vat: string;
  total: string;
};

type FormValues = {
  contactId: string;
  number: string;
  originalNumber: string;
  createdDate: string;
  duzpDate: string;
  dueDate: string;
  /** Defaults to the due date (so the invoice is paid); clear it to mark unpaid. */
  paidDate: string;
  currency: string;
  vatMode: CreateInvoiceDtoVatMode;
  /** Kept as the typed string; parsed on submit. Only used for non-CZK. */
  exchangeRate: string;
  rates: RateRowValue[];
  variableSymbol: string;
  specificSymbol: string;
  konstantSymbol: string;
  bankName: string;
  bankNumber: string;
  bankIban: string;
  bankSwift: string;
  note: string;
  internalNote: string;
  shouldClaimVat: boolean;
  vatClaimType: CreateInvoiceDtoVatClaimType;
  /** Kept as the typed string; parsed to number on submit. */
  vatClaimRatio: string;
  vatClaimMonth: string;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

const numToStr = (value: number) => (value ? String(value) : '0');

// The VAT rate links base/VAT/total: editing any one re-derives the other two.
// Returns the three columns as strings; the edited column keeps the raw input.
const recomputeRow = (
  rate: number,
  field: RateField,
  raw: string,
): { base: string; vat: string; total: string } => {
  if (raw.trim() === '' || Number.isNaN(Number(raw))) {
    return { base: '', vat: '', total: '' };
  }
  const num = round2(Number(raw));
  let base: number;
  let vat: number;
  let total: number;
  if (field === 'base') {
    base = num;
    vat = round2((base * rate) / 100);
    total = round2(base + vat);
  } else if (field === 'vat') {
    vat = num;
    base = rate > 0 ? round2((vat * 100) / rate) : 0;
    total = round2(base + vat);
  } else {
    total = num;
    base = round2((total * 100) / (100 + rate));
    vat = round2(total - base);
  }
  const next = {
    base: numToStr(base),
    vat: numToStr(vat),
    total: numToStr(total),
  };
  // Preserve exactly what the user is typing in the edited column.
  next[field] = raw;
  return next;
};

const getDefaultValues = (): FormValues => {
  const today = new Date().toISOString().split('T')[0];
  return {
    contactId: '',
    number: '',
    originalNumber: '',
    createdDate: today,
    duzpDate: today,
    dueDate: addDays(today, DEFAULT_PAYMENT_DAYS),
    // Defaults to the due date and follows it until the user edits it manually.
    paidDate: addDays(today, DEFAULT_PAYMENT_DAYS),
    currency: 'CZK',
    vatMode: CreateInvoiceDtoVatMode.STANDARD,
    exchangeRate: '',
    rates: DEFAULT_RATES.map((vatRate) => ({
      vatRate,
      base: '',
      vat: '',
      total: '',
    })),
    variableSymbol: '',
    specificSymbol: '',
    konstantSymbol: '',
    bankName: '',
    bankNumber: '',
    bankIban: '',
    bankSwift: '',
    note: '',
    internalNote: '',
    shouldClaimVat: true,
    vatClaimType: CreateInvoiceDtoVatClaimType.FULL,
    vatClaimRatio: '',
    vatClaimMonth: today.slice(0, 7),
  };
};

const RequiredMark = () => <span className="ml-0.5 text-destructive">*</span>;

const trimOrUndefined = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

type FieldName = FieldPath<FormValues>;
type FieldRules = UseControllerProps<FormValues, FieldName>['rules'];

interface TextFieldProps {
  control: Control<FormValues>;
  name: FieldName;
  label: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  className?: string;
  hint?: string;
  rules?: FieldRules;
  onChangeOverride?: (
    e: ChangeEvent<HTMLInputElement>,
    onChange: (...event: unknown[]) => void,
  ) => void;
}

const TextField = ({
  control,
  name,
  label,
  required,
  type,
  placeholder,
  className,
  hint,
  rules,
  onChangeOverride,
}: TextFieldProps) => (
  <FormField
    control={control}
    name={name}
    rules={rules}
    render={({ field }) => (
      <FormItem className="space-y-1.5">
        <FormLabel className={labelClass}>
          {label}
          {required && <RequiredMark />}
        </FormLabel>
        <FormControl>
          <Input
            name={field.name}
            ref={field.ref}
            onBlur={field.onBlur}
            value={(field.value as string | undefined) ?? ''}
            type={type}
            placeholder={placeholder}
            className={className}
            onChange={
              onChangeOverride
                ? (e) => onChangeOverride(e, field.onChange)
                : field.onChange
            }
          />
        </FormControl>
        {hint && <p className="text-[11px] text-muted-foreground/80">{hint}</p>}
        <FormMessage />
      </FormItem>
    )}
  />
);

interface SelectFieldProps {
  control: Control<FormValues>;
  name: FieldName;
  label: string;
  required?: boolean;
  placeholder?: string;
  options: { value: string; label: string }[];
  rules?: FieldRules;
  disabled?: boolean;
}

const SelectField = ({
  control,
  name,
  label,
  required,
  placeholder,
  options,
  rules,
  disabled,
}: SelectFieldProps) => (
  <FormField
    control={control}
    name={name}
    rules={rules}
    render={({ field }) => (
      <FormItem className="space-y-1.5">
        <FormLabel className={labelClass}>
          {label}
          {required && <RequiredMark />}
        </FormLabel>
        <Select
          value={(field.value as string) ?? ''}
          onValueChange={field.onChange}
          disabled={disabled}
        >
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
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
        <FormMessage />
      </FormItem>
    )}
  />
);

const CreateIncomingInvoice = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const form = useForm<FormValues>({ defaultValues: getDefaultValues() });
  const [symbolsOpen, setSymbolsOpen] = useState(false);
  const createAnotherRef = useRef(false);

  const { activeCompanyId } = useAuth();
  const { data: companyResponse } = useCompanyGet(activeCompanyId ?? '');
  const isVatPayer = !!companyResponse?.data?.vatPayer;

  const { data: contacts = [] } = useListContacts<ContactResponseDto[]>({
    query: { select: (response) => response.data },
  });

  const sortedContacts = [...contacts].sort((a, b) =>
    (a.name ?? '').localeCompare(b.name ?? '', 'cs', { sensitivity: 'base' }),
  );
  const contactOptions = sortedContacts.map((c) => ({
    value: c.id,
    label: c.name ?? '-',
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

  const currency = form.watch('currency') || 'CZK';
  const isCzkCurrency = currency === 'CZK';
  const formatCurrency = (value: number) =>
    formatMoney(value, currency, i18n.language);

  // Editing base/VAT/total in a row re-derives the other two from the rate.
  const handleRateChange =
    (index: number, rate: number, field: RateField) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const next = recomputeRow(rate, field, e.target.value);
      form.setValue(`rates.${index}.base`, next.base);
      form.setValue(`rates.${index}.vat`, next.vat);
      form.setValue(`rates.${index}.total`, next.total);
    };

  // Keep the taxable, due and paid dates in step with the issue date until the
  // user touches them, and clear a stale exchange rate when switching to CZK.
  // Every due-date change always snaps the paid date to match (still editable).
  const syncPaidDate = (due: string) => {
    form.setValue('paidDate', due);
  };

  const handleCreatedDateChange = (
    e: ChangeEvent<HTMLInputElement>,
    onChange: (...event: unknown[]) => void,
  ) => {
    const value = e.target.value;
    onChange(value);
    if (!form.formState.dirtyFields.duzpDate) {
      form.setValue('duzpDate', value);
    }
    if (!form.formState.dirtyFields.dueDate) {
      const newDue = addDays(value, DEFAULT_PAYMENT_DAYS);
      form.setValue('dueDate', newDue);
      syncPaidDate(newDue);
    }
  };

  const handleDueDateChange = (
    e: ChangeEvent<HTMLInputElement>,
    onChange: (...event: unknown[]) => void,
  ) => {
    const value = e.target.value;
    onChange(value);
    syncPaidDate(value);
  };

  const duzpDate = form.watch('duzpDate');
  useEffect(() => {
    if (!duzpDate) return;
    if (form.formState.dirtyFields.vatClaimMonth) return;
    form.setValue('vatClaimMonth', duzpDate.slice(0, 7));
  }, [duzpDate, form]);

  useEffect(() => {
    if (isCzkCurrency) form.setValue('exchangeRate', '');
  }, [isCzkCurrency, form]);

  const watchedRates = form.watch('rates') ?? [];
  const grandTotals = watchedRates.reduce(
    (acc, row) => ({
      base: round2(acc.base + (Number(row.base) || 0)),
      vat: round2(acc.vat + (Number(row.vat) || 0)),
      total: round2(acc.total + (Number(row.total) || 0)),
    }),
    { base: 0, vat: 0, total: 0 },
  );

  const vatMode = form.watch('vatMode');
  const shouldClaimVat = form.watch('shouldClaimVat');
  const vatClaimType = form.watch('vatClaimType');
  // VAT-deduction evidence applies only in standard mode for VAT payers.
  const showVatClaim =
    isVatPayer && vatMode === CreateInvoiceDtoVatMode.STANDARD;

  const createMutation = useInvoiceCreate({
    mutation: {
      onSuccess: () => {
        enqueueSnackbar(t('invoices.messages.created'), { variant: 'success' });
        if (createAnotherRef.current) {
          createAnotherRef.current = false;
          form.reset(getDefaultValues());
          setSymbolsOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        navigate('/incoming-invoices');
      },
      onError: () => {
        enqueueSnackbar(t('invoices.messages.createFailed'), {
          variant: 'error',
        });
      },
    },
  });

  const onSubmit = (data: FormValues) => {
    const lines = data.rates
      .map((row) => ({
        rate: row.vatRate,
        base: round2(Number(row.base) || 0),
        vat: round2(Number(row.vat) || 0),
        total: round2(Number(row.total) || 0),
      }))
      .filter((line) => line.total > 0);

    if (lines.length === 0) {
      enqueueSnackbar(t('invoices.create.received.amountRequired'), {
        variant: 'error',
      });
      return;
    }

    // VAT payers split each line into base + rate; non-VAT payers record the
    // gross as the amount (no VAT mode, no deduction).
    const items: InvoiceItemDto[] = lines.map((line) => ({
      name: t('invoices.create.received.rateLineName', { rate: line.rate }),
      quantity: 1,
      unitPrice: isVatPayer ? line.base : line.total,
      total: isVatPayer ? line.base : line.total,
      vatRate: isVatPayer ? line.rate : undefined,
    }));

    const finalVatMode = isVatPayer
      ? data.vatMode
      : CreateInvoiceDtoVatMode.NON_VAT_PAYER;

    const bankSnapshot = {
      name: trimOrUndefined(data.bankName),
      number: trimOrUndefined(data.bankNumber),
      iban: trimOrUndefined(data.bankIban),
      swift: trimOrUndefined(data.bankSwift),
    };
    const hasBank = Object.values(bankSnapshot).some((v) => v != null);

    const sendVatClaim =
      isVatPayer &&
      finalVatMode === CreateInvoiceDtoVatMode.STANDARD &&
      data.shouldClaimVat;

    createMutation.mutate({
      data: {
        type: CreateInvoiceDtoType.RECEIVED,
        contactId: data.contactId,
        number: data.number.trim(),
        originalNumber: trimOrUndefined(data.originalNumber),
        currency: data.currency,
        vatMode: finalVatMode,
        exchangeRate:
          !isCzkCurrency && data.exchangeRate.trim() !== ''
            ? Number(data.exchangeRate)
            : undefined,
        createdDate: data.createdDate,
        duzpDate: data.duzpDate,
        dueDate: data.dueDate,
        paidDate: trimOrUndefined(data.paidDate),
        items,
        bankSnapshot: hasBank ? bankSnapshot : undefined,
        variableSymbol: trimOrUndefined(data.variableSymbol),
        specificSymbol: trimOrUndefined(data.specificSymbol),
        konstantSymbol: trimOrUndefined(data.konstantSymbol),
        note: trimOrUndefined(data.note),
        internalNote: trimOrUndefined(data.internalNote),
        ...(sendVatClaim
          ? {
              vatClaimType: data.vatClaimType,
              // Entered as a percentage; the API expects a fraction in (0,1].
              vatClaimRatio:
                data.vatClaimType === CreateInvoiceDtoVatClaimType.PARTIAL &&
                data.vatClaimRatio.trim() !== ''
                  ? Number(data.vatClaimRatio) / 100
                  : undefined,
              vatClaimMonth: data.vatClaimMonth
                ? `${data.vatClaimMonth.slice(0, 7)}-01`
                : undefined,
            }
          : {}),
      },
    });
  };

  const isPending = createMutation.isPending;

  return (
    <PageLayout>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mx-auto max-w-[860px] space-y-4"
        >
          {/* Header */}
          <div className="space-y-1">
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto gap-1 p-0 text-xs text-muted-foreground"
              onClick={() => navigate('/incoming-invoices')}
            >
              <ArrowLeft className="h-3 w-3" />
              {t('invoices.create.backReceived')}
            </Button>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                {t('invoices.create.titleReceived')}
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t('invoices.create.descriptionReceived')}
              </p>
            </div>
          </div>

          {/* Supplier */}
          <Card className="border-border/60 p-5 shadow-sm">
            <SelectField
              control={form.control}
              name="contactId"
              required
              label={t('invoices.fields.supplier')}
              placeholder={t('invoices.placeholders.selectSupplier')}
              options={contactOptions}
              rules={{
                required: t('invoices.validation.supplierRequired'),
              }}
            />
          </Card>

          {/* Numbers + dates (incl. the optional payment date) */}
          <Card className="border-border/60 p-5 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <TextField
                control={form.control}
                name="number"
                required
                label={t('invoices.fields.number')}
                placeholder={t('invoices.placeholders.number')}
                className="tabular-nums"
                rules={{ required: t('invoices.validation.numberRequired') }}
              />
              <TextField
                control={form.control}
                name="originalNumber"
                label={t('invoices.fields.originalNumber')}
                placeholder={t('invoices.placeholders.originalNumber')}
              />
              <TextField
                control={form.control}
                name="createdDate"
                required
                type="date"
                label={t('invoices.fields.createdDate')}
                className="tabular-nums"
                rules={{
                  required: t('invoices.validation.createdDateRequired'),
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
                rules={{ required: t('invoices.validation.duzpDateRequired') }}
              />
              <TextField
                control={form.control}
                name="dueDate"
                required
                type="date"
                label={t('invoices.fields.dueDate')}
                className="tabular-nums"
                rules={{ required: t('invoices.validation.dueDateRequired') }}
                onChangeOverride={handleDueDateChange}
              />
              <TextField
                control={form.control}
                name="paidDate"
                type="date"
                label={t('invoices.create.received.paidOn')}
                className="tabular-nums"
                placeholder={t('invoices.create.received.unpaid')}
              />
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
                />
              )}
              {!isCzkCurrency && (
                <TextField
                  control={form.control}
                  name="exchangeRate"
                  type="number"
                  label={t('invoices.fields.exchangeRate')}
                  placeholder={t('invoices.placeholders.exchangeRate')}
                />
              )}
            </div>
          </Card>

          {/* Payment symbols, supplier bank & notes — collapsed by default */}
          <Collapsible open={symbolsOpen} onOpenChange={setSymbolsOpen}>
            <Card className="border-border/60 p-0 shadow-sm">
              <CollapsibleTrigger className="flex w-full items-center gap-3 px-5 py-3.5 text-left">
                <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border-[1.5px] border-dashed border-muted-foreground/60 text-muted-foreground">
                  <Plus className="h-2.5 w-2.5" />
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
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      control={form.control}
                      name="bankName"
                      label={t('invoices.fields.bankName')}
                      placeholder={t('common.optional')}
                    />
                    <TextField
                      control={form.control}
                      name="bankNumber"
                      label={t('invoices.fields.bankNumber')}
                      placeholder="123456789/0100"
                    />
                    <TextField
                      control={form.control}
                      name="bankIban"
                      label={t('invoices.fields.bankIban')}
                      placeholder="CZ65..."
                    />
                    <TextField
                      control={form.control}
                      name="bankSwift"
                      label={t('invoices.fields.bankSwift')}
                      placeholder={t('common.optional')}
                    />
                  </div>
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

          {/* Amounts by VAT rate — no line items */}
          <Card className="border-border/60 p-5 shadow-sm">
            <p className={cn(labelClass, 'mb-2')}>
              {t('invoices.create.received.ratesTitle')}
              <RequiredMark />
            </p>

            {isVatPayer ? (
              <>
                <div className="overflow-hidden rounded-lg border">
                  <div className="grid grid-cols-[64px_1fr_1fr_1fr] items-center gap-3 border-b bg-muted/50 px-3.5 py-2 sm:grid-cols-[80px_1fr_1fr_1fr]">
                    <span className={colHeadClass}>
                      {t('simpleInvoices.create.rates.rate')}
                    </span>
                    <span className={cn(colHeadClass, 'text-right')}>
                      {t('simpleInvoices.create.rates.base')}
                    </span>
                    <span className={cn(colHeadClass, 'text-right')}>
                      {t('simpleInvoices.create.rates.vat')}
                    </span>
                    <span className={cn(colHeadClass, 'text-right')}>
                      {t('simpleInvoices.create.rates.totalWithVat')}
                    </span>
                  </div>
                  {watchedRates.map((row, index) => {
                    const isEmpty = !(Number(row.total) > 0);
                    const cellClass = (value: string) =>
                      cn(
                        'h-8 text-right text-sm tabular-nums',
                        !value && 'border-dashed',
                      );
                    return (
                      <div
                        key={row.vatRate}
                        className="grid grid-cols-[64px_1fr_1fr_1fr] items-center gap-3 border-b px-3.5 py-2.5 last:border-b-0 sm:grid-cols-[80px_1fr_1fr_1fr]"
                      >
                        <span
                          className={cn(
                            'text-sm font-semibold tabular-nums',
                            isEmpty && 'text-muted-foreground/70',
                          )}
                        >
                          {row.vatRate} %
                        </span>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="any"
                          min={0}
                          placeholder="0"
                          value={row.base}
                          onChange={handleRateChange(
                            index,
                            row.vatRate,
                            'base',
                          )}
                          className={cellClass(row.base)}
                        />
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="any"
                          min={0}
                          placeholder="0"
                          value={row.vat}
                          onChange={handleRateChange(index, row.vatRate, 'vat')}
                          disabled={row.vatRate === 0}
                          className={cellClass(row.vat)}
                        />
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="any"
                          min={0}
                          placeholder="0"
                          value={row.total}
                          onChange={handleRateChange(
                            index,
                            row.vatRate,
                            'total',
                          )}
                          className={cellClass(row.total)}
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <FormField
                control={form.control}
                name="rates.0.total"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className={labelClass}>
                      {t('invoices.create.received.totalAmount')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        inputMode="decimal"
                        step="any"
                        min={0}
                        placeholder="0"
                        className="text-right tabular-nums"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            {/* Totals */}
            <div className="mt-4 flex items-end justify-between border-t pt-3.5">
              <div className="flex gap-8">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {isVatPayer
                      ? t('invoices.create.received.baseTotal')
                      : t('invoices.create.received.totalDue')}
                  </p>
                  <p className="mt-0.5 text-sm font-medium tabular-nums">
                    {formatCurrency(
                      isVatPayer ? grandTotals.base : grandTotals.total,
                    )}
                  </p>
                </div>
                {isVatPayer && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t('invoices.create.received.vatTotal')}
                    </p>
                    <p className="mt-0.5 text-sm font-medium tabular-nums text-foreground/70">
                      {formatCurrency(grandTotals.vat)}
                    </p>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  {t('invoices.create.received.totalDue')}
                </p>
                <p className="mt-0.5 text-2xl font-bold tracking-tight tabular-nums">
                  {formatCurrency(grandTotals.total)}
                </p>
              </div>
            </div>
          </Card>

          {/* VAT deduction & control report */}
          {showVatClaim && (
            <Card className="border-border/60 p-5 shadow-sm">
              <p className={cn(sectionLabelClass, 'mb-3')}>
                {t('invoices.create.received.vatClaimSection')}
              </p>

              <FormField
                control={form.control}
                name="shouldClaimVat"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <div className="pr-4">
                      <FormLabel className="text-[13px] font-medium">
                        {t('invoices.vatClaim.shouldClaim')}
                      </FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {shouldClaimVat && (
                <>
                  <div className="mt-4 grid gap-4 border-t pt-4 sm:grid-cols-2">
                    <SelectField
                      control={form.control}
                      name="vatClaimType"
                      label={t('invoices.vatClaim.claimType.label')}
                      options={[
                        {
                          value: CreateInvoiceDtoVatClaimType.FULL,
                          label: t('invoices.vatClaim.claimType.options.FULL'),
                        },
                        {
                          value: CreateInvoiceDtoVatClaimType.PARTIAL,
                          label: t(
                            'invoices.vatClaim.claimType.options.PARTIAL',
                          ),
                        },
                      ]}
                    />
                    <TextField
                      control={form.control}
                      name="vatClaimMonth"
                      type="month"
                      label={t('invoices.vatClaim.claimMonth.label')}
                      className="tabular-nums"
                    />
                  </div>
                  {vatClaimType === CreateInvoiceDtoVatClaimType.PARTIAL && (
                    <div className="mt-4 max-w-[260px]">
                      <TextField
                        control={form.control}
                        name="vatClaimRatio"
                        type="number"
                        label={t('invoices.create.received.claimRatioLabel')}
                        placeholder={t(
                          'invoices.create.received.claimRatioPlaceholder',
                        )}
                        hint={t('invoices.create.received.claimRatioHint')}
                        className="tabular-nums"
                        rules={{
                          validate: (value) => {
                            if (
                              vatClaimType !==
                              CreateInvoiceDtoVatClaimType.PARTIAL
                            ) {
                              return true;
                            }
                            const raw = String(value ?? '').trim();
                            if (raw === '') {
                              return t(
                                'invoices.vatClaim.validation.ratioRequired',
                              );
                            }
                            const pct = Number(raw);
                            return (
                              (Number.isFinite(pct) && pct > 0 && pct < 100) ||
                              t('invoices.create.received.claimRatioRange')
                            );
                          },
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </Card>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 pb-8">
            <div className="flex gap-2">
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => {
                  createAnotherRef.current = true;
                }}
              >
                {t('invoices.create.received.saveAndNew')}
              </Button>
              <Button
                type="submit"
                size="sm"
                className="gap-1.5"
                disabled={isPending}
                onClick={() => {
                  createAnotherRef.current = false;
                }}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('invoices.create.received.submitting')}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    {t('invoices.create.received.save')}
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

export default CreateIncomingInvoice;
