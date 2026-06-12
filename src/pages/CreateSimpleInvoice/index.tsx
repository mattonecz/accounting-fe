import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
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
import { Label } from '@/components/ui/label';
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
import {
  getInvoiceListByCompanyQueryKey,
  useInvoiceCreate,
} from '@/api/invoices/invoices';
import { useCompanyGet } from '@/api/companies/companies';
import { useAuth } from '@/contexts/AuthContext';
import type {
  ContactResponseDto,
  ContactSnapshotDto,
  InvoiceItemDto,
  ReceiptParseDataDto,
} from '@/api/model';
import {
  CreateInvoiceDtoKind,
  CreateInvoiceDtoVatClaimType,
  InvoiceListByCompanyKind,
} from '@/api/model';
import { formatMoney } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const MANUAL = '__manual__';
const DEFAULT_VAT_RATE = 21;
// One fixed row per current Czech VAT rate — the user only types totals.
const DEFAULT_RATES = [21, 12, 0];
// Legal limit for a simplified tax document (zjednodušený daňový doklad).
const MAX_TOTAL_WITH_VAT = 10000;

type RateRowValue = {
  vatRate: number;
  /** Total incl. VAT as typed; empty string means no amount for this rate. */
  total: string;
};

type FormValues = {
  // counterparty (optional)
  companySelect: string;
  companyName: string;
  companyIco: string;
  companyDic: string;
  // document
  number: string;
  createdDate: string;
  duzpDate: string;
  rates: RateRowValue[];
  description: string;
  // VAT claim
  shouldClaimVat: boolean;
  vatClaimType: CreateInvoiceDtoVatClaimType;
  /** Kept as the typed string; parsed to number on submit. */
  vatClaimRatio: string;
  vatClaimMonth: string;
};

const getDefaultRates = (): RateRowValue[] =>
  DEFAULT_RATES.map((vatRate) => ({ vatRate, total: '' }));

const getDefaultFormValues = (): FormValues => ({
  companySelect: MANUAL,
  companyName: '',
  companyIco: '',
  companyDic: '',
  number: '',
  createdDate: new Date().toISOString().split('T')[0],
  duzpDate: new Date().toISOString().split('T')[0],
  rates: getDefaultRates(),
  description: '',
  shouldClaimVat: true,
  vatClaimType: CreateInvoiceDtoVatClaimType.FULL,
  vatClaimRatio: '',
  vatClaimMonth: new Date().toISOString().slice(0, 7),
});

const round2 = (value: number) => Math.round(value * 100) / 100;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Base is derived from the typed total so the three amounts always add up.
const computeLine = (row: RateRowValue) => {
  const total = round2(Number(row.total) || 0);
  const base = round2((total * 100) / (100 + row.vatRate));
  return { base, vat: round2(total - base), total };
};

const buildRatesFromReceipt = (
  receipt: ReceiptParseDataDto,
): RateRowValue[] => {
  const totals = new Map<number, number>(DEFAULT_RATES.map((r) => [r, 0]));
  const addTotal = (rate: number, total: number) =>
    totals.set(rate, round2((totals.get(rate) ?? 0) + total));

  const breakdown = receipt.vatBreakdown ?? [];
  if (breakdown.length > 0) {
    for (const row of breakdown) {
      const rate = Number(row.rate) || 0;
      const base =
        row.base != null
          ? Number(row.base)
          : row.amount != null && rate > 0
            ? round2((Number(row.amount) * 100) / rate)
            : 0;
      const vat = row.amount != null ? Number(row.amount) : (base * rate) / 100;
      addTotal(rate, round2(base + vat));
    }
  } else {
    const total = receipt.total ?? 0;
    const vat = receipt.vat ?? 0;
    if (total > 0 && vat > 0 && total > vat) {
      const base = round2(total - vat);
      const derivedRate = base > 0 ? Math.round((vat / base) * 100) : 0;
      addTotal(derivedRate, round2(total));
    } else if (total > 0) {
      addTotal(DEFAULT_VAT_RATE, round2(total * (1 + DEFAULT_VAT_RATE / 100)));
    }
  }

  return [...totals.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([vatRate, total]) => ({
      vatRate,
      total: total > 0 ? String(total) : '',
    }));
};

