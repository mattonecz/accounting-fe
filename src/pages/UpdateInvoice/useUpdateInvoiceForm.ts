import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import i18n from '@/i18n';
import {
  getInvoiceGetQueryKey,
  getInvoiceListByCompanyQueryKey,
  useInvoiceGet,
  useInvoiceUpdate,
} from '@/api/invoices/invoices';
import { useListContacts } from '@/api/contacts/contacts';
import { useBankListByCompany } from '@/api/bank/bank';
import { useCompanyGet } from '@/api/companies/companies';
import { useAuth } from '@/contexts/AuthContext';
import { daysBetween } from '@/lib/formatters';
import {
  getDefaultRateRows,
  invoiceItemsToRates,
  ratesToInvoiceItems,
  type RateRowValue,
} from './incomingRates';
import {
  InvoiceBankAccountSnapshotDto,
  InvoiceResponseDto,
  UpdateInvoiceDto,
  UpdateInvoiceDtoPaymentMethod,
  UpdateInvoiceDtoStatus,
  UpdateInvoiceDtoType,
  UpdateInvoiceDtoVatClaimStatus,
  UpdateInvoiceDtoVatClaimType,
  UpdateInvoiceDtoVatMode,
} from '@/api/model';

export type UpdateInvoiceFormValues = UpdateInvoiceDto & {
  shouldClaimVat?: boolean;
  /** Helper field – number of days until the due date. Not sent to the backend. */
  paymentDays?: number;
  /**
   * Amounts-by-VAT-rate rows for received invoices. Edited instead of line
   * items and converted back to `items` on submit. Not sent to the backend.
   */
  rates?: RateRowValue[];
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  CZK: 'Kč',
  EUR: '€',
  USD: '$',
};

const DEFAULT_ITEM = {
  name: '',
  quantity: 1,
  unitPrice: 0,
  vatRate: 21,
  total: 0,
};

export const toNumber = (value: unknown) => {
  const numericValue = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(numericValue) ? Number(numericValue) : 0;
};

const trimOrUndefined = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const buildBankSnapshot = (
  snapshot: InvoiceBankAccountSnapshotDto | undefined,
): InvoiceBankAccountSnapshotDto | undefined => {
  if (!snapshot) return undefined;
  const cleaned: InvoiceBankAccountSnapshotDto = {
    name: trimOrUndefined(snapshot.name),
    number: trimOrUndefined(snapshot.number),
    iban: trimOrUndefined(snapshot.iban),
    swift: trimOrUndefined(snapshot.swift),
    currency: trimOrUndefined(snapshot.currency),
  };
  const hasAny = Object.values(cleaned).some((v) => v != null);
  return hasAny ? cleaned : undefined;
};

const getDefaultValues = (): UpdateInvoiceFormValues => ({
  id: '',
  type: UpdateInvoiceDtoType.ISSUED,
  status: UpdateInvoiceDtoStatus.ISSUED,
  vatMode: UpdateInvoiceDtoVatMode.STANDARD,
  currency: 'CZK',
  createdDate: new Date().toISOString().split('T')[0],
  duzpDate: new Date().toISOString().split('T')[0],
  dueDate: new Date().toISOString().split('T')[0],
  paymentDays: 0,
  paymentMethod: UpdateInvoiceDtoPaymentMethod.BANK_TRANSFER,
  items: [DEFAULT_ITEM],
  rates: getDefaultRateRows(),
});

// Loose text compare: trim + case-insensitive, so trailing spaces or casing in
// the snapshot don't defeat the match.
const looseEqual = (a?: string, b?: string) =>
  !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

// Account/IČO compare: ignore all whitespace and case (IBANs and account
// numbers are often stored with spaces in one place and without in another).
const idEqual = (a?: string, b?: string) =>
  !!a &&
  !!b &&
  a.replace(/\s+/g, '').toUpperCase() === b.replace(/\s+/g, '').toUpperCase();

// Prefer the invoice's stored contactId; only fall back to matching the
// snapshot when that id is missing or points at a contact no longer in the list
// — otherwise the Select would render an empty value. Each strategy is tried
// independently so a failed IČO match still falls through to a name match.
const resolveContactId = (
  invoice: InvoiceResponseDto,
  contacts: Array<{ id: string; name: string; ico?: string }>,
) => {
  if (invoice.contactId && contacts.some((c) => c.id === invoice.contactId)) {
    return invoice.contactId;
  }
  const snapshot = invoice.contactSnapshot;
  if (!snapshot) return '';
  const byIco = snapshot.ico
    ? contacts.find((c) => idEqual(c.ico, snapshot.ico))
    : undefined;
  if (byIco) return byIco.id;
  const byName = contacts.find((c) => looseEqual(c.name, snapshot.name));
  return byName?.id ?? '';
};

