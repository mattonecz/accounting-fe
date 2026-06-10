import { useEffect, useRef } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { FormCard } from '@/components/FormCard';
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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { InputController } from '@/components/InputController';
import { SelectController } from '@/components/SelectController';
import { InvoiceVatClaimCard } from '@/components/invoices/InvoiceVatClaimCard';
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
  CreateInvoiceDto,
  InvoiceItemDto,
  ReceiptParseDataDto,
} from '@/api/model';
import {
  CreateInvoiceDtoKind,
  CreateInvoiceDtoVatClaimType,
  InvoiceListByCompanyKind,
} from '@/api/model';
import { formatMoney } from '@/lib/formatters';

const MANUAL = '__manual__';
const DEFAULT_VAT_RATE = 21;
const VAT_RATE_OPTIONS = [21, 15, 12, 0];
// Legal limit for a simplified tax document (zjednodušený daňový doklad).
const MAX_TOTAL_WITH_VAT = 10000;

type SimpleInvoiceItem = {
  vatRate: number;
  base: number;
  total: number;
};

type FormValues = {
  // counterparty
  companySelect: string;
  companyName: string;
  companyIco: string;
  companyDic: string;
  // document
  number: string;
  createdDate: string;
  duzpDate: string;
  items: SimpleInvoiceItem[];
  description: string;
  // VAT claim
  shouldClaimVat?: boolean;
  vatClaimType?: CreateInvoiceDtoVatClaimType;
  vatClaimRatio?: number;
  vatClaimMonth?: string;
  vatClaimNote?: string;
};

const getDefaultFormValues = (): FormValues => ({
  companySelect: MANUAL,
  companyName: '',
  companyIco: '',
  companyDic: '',
  number: '',
  createdDate: new Date().toISOString().split('T')[0],
  duzpDate: new Date().toISOString().split('T')[0],
  items: [{ vatRate: DEFAULT_VAT_RATE, base: 0, total: 0 }],
  description: '',
  shouldClaimVat: true,
  vatClaimType: CreateInvoiceDtoVatClaimType.FULL,
  vatClaimRatio: undefined,
  vatClaimMonth: new Date().toISOString().slice(0, 7),
  vatClaimNote: '',
});

const round2 = (value: number) => Math.round(value * 100) / 100;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const buildItemsFromReceipt = (
  receipt: ReceiptParseDataDto,
): SimpleInvoiceItem[] => {
  const breakdown = receipt.vatBreakdown ?? [];
  if (breakdown.length > 0) {
    return breakdown.map((row) => {
      const rate = Number(row.rate) || 0;
      const base =
        row.base != null
          ? Number(row.base)
          : row.amount != null && rate > 0
            ? round2((Number(row.amount) * 100) / rate)
            : 0;
      const vat = row.amount != null ? Number(row.amount) : (base * rate) / 100;
      return { vatRate: rate, base: round2(base), total: round2(base + vat) };
    });
  }
  const total = receipt.total ?? 0;
  const vat = receipt.vat ?? 0;
  if (total > 0 && vat > 0 && total > vat) {
    const base = round2(total - vat);
    const derivedRate = base > 0 ? Math.round((vat / base) * 100) : 0;
    return [{ vatRate: derivedRate, base, total: round2(total) }];
  }
  return [
    {
      vatRate: DEFAULT_VAT_RATE,
      base: round2(total),
      total: round2(total * (1 + DEFAULT_VAT_RATE / 100)),
    },
  ];
};

const buildDefaultsFromReceipt = (
  receipt: ReceiptParseDataDto,
): FormValues => {
  const base = getDefaultFormValues();
  const date = receipt.date && ISO_DATE_RE.test(receipt.date)
    ? receipt.date
    : base.createdDate;
  const vendor = receipt.vendor?.trim() ?? '';
  const number = receipt.documentNumber?.trim() ?? '';
  return {
    ...base,
    companySelect: MANUAL,
    companyName: vendor,
    number,
    createdDate: date,
    duzpDate: date,
    items: buildItemsFromReceipt(receipt),
    vatClaimMonth: date.slice(0, 7),
  };
};

