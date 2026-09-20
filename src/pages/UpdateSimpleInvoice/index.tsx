import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { RequiredMark, labelClass } from '@/components/invoices/formFields';
import {
  MANUAL_SUPPLIER,
  SupplierFields,
} from '@/components/invoices/SupplierFields';
import { InvoiceLockedNotice } from '@/components/invoices/InvoiceLockedNotice';
import { isInvoiceLocked } from '@/lib/invoiceLock';
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
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useListContacts } from '@/api/contacts/contacts';
import {
  getInvoiceGetQueryKey,
  getInvoiceListByCompanyQueryKey,
  useInvoiceGet,
  useInvoiceUpdate,
} from '@/api/invoices/invoices';
import { useCompanyGet } from '@/api/companies/companies';
import { useAuth } from '@/contexts/AuthContext';
import type { ContactSnapshotDto, InvoiceItemDto } from '@/api/model';
import {
  InvoiceListByCompanyKind,
  UpdateInvoiceDtoVatClaimStatus,
  UpdateInvoiceDtoVatClaimType,
} from '@/api/model';
import { getApiErrorMessage } from '@/lib/apiError';
import { formatMoney } from '@/lib/formatters';
import { rateItemName } from '@/lib/simpleInvoiceItems';
import { cn } from '@/lib/utils';
import {
  getDefaultRateRows,
  invoiceItemsToRates,
  recomputeRow,
  round2,
  sumRates,
  type RateField,
  type RateRowValue,
} from '@/components/invoices/rateAmounts';
import { RateAmountsTable } from '@/components/invoices/RateAmountsTable';

// Legal limit for a simplified tax document (zjednodušený daňový doklad).
const MAX_TOTAL_WITH_VAT = 10000;

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
  vatClaimType: UpdateInvoiceDtoVatClaimType;
  /** Kept as the typed string; parsed to number on submit. */
  vatClaimRatio: string;
  vatClaimMonth: string;
};

const getDefaultFormValues = (): FormValues => ({
  companySelect: MANUAL_SUPPLIER,
  companyName: '',
  companyIco: '',
  companyDic: '',
  number: '',
  createdDate: new Date().toISOString().split('T')[0],
  duzpDate: new Date().toISOString().split('T')[0],
  rates: getDefaultRateRows(),
  description: '',
  shouldClaimVat: true,
  vatClaimType: UpdateInvoiceDtoVatClaimType.FULL,
  vatClaimRatio: '',
  vatClaimMonth: new Date().toISOString().slice(0, 7),
});