// Same idea for the bank: trust the stored bankId first, then fall back to
// matching the snapshot by IBAN, account number, and finally name.
const resolveBankId = (
  invoice: InvoiceResponseDto,
  banks: Array<{
    id: string;
    name?: string;
    number?: string;
    iban?: string;
    default?: boolean;
    currency?: string;
  }>,
) => {
  if (invoice.bankId && banks.some((b) => b.id === invoice.bankId)) {
    return invoice.bankId;
  }
  const snapshot = invoice.bankSnapshot;
  if (!snapshot) return '';
  const byIban = snapshot.iban
    ? banks.find((b) => idEqual(b.iban, snapshot.iban))
    : undefined;
  if (byIban) return byIban.id;
  const byNumber = snapshot.number
    ? banks.find((b) => idEqual(b.number, snapshot.number))
    : undefined;
  if (byNumber) return byNumber.id;
  const byName = banks.find((b) => looseEqual(b.name, snapshot.name));
  return byName?.id ?? '';
};

export const getbankSnapshotLabel = (account: {
  name?: string;
  currency?: string;
  number?: string;
  iban?: string;
}) =>
  `${account.name ?? '-'} (${account.currency ?? '-'}): ${account.number || account.iban || '-'}`;

export function useUpdateInvoiceForm(id: string) {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { data: invoiceResponse, isLoading, isError } = useInvoiceGet(id || '');
  const { data: contacts, isError: contactsError } = useListContacts();
  const { data: banks, isError: banksError } = useBankListByCompany();
  const { activeCompanyId } = useAuth();

  const { data: companyResponse, isError: companyError } = useCompanyGet(
    activeCompanyId ?? '',
  );

  // The contact/bank fields are resolved by looking up the loaded lists, so the
  // prefill must wait until those lists have settled (loaded or errored) — the
  // invoice itself is usually cached and arrives first. The company must also be
  // resolved before prefill, because the received-invoice rate rows are built
  // differently for VAT vs non-VAT payers (isVatPayer).
  const listsReady =
    (!!contacts || contactsError) &&
    (!!banks || banksError) &&
    (!!companyResponse || companyError);
  const { mutate: updateInvoice, isPending: isUpdatingInvoice } =
    useInvoiceUpdate();

  const isVatPayer = !!companyResponse?.data?.vatPayer;

  const form = useForm<UpdateInvoiceFormValues>({
    defaultValues: getDefaultValues(),
  });

  const selectedCurrency = form.watch('currency') || 'CZK';
  const currencyLabel = CURRENCY_SYMBOLS[selectedCurrency] || selectedCurrency;
  const isCzkCurrency = selectedCurrency === 'CZK';

  const sortedBanks = useMemo(
    () =>
      [...(banks?.data ?? [])].sort((a, b) => {
        if (a.default !== b.default) return a.default ? -1 : 1;
        return (a.name ?? '').localeCompare(b.name ?? '', 'cs', {
          sensitivity: 'base',
        });
      }),
    [banks?.data],
  );

  const sortedContacts = useMemo(
    () =>
      [...(contacts?.data ?? [])].sort((a, b) =>
        (a.name ?? '').localeCompare(b.name ?? '', 'cs', {
          sensitivity: 'base',
        }),
      ),
    [contacts?.data],
  );

  // The form JSX is held back until the prefill for the current invoice has run,
  // so every controlled Select mounts with its value already in place (a Radix
  // Select only shows a value whose <SelectItem> it has seen). Tracking the
  // prefilled id in state — and deriving the gate from it — stays correct under
  // React StrictMode's double-mount and React Query cache hits; a ref + separate
  // boolean desynced there and left the gate stuck closed on warm-cache navigation.
  const [prefilledId, setPrefilledId] = useState<string | null>(null);

  useEffect(() => {
    const invoice = invoiceResponse?.data;
    if (!invoice || !listsReady) return;
    // Prefill once per invoice; later background refetches must not clobber edits.
    if (prefilledId === invoice.id) return;

    const invoiceType =
      (invoice.type as UpdateInvoiceDtoType) || UpdateInvoiceDtoType.ISSUED;
    const isReceived = invoiceType === UpdateInvoiceDtoType.RECEIVED;

    form.reset({
      id: invoice.id,
      contactId: resolveContactId(invoice, sortedContacts),
      bankId: isReceived
        ? undefined
        : resolveBankId(invoice, sortedBanks) || undefined,
      bankSnapshot: isReceived
        ? {
            name: invoice.bankSnapshot?.name ?? '',
            number: invoice.bankSnapshot?.number ?? '',
            iban: invoice.bankSnapshot?.iban ?? '',
            swift: invoice.bankSnapshot?.swift ?? '',
            currency: invoice.bankSnapshot?.currency ?? '',
          }
        : undefined,
      number: invoice.number,
      currency: invoice.currency,
      type: invoiceType,
      vatMode:
        (invoice.vatMode as UpdateInvoiceDtoVatMode) ||
        UpdateInvoiceDtoVatMode.STANDARD,
      status:
        (invoice.status as UpdateInvoiceDtoStatus) ||
        UpdateInvoiceDtoStatus.ISSUED,
      exchangeRate: invoice.exchangeRate,
      createdDate: invoice.createdDate,
      duzpDate: invoice.duzpDate,
      dueDate: invoice.dueDate,
      paymentDays: daysBetween(
        invoice.createdDate ?? '',
        invoice.dueDate ?? '',
      ),
      variableSymbol: invoice.variableSymbol ?? '',
      specificSymbol: invoice.specificSymbol ?? '',
      konstantSymbol: invoice.konstantSymbol ?? '',
      paymentMethod:
        (invoice.paymentMethod as UpdateInvoiceDtoPaymentMethod | undefined) ??
        UpdateInvoiceDtoPaymentMethod.BANK_TRANSFER,
      note: invoice.note ?? '',
      internalNote: invoice.internalNote ?? '',
      originalNumber: invoice.originalNumber ?? '',
      items: invoice.items?.length
        ? invoice.items.map((item) => ({
            name: item.name,
            quantity: toNumber(item.quantity),
            unit: item.unit ?? '',
            unitPrice: toNumber(item.unitPrice),
            vatRate: item.vatRate != null ? toNumber(item.vatRate) : undefined,
            total: toNumber(item.total),
          }))
        : [DEFAULT_ITEM],
      // Received invoices are edited as amounts-by-VAT-rate, rebuilt from the
      // stored line items; issued invoices keep the line-item editor.
      rates: isReceived
        ? invoiceItemsToRates(invoice.items, isVatPayer)
        : getDefaultRateRows(),
      shouldClaimVat:
        invoice.vatClaimStatus == null
          ? true
          : invoice.vatClaimStatus !== UpdateInvoiceDtoVatClaimStatus.SKIPPED,
      vatClaimType:
        (invoice.vatClaimType as UpdateInvoiceDtoVatClaimType | undefined) ??
        UpdateInvoiceDtoVatClaimType.FULL,
      vatClaimRatio:
        invoice.vatClaimRatio != null
          ? toNumber(invoice.vatClaimRatio)
          : undefined,
      vatClaimMonth: invoice.vatClaimMonth
        ? invoice.vatClaimMonth.slice(0, 7)
        : (invoice.duzpDate?.slice(0, 7) ?? ''),
      vatClaimNote:
        invoice.vatClaimNote != null ? String(invoice.vatClaimNote) : '',
    });
    setPrefilledId(invoice.id);
  }, [
    form,
    invoiceResponse?.data,
    listsReady,
    isVatPayer,
    sortedBanks,
    sortedContacts,
    prefilledId,
  ]);

  // Open the form only once the prefill has run for the invoice now loaded.
  const isPrefilled =
    !!invoiceResponse?.data && prefilledId === invoiceResponse.data.id;

  useEffect(() => {
    if (selectedCurrency === 'CZK') {
      form.setValue('exchangeRate', undefined);
    }
  }, [selectedCurrency, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const formatMoney = (value?: number) =>
    `${toNumber(value).toFixed(2)} ${currencyLabel}`;

  const calculateInvoiceTotals = () => {
    const items = form.getValues('items') ?? [];
    items.forEach((item, index) => {
      const computed = toNumber(item.quantity) * toNumber(item.unitPrice);
      form.setValue(`items.${index}.total`, computed);
    });
  };

  const handleSubmit = (data: UpdateInvoiceFormValues) => {
    const isReceived = data.type === UpdateInvoiceDtoType.RECEIVED;

    const {
      shouldClaimVat,
      paymentDays: _paymentDays,
      rates,
      vatClaimType,
      vatClaimRatio,
      vatClaimMonth,
      vatClaimNote,
      vatClaimStatus: _ignoredStatus,
      ...rest
    } = data;

    const cleanedSnapshot = isReceived
      ? buildBankSnapshot(rest.bankSnapshot)
      : undefined;
    const finalBankId = !isReceived ? rest.bankId || undefined : undefined;

    const finalVatMode = isVatPayer
      ? rest.vatMode
      : UpdateInvoiceDtoVatMode.NON_VAT_PAYER;

    // Received invoices are edited as amounts-by-VAT-rate and converted back to
    // line items (mirroring create); issued invoices use the line-item editor.
    const finalItems = isReceived
      ? ratesToInvoiceItems(rates ?? [], isVatPayer, (rate) =>
          i18n.t('invoices.create.received.rateLineName', { rate }),
        )
      : rest.items?.map((item) => ({
          ...item,
          unit: trimOrUndefined(item.unit),
          vatRate: isVatPayer ? item.vatRate : undefined,
        }));

    if (isReceived && finalItems?.length === 0) {
      enqueueSnackbar(i18n.t('invoices.create.received.amountRequired'), {
        variant: 'error',
      });
      return;
    }

    const isVatClaimApplicable =
      isReceived && finalVatMode === UpdateInvoiceDtoVatMode.STANDARD;
    const sendVatClaim = isVatClaimApplicable && shouldClaimVat === true;

    const vatClaimFields: Pick<
      UpdateInvoiceDto,
      | 'vatClaimType'
      | 'vatClaimRatio'
      | 'vatClaimMonth'
      | 'vatClaimNote'
      | 'vatClaimStatus'
    > = sendVatClaim
      ? {
          vatClaimType,
          vatClaimRatio:
            vatClaimType === UpdateInvoiceDtoVatClaimType.PARTIAL &&
            vatClaimRatio != null
              ? Number(vatClaimRatio)
              : undefined,
          vatClaimMonth: vatClaimMonth
            ? `${vatClaimMonth.slice(0, 7)}-01`
            : undefined,
          vatClaimNote: trimOrUndefined(vatClaimNote),
          vatClaimStatus: UpdateInvoiceDtoVatClaimStatus.PENDING,
        }
      : isVatClaimApplicable
        ? { vatClaimStatus: UpdateInvoiceDtoVatClaimStatus.SKIPPED }
        : {};

    const payload: UpdateInvoiceDto = {
      ...rest,
      id: id || rest.id,
      vatMode: finalVatMode,
      items: finalItems,
      bankId: finalBankId,
      bankSnapshot: cleanedSnapshot,
      variableSymbol: trimOrUndefined(rest.variableSymbol),
      specificSymbol: trimOrUndefined(rest.specificSymbol),
      konstantSymbol: trimOrUndefined(rest.konstantSymbol),
      note: trimOrUndefined(rest.note),
      internalNote: trimOrUndefined(rest.internalNote),
      originalNumber: isReceived
        ? trimOrUndefined(rest.originalNumber)
        : undefined,
      ...vatClaimFields,
    };

    updateInvoice(
      { data: payload },
      {
        onSuccess: async (response) => {
          enqueueSnackbar(i18n.t('invoices.messages.updated'), {
            variant: 'success',
          });
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: getInvoiceListByCompanyQueryKey(),
            }),
            queryClient.invalidateQueries({
              queryKey: getInvoiceGetQueryKey(id || data.id),
            }),
          ]);
          navigate(`/invoices/${response.data.id}`);
        },
        onError: () => {
          enqueueSnackbar(i18n.t('invoices.messages.updateFailed'), {
            variant: 'error',
          });
        },
      },
    );
  };

  const addItem = () => append({ ...DEFAULT_ITEM });

  return {
    form,
    fields,
    // Keep the page in its loading state until the lookup lists are ready AND the
    // prefill has been applied, so the form (and its Selects) only mount once the
    // contact/bank values are already in place. Errors take precedence so a failed
    // load surfaces instead of spinning forever.
    isLoading: !isError && (isLoading || !listsReady || !isPrefilled),
    isError,
    isUpdatingInvoice,
    isCzkCurrency,
    isVatPayer,
    sortedContacts,
    sortedBanks,
    formatMoney,
    calculateInvoiceTotals,
    handleSubmit,
    addItem,
    removeItem: remove,
    invoiceResponse,
  };
}