// Base and total-with-VAT are kept in sync while editing; VAT is the
// difference so the three displayed amounts always add up exactly.
const computeLine = (item: SimpleInvoiceItem) => {
  const base = round2(Number(item.base) || 0);
  const total = round2(Number(item.total) || 0);
  return { base, vat: round2(total - base), total };
};

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

  const { data: contacts = [], isLoading: isContactsLoading } =
    useListContacts<ContactResponseDto[]>({
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

  const itemsFieldArray = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Remembers per row whether the user last typed the base or the total, so
  // a VAT-rate change recomputes the other amount and keeps the typed one.
  const lastEditedRef = useRef<Record<string, 'base' | 'total'>>({});

  const syncLineFromBase = (index: number, base: number) => {
    const rate = Number(form.getValues(`items.${index}.vatRate`)) || 0;
    form.setValue(`items.${index}.total`, round2(base * (1 + rate / 100)));
  };

  const syncLineFromTotal = (index: number, total: number) => {
    const rate = Number(form.getValues(`items.${index}.vatRate`)) || 0;
    form.setValue(`items.${index}.base`, round2((total * 100) / (100 + rate)));
  };

  const handleRateChange = (index: number, fieldId: string, rate: number) => {
    if (lastEditedRef.current[fieldId] === 'total') {
      const total = Number(form.getValues(`items.${index}.total`)) || 0;
      form.setValue(`items.${index}.base`, round2((total * 100) / (100 + rate)));
    } else {
      const base = Number(form.getValues(`items.${index}.base`)) || 0;
      form.setValue(`items.${index}.total`, round2(base * (1 + rate / 100)));
    }
  };

  const watchedItems = form.watch('items') ?? [];
  const lineTotals = watchedItems.map(computeLine);
  const grandTotals = lineTotals.reduce(
    (acc, line) => ({
      base: round2(acc.base + line.base),
      vat: round2(acc.vat + line.vat),
      total: round2(acc.total + line.total),
    }),
    { base: 0, vat: 0, total: 0 },
  );

  const formatCzk = (value: number) => formatMoney(value, 'CZK', i18n.language);

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
          lastEditedRef.current = {};
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
    const counterparty = isManual
      ? {
          contact: {
            name: data.companyName.trim(),
            ico: data.companyIco.trim() || undefined,
            dic: data.companyDic.trim() || undefined,
          } satisfies ContactSnapshotDto,
        }
      : { contactId: data.companySelect };

    const sendVatClaim = isVatPayer && data.shouldClaimVat === true;
    const vatClaimFields: Pick<
      CreateInvoiceDto,
      'vatClaimType' | 'vatClaimRatio' | 'vatClaimMonth' | 'vatClaimNote'
    > = sendVatClaim
      ? {
          vatClaimType: data.vatClaimType,
          vatClaimRatio:
            data.vatClaimType === CreateInvoiceDtoVatClaimType.PARTIAL &&
            data.vatClaimRatio != null
              ? Number(data.vatClaimRatio)
              : undefined,
          vatClaimMonth: data.vatClaimMonth
            ? `${data.vatClaimMonth.slice(0, 7)}-01`
            : undefined,
          vatClaimNote: data.vatClaimNote?.trim() || undefined,
        }
      : {};

    const items: InvoiceItemDto[] = data.items.map((item) => {
      const { base } = computeLine(item);
      const rate = Number(item.vatRate) || 0;
      return {
        name: t('simpleInvoices.create.items.lineName', { rate }),
        quantity: 1,
        unitPrice: base,
        total: base,
        vatRate: rate,
      };
    });

    const totals = data.items.reduce(
      (acc, item) => {
        const line = computeLine(item);
        return {
          total: round2(acc.total + line.base),
          totalTax: round2(acc.totalTax + line.vat),
          totalWithTax: round2(acc.totalWithTax + line.total),
        };
      },
      { total: 0, totalTax: 0, totalWithTax: 0 },
    );

    if (totals.totalWithTax > MAX_TOTAL_WITH_VAT) {
      enqueueSnackbar(
        t('simpleInvoices.create.validation.totalLimitExceeded'),
        { variant: 'error' },
      );
      return;
    }

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
        description: data.description?.trim() || undefined,
        ...vatClaimFields,
      },
    });
  };

  const parseAmount = (value: string) => (value === '' ? 0 : Number(value));

  return (
    <PageLayout className="space-y-4">
      <PageHeader
        title={t('simpleInvoices.create.title')}
        description={t('simpleInvoices.create.description')}
        backButton
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormCard
            title={t('simpleInvoices.create.companySection')}
            titleClassName="text-center"
          >
            <div className="mx-auto max-w-3xl space-y-4">
              <SelectController
                control={form.control}
                name="companySelect"
                label={t('simpleInvoices.create.fields.companySelect')}
                placeholder={t(
                  'simpleInvoices.create.placeholders.companySelect',
                )}
                options={companyOptions}
                disabled={isContactsLoading}
              />
              <InputController
                control={form.control}
                name="companyName"
                label={t('simpleInvoices.create.fields.companyName')}
                disabled={!isManual}
                rules={{
                  validate: (value: unknown) =>
                    !isManual ||
                    !!String(value ?? '').trim() ||
                    t('simpleInvoices.create.validation.companyNameRequired'),
                }}
              />
              <InputController
                control={form.control}
                name="companyIco"
                label={t('simpleInvoices.create.fields.companyIco')}
                disabled={!isManual}
              />
              <InputController
                control={form.control}
                name="companyDic"
                label={t('simpleInvoices.create.fields.companyDic')}
                disabled={!isManual}
              />
            </div>
          </FormCard>

          <FormCard
            title={t('simpleInvoices.create.documentSection')}
            titleClassName="text-center"
          >
            <div className="mx-auto max-w-3xl space-y-4">
              <InputController
                control={form.control}
                name="number"
                label={t('simpleInvoices.create.fields.number')}
                placeholder="SI-2024-001"
              />
              <InputController
                control={form.control}
                name="createdDate"
                label={t('simpleInvoices.create.fields.createdDate')}
                type="date"
                className="w-[160px]"
                rules={{
                  required: t(
                    'simpleInvoices.create.validation.createdDateRequired',
                  ),
                }}
                onChangeOverride={(e, onChange) => {
                  onChange(e.target.value);
                  if (!form.formState.dirtyFields.duzpDate) {
                    form.setValue('duzpDate', e.target.value);
                  }
                }}
              />
              <InputController
                control={form.control}
                name="duzpDate"
                label={t('simpleInvoices.create.fields.duzpDate')}
                type="date"
                className="w-[160px]"
                rules={{
                  required: t(
                    'simpleInvoices.create.validation.duzpDateRequired',
                  ),
                }}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>
                      {t('simpleInvoices.create.fields.note')}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t(
                          'simpleInvoices.create.placeholders.note',
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </FormCard>

          <FormCard
            title={t('simpleInvoices.create.itemsSection')}
            actions={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  itemsFieldArray.append({
                    vatRate: DEFAULT_VAT_RATE,
                    base: 0,
                    total: 0,
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('simpleInvoices.create.items.addRate')}
              </Button>
            }
          >
            <div className="space-y-3">
              {itemsFieldArray.fields.map((field, index) => {
                const line = lineTotals[index] ?? { vat: 0, total: 0 };
                return (
                  <div
                    key={field.id}
                    className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-[130px_1fr_1fr_1fr_auto] sm:items-end sm:gap-2"
                  >
                    <FormField
                      control={form.control}
                      name={`items.${index}.vatRate`}
                      rules={{
                        required: t(
                          'simpleInvoices.create.validation.vatRateRequired',
                        ),
                      }}
                      render={({ field: f }) => {
                        const currentRate = Number(f.value ?? DEFAULT_VAT_RATE);
                        const rateOptions = VAT_RATE_OPTIONS.includes(
                          currentRate,
                        )
                          ? VAT_RATE_OPTIONS
                          : [...VAT_RATE_OPTIONS, currentRate].sort(
                              (a, b) => b - a,
                            );
                        return (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="text-xs">
                              {t('simpleInvoices.create.items.vatRate')}
                            </FormLabel>
                            <Select
                              value={String(currentRate)}
                              onValueChange={(value) => {
                                const rate = Number(value);
                                f.onChange(rate);
                                handleRateChange(index, field.id, rate);
                              }}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {rateOptions.map((rate) => (
                                  <SelectItem key={rate} value={String(rate)}>
                                    {rate}%
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.base`}
                      rules={{
                        required: t(
                          'simpleInvoices.create.validation.baseRequired',
                        ),
                        min: {
                          value: 0,
                          message: t(
                            'simpleInvoices.create.validation.baseMin',
                          ),
                        },
                      }}
                      render={({ field: f }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-xs">
                            {t('simpleInvoices.create.items.base')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="1"
                              inputMode="decimal"
                              placeholder="0.00"
                              {...f}
                              onChange={(e) => {
                                const value = parseAmount(e.target.value);
                                f.onChange(value);
                                lastEditedRef.current[field.id] = 'base';
                                syncLineFromBase(index, value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">
                        {t('simpleInvoices.create.items.vat')}
                      </p>
                      <p className="flex h-10 items-center rounded-md border border-dashed border-input bg-background px-3 text-sm tabular-nums">
                        {formatCzk(line.vat)}
                      </p>
                    </div>

                    <FormField
                      control={form.control}
                      name={`items.${index}.total`}
                      rules={{
                        required: t(
                          'simpleInvoices.create.validation.totalWithVatRequired',
                        ),
                        min: {
                          value: 0,
                          message: t(
                            'simpleInvoices.create.validation.totalWithVatMin',
                          ),
                        },
                      }}
                      render={({ field: f }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-xs">
                            {t('simpleInvoices.create.items.total')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="1"
                              inputMode="decimal"
                              placeholder="0.00"
                              {...f}
                              onChange={(e) => {
                                const value = parseAmount(e.target.value);
                                f.onChange(value);
                                lastEditedRef.current[field.id] = 'total';
                                syncLineFromTotal(index, value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="col-span-2 flex justify-end sm:col-span-1 sm:items-end sm:pb-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={t('simpleInvoices.create.items.remove')}
                        onClick={() => itemsFieldArray.remove(index)}
                        disabled={itemsFieldArray.fields.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              <div className="grid gap-2 rounded-lg border bg-secondary/40 p-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t('simpleInvoices.create.items.summaryBase')}
                  </p>
                  <p className="text-lg font-semibold tabular-nums">
                    {formatCzk(grandTotals.base)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t('simpleInvoices.create.items.summaryVat')}
                  </p>
                  <p className="text-lg font-semibold tabular-nums">
                    {formatCzk(grandTotals.vat)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t('simpleInvoices.create.items.summaryTotal')}
                  </p>
                  <p
                    className={`text-lg font-semibold tabular-nums ${
                      grandTotals.total > MAX_TOTAL_WITH_VAT
                        ? 'text-destructive'
                        : ''
                    }`}
                  >
                    {formatCzk(grandTotals.total)}
                  </p>
                </div>
                {grandTotals.total > MAX_TOTAL_WITH_VAT && (
                  <p className="text-sm font-medium text-destructive sm:col-span-3">
                    {t('simpleInvoices.create.validation.totalLimitExceeded')}
                  </p>
                )}
              </div>
            </div>
          </FormCard>

          {isVatPayer && <InvoiceVatClaimCard form={form} />}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/invoices/simple')}
            >
              {t('simpleInvoices.create.actions.cancel')}
            </Button>
            <Button
              type="submit"
              variant="secondary"
              disabled={createMutation.isPending}
              onClick={() => {
                createAnotherRef.current = true;
              }}
            >
              {t('simpleInvoices.create.actions.submitAndNew')}
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              onClick={() => {
                createAnotherRef.current = false;
              }}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('simpleInvoices.create.actions.submitting')}
                </>
              ) : (
                t('simpleInvoices.create.actions.submit')
              )}
            </Button>
          </div>
        </form>
      </Form>
    </PageLayout>
  );
};

export default CreateSimpleInvoice;