const buildDefaultsFromReceipt = (receipt: ReceiptParseDataDto): FormValues => {
  const base = getDefaultFormValues();
  const date =
    receipt.date && ISO_DATE_RE.test(receipt.date)
      ? receipt.date
      : base.createdDate;
  return {
    ...base,
    companyName: receipt.vendor?.trim() ?? '',
    number: receipt.documentNumber?.trim() ?? '',
    createdDate: date,
    duzpDate: date,
    rates: buildRatesFromReceipt(receipt),
    description: receipt.description?.trim() ?? '',
    vatClaimMonth: date.slice(0, 7),
  };
};

const labelClass = 'text-[11px] font-semibold text-foreground/80';

const RequiredMark = () => <span className="ml-0.5 text-destructive">*</span>;

const CreateSimpleInvoice = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const receiptFromState = (
    location.state as { receipt?: ReceiptParseDataDto } | null
  )?.receipt;

  const form = useForm<FormValues>({
    defaultValues: receiptFromState
      ? buildDefaultsFromReceipt(receiptFromState)
      : getDefaultFormValues(),
  });

  const [companyOpen, setCompanyOpen] = useState(
    () => !!receiptFromState?.vendor?.trim(),
  );

  const prefillAppliedRef = useRef(false);
  useEffect(() => {
    if (prefillAppliedRef.current || !receiptFromState) return;
    prefillAppliedRef.current = true;
    form.reset(buildDefaultsFromReceipt(receiptFromState));
    window.history.replaceState({}, '');
  }, [receiptFromState, form]);

  const { activeCompanyId } = useAuth();
  const { data: companyResponse } = useCompanyGet(activeCompanyId ?? '');
  const isVatPayer = !!companyResponse?.data?.vatPayer;

  const { data: contacts = [], isLoading: isContactsLoading } = useListContacts<
    ContactResponseDto[]
  >({
    query: { select: (response) => response.data },
  });

  const companySelect = form.watch('companySelect');
  const isManual = companySelect === MANUAL;

  // Mirror the selected contact's identifiers into the (disabled) company
  // fields, and clear them when the user switches back to manual entry.
  const prevCompanySelectRef = useRef(companySelect);
  useEffect(() => {
    if (prevCompanySelectRef.current === companySelect) return;
    prevCompanySelectRef.current = companySelect;
    if (companySelect === MANUAL) {
      form.setValue('companyName', '');
      form.setValue('companyIco', '');
      form.setValue('companyDic', '');
      return;
    }
    const contact = contacts.find((c) => c.id === companySelect);
    if (!contact) return;
    form.setValue('companyName', contact.name ?? '');
    form.setValue('companyIco', contact.ico ?? '');
    form.setValue('companyDic', contact.dic ?? '');
  }, [companySelect, contacts, form]);

  const duzpDate = form.watch('duzpDate');
  useEffect(() => {
    if (!duzpDate) return;
    const claimMonthDirty = form.formState.dirtyFields.vatClaimMonth ?? false;
    if (claimMonthDirty) return;
    form.setValue('vatClaimMonth', duzpDate.slice(0, 7));
  }, [duzpDate, form]);

  const companyOptions = [
    { value: MANUAL, label: t('simpleInvoices.create.manualOption') },
    ...contacts.map((contact) => ({ value: contact.id, label: contact.name })),
  ];

  const watchedRates = form.watch('rates') ?? [];
  const lineTotals = watchedRates.map(computeLine);
  const grandTotals = lineTotals.reduce(
    (acc, line) => ({
      base: round2(acc.base + line.base),
      vat: round2(acc.vat + line.vat),
      total: round2(acc.total + line.total),
    }),
    { base: 0, vat: 0, total: 0 },
  );
  const overLimit = grandTotals.total > MAX_TOTAL_WITH_VAT;

  const formatCzk = (value: number) => formatMoney(value, 'CZK', i18n.language);
  const numberFormat = new Intl.NumberFormat(i18n.language, {
    maximumFractionDigits: 2,
  });

  const shouldClaimVat = form.watch('shouldClaimVat');
  const vatClaimType = form.watch('vatClaimType');

  const createAnotherRef = useRef(false);

  const createMutation = useInvoiceCreate({
    mutation: {
      onSuccess: async () => {
        enqueueSnackbar(t('simpleInvoices.create.messages.created'), {
          variant: 'success',
        });
        await queryClient.invalidateQueries({
          queryKey: getInvoiceListByCompanyQueryKey({
            kind: InvoiceListByCompanyKind.SIMPLE,
          }),
        });
        if (createAnotherRef.current) {
          createAnotherRef.current = false;
          form.reset(getDefaultFormValues());
          prevCompanySelectRef.current = MANUAL;
          setCompanyOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        navigate('/invoices/simple');
      },
      onError: () => {
        enqueueSnackbar(t('simpleInvoices.create.messages.createFailed'), {
          variant: 'error',
        });
      },
    },
  });

  const onSubmit = (data: FormValues) => {
    const lines = data.rates
      .map((row) => ({ rate: row.vatRate, ...computeLine(row) }))
      .filter((line) => line.total > 0);

    if (lines.length === 0) {
      enqueueSnackbar(t('simpleInvoices.create.validation.amountRequired'), {
        variant: 'error',
      });
      return;
    }

    const totals = lines.reduce(
      (acc, line) => ({
        total: round2(acc.total + line.base),
        totalTax: round2(acc.totalTax + line.vat),
        totalWithTax: round2(acc.totalWithTax + line.total),
      }),
      { total: 0, totalTax: 0, totalWithTax: 0 },
    );

    if (totals.totalWithTax > MAX_TOTAL_WITH_VAT) {
      enqueueSnackbar(
        t('simpleInvoices.create.validation.totalLimitExceeded'),
        {
          variant: 'error',
        },
      );
      return;
    }

    const items: InvoiceItemDto[] = lines.map((line) => ({
      name: t('simpleInvoices.create.rates.lineName', { rate: line.rate }),
      quantity: 1,
      unitPrice: line.base,
      total: line.base,
      vatRate: line.rate,
    }));

    // Counterparty is optional on a simplified receipt — send it only when
    // a contact is selected or a manual name was entered.
    const manualName = data.companyName.trim();
    const counterparty = !isManual
      ? { contactId: data.companySelect }
      : manualName
        ? {
            contact: {
              name: manualName,
              ico: data.companyIco.trim() || undefined,
              dic: data.companyDic.trim() || undefined,
            } satisfies ContactSnapshotDto,
          }
        : {};

    const sendVatClaim = isVatPayer && data.shouldClaimVat;

    createMutation.mutate({
      data: {
        kind: CreateInvoiceDtoKind.SIMPLE,
        ...counterparty,
        number: data.number.trim() || undefined,
        createdDate: data.createdDate,
        duzpDate: data.duzpDate,
        items,
        total: totals.total,
        totalTax: totals.totalTax,
        totalWithTax: totals.totalWithTax,
        description: data.description.trim(),
        ...(sendVatClaim
          ? {
              vatClaimType: data.vatClaimType,
              vatClaimRatio:
                data.vatClaimType === CreateInvoiceDtoVatClaimType.PARTIAL &&
                data.vatClaimRatio.trim() !== ''
                  ? Number(data.vatClaimRatio)
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

  const submitButtons = (
    <>
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => {
          createAnotherRef.current = true;
        }}
      >
        {t('simpleInvoices.create.actions.saveAndNew')}
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
            {t('simpleInvoices.create.actions.submitting')}
          </>
        ) : (
          <>
            <Check className="h-4 w-4" />
            {t('simpleInvoices.create.actions.save')}
          </>
        )}
      </Button>
    </>
  );

  return (
    <PageLayout>
      <Form {...form}>
        {/* Intentionally narrow — it's a simple form. */}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mx-auto max-w-[760px] space-y-4"
        >
          {/* Header */}
          <div className="space-y-1">
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto gap-1 p-0 text-xs text-muted-foreground"
              onClick={() => navigate('/invoices/simple')}
            >
              <ArrowLeft className="h-3 w-3" />
              {t('simpleInvoices.create.back')}
            </Button>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  {t('simpleInvoices.create.title')}
                </h1>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t('simpleInvoices.create.description')}
                </p>
              </div>
            </div>
          </div>

          {/* Main card: description + dates + amounts */}
          <Card className="border-border/60 p-5 shadow-sm">
            <FormField
              control={form.control}
              name="description"
              rules={{
                validate: (value) =>
                  !!value.trim() ||
                  t('simpleInvoices.create.validation.descriptionRequired'),
              }}
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className={labelClass}>
                    {t('simpleInvoices.create.fields.description')}
                    <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t(
                        'simpleInvoices.create.placeholders.description',
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className={labelClass}>
                      {t('simpleInvoices.create.fields.number')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t(
                          'simpleInvoices.create.placeholders.number',
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="createdDate"
                rules={{
                  required: t(
                    'simpleInvoices.create.validation.createdDateRequired',
                  ),
                }}
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className={labelClass}>
                      {t('simpleInvoices.create.fields.createdDate')}
                      <RequiredMark />
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        className="tabular-nums"
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          if (!form.formState.dirtyFields.duzpDate) {
                            form.setValue('duzpDate', e.target.value);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duzpDate"
                rules={{
                  required: t(
                    'simpleInvoices.create.validation.duzpDateRequired',
                  ),
                }}
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className={labelClass}>
                      {t('simpleInvoices.create.fields.duzpDate')}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="date" className="tabular-nums" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Amounts per VAT rate */}
            <p className={cn(labelClass, 'mb-1.5 mt-5')}>
              {t('simpleInvoices.create.rates.title')}
              <RequiredMark />
            </p>
            <div className="overflow-hidden rounded-lg border">
              <div className="grid grid-cols-[72px_1fr_1fr_1fr] items-center gap-3 border-b bg-muted/50 px-3.5 py-2 sm:grid-cols-[90px_1fr_1fr_1fr]">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('simpleInvoices.create.rates.rate')}
                </span>
                <span className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('simpleInvoices.create.rates.totalWithVat')}
                </span>
                <span className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('simpleInvoices.create.rates.base')}
                </span>
                <span className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('simpleInvoices.create.rates.vat')}
                </span>
              </div>
              {watchedRates.map((row, index) => {
                const line = lineTotals[index] ?? { base: 0, vat: 0, total: 0 };
                const isEmpty = line.total <= 0;
                return (
                  <div
                    key={row.vatRate}
                    className="grid grid-cols-[72px_1fr_1fr_1fr] items-center gap-3 border-b px-3.5 py-2.5 last:border-b-0 sm:grid-cols-[90px_1fr_1fr_1fr]"
                  >
                    <span
                      className={cn(
                        'text-sm font-semibold tabular-nums',
                        isEmpty && 'text-muted-foreground/70',
                      )}
                    >
                      {row.vatRate} %
                    </span>
                    <FormField
                      control={form.control}
                      name={`rates.${index}.total`}
                      rules={{
                        validate: (value) =>
                          value === '' ||
                          Number(value) >= 0 ||
                          t('simpleInvoices.create.validation.totalMin'),
                      }}
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              inputMode="decimal"
                              step="any"
                              min={0}
                              placeholder="0"
                              className={cn(
                                'h-8 text-right text-sm tabular-nums',
                                isEmpty && 'border-dashed',
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <span className="text-right text-xs tabular-nums text-muted-foreground">
                      {isEmpty ? '—' : numberFormat.format(line.base)}
                    </span>
                    <span className="text-right text-xs tabular-nums text-muted-foreground">
                      {isEmpty ? '—' : numberFormat.format(line.vat)}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground/80">
              {t('simpleInvoices.create.rates.hint')}
            </p>

            {/* Total */}
            <div className="mt-4 flex items-baseline justify-between border-t pt-3.5">
              <span className="text-sm font-semibold">
                {t('simpleInvoices.create.total.label')}
              </span>
              <div className="text-right">
                <p
                  className={cn(
                    'text-2xl font-bold tracking-tight tabular-nums',
                    overLimit && 'text-destructive',
                  )}
                >
                  {formatCzk(grandTotals.total)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('simpleInvoices.create.total.vatIncluded', {
                    amount: formatCzk(grandTotals.vat),
                  })}
                </p>
              </div>
            </div>
            {overLimit && (
              <p className="mt-2 text-right text-xs font-medium text-destructive">
                {t('simpleInvoices.create.validation.totalLimitExceeded')}
              </p>
            )}
          </Card>

          {/* Optional company — collapsed by default */}
          <Collapsible open={companyOpen} onOpenChange={setCompanyOpen}>
            <Card className="border-border/60 p-0 shadow-sm">
              <CollapsibleTrigger className="flex w-full items-center gap-3 px-5 py-3.5 text-left">
                <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border-[1.5px] border-dashed border-muted-foreground/60 text-muted-foreground">
                  <Plus className="h-2.5 w-2.5" />
                </span>
                <span className="flex-1">
                  <span className="block text-[13px] font-medium">
                    {t('simpleInvoices.create.company.add')}
                  </span>
                  <span className="block text-xs text-muted-foreground/80">
                    {t('simpleInvoices.create.company.subtitle')}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform',
                    companyOpen && 'rotate-180',
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-4 px-5 pb-5 pt-1">
                  <FormField
                    control={form.control}
                    name="companySelect"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className={labelClass}>
                          {t('simpleInvoices.create.fields.companySelect')}
                        </FormLabel>
                        <Select
                          value={field.value}
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
                            {companyOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyName"
                    rules={{
                      validate: (value) => {
                        if (!isManual) return true;
                        const hasIdentifiers =
                          !!form.getValues('companyIco').trim() ||
                          !!form.getValues('companyDic').trim();
                        return (
                          !hasIdentifiers ||
                          !!value.trim() ||
                          t(
                            'simpleInvoices.create.validation.companyNameRequired',
                          )
                        );
                      },
                    }}
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className={labelClass}>
                          {t('simpleInvoices.create.fields.companyName')}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isManual} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="companyIco"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className={labelClass}>
                            {t('simpleInvoices.create.fields.companyIco')}
                          </FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isManual} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="companyDic"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className={labelClass}>
                            {t('simpleInvoices.create.fields.companyDic')}
                          </FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isManual} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* VAT return & control report */}
          {isVatPayer && (
            <Card className="border-border/60 p-5 shadow-sm">
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t('simpleInvoices.create.vatClaim.section')}
              </p>

              <FormField
                control={form.control}
                name="shouldClaimVat"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <div>
                      <FormLabel className="text-[13px] font-medium">
                        {t('simpleInvoices.create.vatClaim.claim')}
                      </FormLabel>
                      <p className="text-xs text-muted-foreground/80">
                        {t('simpleInvoices.create.vatClaim.claimDescription')}
                      </p>
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
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="vatClaimType"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className={labelClass}>
                            {t('invoices.vatClaim.claimType.label')}
                          </FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem
                                value={CreateInvoiceDtoVatClaimType.FULL}
                              >
                                {t('invoices.vatClaim.claimType.options.FULL')}
                              </SelectItem>
                              <SelectItem
                                value={CreateInvoiceDtoVatClaimType.PARTIAL}
                              >
                                {t(
                                  'invoices.vatClaim.claimType.options.PARTIAL',
                                )}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {vatClaimType === CreateInvoiceDtoVatClaimType.PARTIAL && (
                      <FormField
                        control={form.control}
                        name="vatClaimRatio"
                        rules={{
                          validate: (value) => {
                            if (
                              vatClaimType !==
                              CreateInvoiceDtoVatClaimType.PARTIAL
                            ) {
                              return true;
                            }
                            if (value.trim() === '') {
                              return t(
                                'invoices.vatClaim.validation.ratioRequired',
                              );
                            }
                            const ratio = Number(value);
                            return (
                              (Number.isFinite(ratio) &&
                                ratio > 0 &&
                                ratio < 1) ||
                              t('invoices.vatClaim.validation.ratioRange')
                            );
                          },
                        }}
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className={labelClass}>
                              {t('invoices.vatClaim.claimRatio.label')}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                min={0}
                                max={1}
                                placeholder={t(
                                  'invoices.vatClaim.claimRatio.placeholder',
                                )}
                                className="tabular-nums"
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground/80">
                              {t('invoices.vatClaim.claimRatio.hint')}
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="vatClaimMonth"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className={labelClass}>
                            {t('simpleInvoices.create.vatClaim.period')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="month"
                              className="tabular-nums"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-1.5">
                      <Label className={labelClass}>
                        {t('simpleInvoices.create.vatClaim.khSection')}
                      </Label>
                      {/* The section is fixed for simplified receipts — shown for context only. */}
                      <p className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground">
                        {t('simpleInvoices.create.vatClaim.khValue')}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground/80">
                    {t('simpleInvoices.create.vatClaim.hint')}
                  </p>
                </>
              )}
            </Card>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-between gap-2 pb-8">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => navigate('/invoices/simple')}
            >
              {t('simpleInvoices.create.actions.cancel')}
            </Button>
            <div className="flex gap-2">{submitButtons}</div>
          </div>
        </form>
      </Form>
    </PageLayout>
  );
};

export default CreateSimpleInvoice;