const UpdateSimpleInvoice = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const form = useForm<FormValues>({ defaultValues: getDefaultFormValues() });

  const { activeCompanyId } = useAuth();
  const { data: companyResponse, isError: companyError } = useCompanyGet(
    activeCompanyId ?? '',
  );
  const isVatPayer = !!companyResponse?.data?.vatPayer;

  const {
    data: invoiceResponse,
    isLoading: isInvoiceLoading,
    isError: isInvoiceError,
  } = useInvoiceGet(id || '');
  const {
    data: contactsResponse,
    isLoading: isContactsLoading,
    isError: contactsError,
  } = useListContacts();
  const contacts = useMemo(
    () => contactsResponse?.data ?? [],
    [contactsResponse?.data],
  );

  // The company Select only renders a value whose <SelectItem> it has already
  // seen, so we hold the form back until the prefill has run. Contacts and the
  // company (VAT-payer flag) must be settled first.
  const listsReady =
    (!!contactsResponse || contactsError) &&
    (!!companyResponse || companyError);
  // Track which invoice the form was prefilled for and derive the gate from it
  // (rather than a ref + separate boolean) so it stays correct under React
  // StrictMode's double-mount and React Query cache hits — otherwise the gate
  // could stay stuck closed when navigating in with a warm cache.
  const [prefilledId, setPrefilledId] = useState<string | null>(null);

  useEffect(() => {
    const invoice = invoiceResponse?.data;
    if (!invoice || !listsReady) return;
    if (prefilledId === invoice.id) return;

    const matchedContact =
      !!invoice.contactId && contacts.some((c) => c.id === invoice.contactId);
    const snapshot = invoice.contactSnapshot;

    form.reset({
      companySelect: matchedContact
        ? (invoice.contactId as string)
        : MANUAL_SUPPLIER,
      companyName: snapshot?.name ?? '',
      companyIco: snapshot?.ico ?? '',
      companyDic: snapshot?.dic ?? '',
      number: invoice.number ?? '',
      createdDate: invoice.createdDate,
      duzpDate: invoice.duzpDate,
      rates: invoiceItemsToRates(invoice.items, true),
      description: invoice.description ?? '',
      shouldClaimVat:
        invoice.vatClaimStatus == null
          ? true
          : invoice.vatClaimStatus !== UpdateInvoiceDtoVatClaimStatus.SKIPPED,
      vatClaimType:
        (invoice.vatClaimType as UpdateInvoiceDtoVatClaimType | undefined) ??
        UpdateInvoiceDtoVatClaimType.FULL,
      vatClaimRatio:
        invoice.vatClaimRatio != null ? String(invoice.vatClaimRatio) : '',
      vatClaimMonth: invoice.vatClaimMonth
        ? invoice.vatClaimMonth.slice(0, 7)
        : (invoice.duzpDate?.slice(0, 7) ?? ''),
    });
    setPrefilledId(invoice.id);
  }, [
    form,
    invoiceResponse?.data,
    listsReady,
    contacts,
    prefilledId,
    isVatPayer,
  ]);

  // Open the form only once the prefill has run for the invoice now loaded.
  const isPrefilled =
    !!invoiceResponse?.data && prefilledId === invoiceResponse.data.id;

  // A document linked to an existing contact only accepts contactId on update,
  // so manual entry is not offered for it.
  const linkedContactId = invoiceResponse?.data?.contactId;
  const isLinkedToContact =
    !!linkedContactId && contacts.some((c) => c.id === linkedContactId);

  const companySelect = form.watch('companySelect');
  const isManual = companySelect === MANUAL_SUPPLIER;

  // Mirror the selected contact's identifiers into the (disabled) company
  // fields, and clear them when the user switches back to manual entry.
  const prevCompanySelectRef = useRef(companySelect);
  useEffect(() => {
    if (prevCompanySelectRef.current === companySelect) return;
    prevCompanySelectRef.current = companySelect;
    if (companySelect === MANUAL_SUPPLIER) {
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

  const watchedRates = form.watch('rates') ?? [];
  const grandTotals = sumRates(watchedRates);
  const overLimit = grandTotals.total > MAX_TOTAL_WITH_VAT;

  const handleRateCellChange = (
    index: number,
    field: RateField,
    rawValue: string,
  ) => {
    const rate = form.getValues(`rates.${index}.vatRate`) ?? 0;
    const next = recomputeRow(rate, field, rawValue);
    form.setValue(`rates.${index}.base`, next.base);
    form.setValue(`rates.${index}.vat`, next.vat);
    form.setValue(`rates.${index}.total`, next.total);
  };

  const formatCzk = (value: number) => formatMoney(value, 'CZK', i18n.language);

  const shouldClaimVat = form.watch('shouldClaimVat');
  const vatClaimType = form.watch('vatClaimType');

  const { mutate: updateInvoice, isPending } = useInvoiceUpdate();

  const onSubmit = (data: FormValues) => {
    const invoice = invoiceResponse?.data;
    if (!id || !invoice) return;

    const lines = data.rates
      .map((row) => ({
        rate: row.vatRate,
        base: round2(Number(row.base) || 0),
        vat: round2(Number(row.vat) || 0),
        total: round2(Number(row.total) || 0),
      }))
      .filter((line) => line.total > 0);

    const totals = lines.reduce(
      (acc, line) => ({
        total: round2(acc.total + line.base),
        totalTax: round2(acc.totalTax + line.vat),
        totalWithTax: round2(acc.totalWithTax + line.total),
      }),
      { total: 0, totalTax: 0, totalWithTax: 0 },
    );

    const items: InvoiceItemDto[] = lines.map((line) => ({
      name: rateItemName(line.rate),
      quantity: 1,
      unitPrice: line.base,
      total: line.base,
      vatRate: line.rate,
    }));

    // The backend needs a counterparty: a picked contact goes as contactId, a
    // manual name as a snapshot. A document already linked to a contact only
    // accepts contactId, which is why the supplier field hides manual entry for
    // it (`invoices.service.ts` — "This invoice is linked to a contact").
    const counterparty = !isManual
      ? { contactId: data.companySelect }
      : {
          contact: {
            name: data.companyName.trim(),
            ico: data.companyIco.trim() || undefined,
            dic: data.companyDic.trim() || undefined,
          } satisfies ContactSnapshotDto,
        };

    const isVatClaimApplicable = isVatPayer;
    const sendVatClaim = isVatClaimApplicable && data.shouldClaimVat;
    const vatClaimFields = sendVatClaim
      ? {
          vatClaimType: data.vatClaimType,
          vatClaimRatio:
            data.vatClaimType === UpdateInvoiceDtoVatClaimType.PARTIAL &&
            data.vatClaimRatio.trim() !== ''
              ? Number(data.vatClaimRatio)
              : undefined,
          vatClaimMonth: data.vatClaimMonth
            ? `${data.vatClaimMonth.slice(0, 7)}-01`
            : undefined,
          vatClaimStatus: UpdateInvoiceDtoVatClaimStatus.PENDING,
        }
      : isVatClaimApplicable
        ? { vatClaimStatus: UpdateInvoiceDtoVatClaimStatus.SKIPPED }
        : {};

    updateInvoice(
      {
        data: {
          id,
          ...counterparty,
          number: data.number.trim() || null,
          createdDate: data.createdDate,
          duzpDate: data.duzpDate,
          items,
          total: totals.total,
          totalTax: totals.totalTax,
          totalWithTax: totals.totalWithTax,
          description: data.description.trim(),
          ...vatClaimFields,
        },
      },
      {
        onSuccess: async (response) => {
          enqueueSnackbar(t('simpleInvoices.update.messages.updated'), {
            variant: 'success',
          });
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: getInvoiceListByCompanyQueryKey({
                kind: InvoiceListByCompanyKind.SIMPLE,
              }),
            }),
            queryClient.invalidateQueries({
              queryKey: getInvoiceGetQueryKey(id),
            }),
          ]);
          navigate(`/invoices/${response.data.id}`);
        },
        onError: (error) => {
          enqueueSnackbar(
            getApiErrorMessage(
              error,
              t,
              'simpleInvoices.update.messages.updateFailed',
            ),
            { variant: 'error' },
          );
        },
      },
    );
  };

  const renderContent = () => {
    if (!id) {
      return (
        <p className="text-muted-foreground">
          {t('invoices.detail.invalidId')}
        </p>
      );
    }
    if (isInvoiceError) {
      return (
        <p className="text-destructive">
          {t('simpleInvoices.update.loadError')}
        </p>
      );
    }
    if (isInvoiceLoading || !listsReady || !isPrefilled) {
      return (
        <p className="text-muted-foreground">
          {t('simpleInvoices.update.loading')}
        </p>
      );
    }
    if (isInvoiceLocked(invoiceResponse?.data)) {
      return <InvoiceLockedNotice invoiceId={id} isSimple />;
    }

    return (
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
              onClick={() => navigate(`/invoices/${id}`)}
            >
              <ArrowLeft className="h-3 w-3" />
              {t('simpleInvoices.update.back')}
            </Button>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  {t('simpleInvoices.update.title')}
                </h1>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t('simpleInvoices.update.description')}
                </p>
              </div>
            </div>
          </div>

          {/* Main card: description + dates + amounts */}
          <Card className="border-border/60 p-5 shadow-sm">
            <SupplierFields
              form={form}
              contacts={contacts}
              isContactsLoading={isContactsLoading}
              allowManual={!isLinkedToContact}
            />

            <div className="my-4 border-t" />

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
                      <RequiredMark />
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
            <FormField
              control={form.control}
              name="rates"
              rules={{
                validate: (rows: RateRowValue[]) => {
                  const totals = sumRates(rows);
                  if (!(totals.total > 0)) {
                    return t('simpleInvoices.create.validation.amountRequired');
                  }
                  if (totals.total > MAX_TOTAL_WITH_VAT) {
                    return t(
                      'simpleInvoices.create.validation.totalLimitExceeded',
                    );
                  }
                  return true;
                },
              }}
              render={() => (
                <FormItem className="mt-5 space-y-1.5">
                  <FormLabel className={labelClass}>
                    {t('simpleInvoices.create.rates.title')}
                    <RequiredMark />
                  </FormLabel>
                  <RateAmountsTable
                    rates={watchedRates}
                    isVatPayer
                    onCellChange={handleRateCellChange}
                  />
                  <p className="text-xs text-muted-foreground/80">
                    {t('simpleInvoices.create.rates.hint')}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                                value={UpdateInvoiceDtoVatClaimType.FULL}
                              >
                                {t('invoices.vatClaim.claimType.options.FULL')}
                              </SelectItem>
                              <SelectItem
                                value={UpdateInvoiceDtoVatClaimType.PARTIAL}
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
                  </div>
                  {vatClaimType === UpdateInvoiceDtoVatClaimType.PARTIAL && (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="vatClaimRatio"
                        rules={{
                          validate: (value) => {
                            if (
                              vatClaimType !==
                              UpdateInvoiceDtoVatClaimType.PARTIAL
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
                    </div>
                  )}
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
              onClick={() => navigate(`/invoices/${id}`)}
            >
              {t('simpleInvoices.update.actions.cancel')}
            </Button>
            <Button
              type="submit"
              size="sm"
              className="gap-1.5"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('simpleInvoices.update.actions.submitting')}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {t('simpleInvoices.update.actions.save')}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    );
  };

  return <PageLayout>{renderContent()}</PageLayout>;
};

export default UpdateSimpleInvoice;
