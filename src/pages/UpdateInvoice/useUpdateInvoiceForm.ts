import { useEffect, useMemo } from 'react';
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
import { useUserProfileGet } from '@/api/user-profile/user-profile';
import {
  InvoiceBankAccountSnapshotDto,
  InvoiceResponseDto,
  InvoiceVatClaimDto,
  InvoiceVatClaimDtoClaimType,
  UpdateInvoiceDto,
  UpdateInvoiceDtoStatus,
  UpdateInvoiceDtoType,
  UpdateInvoiceDtoVatMode,
} from '@/api/model';

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

const getDefaultValues = (): UpdateInvoiceDto => ({
  id: '',
  type: UpdateInvoiceDtoType.ISSUED,
  status: UpdateInvoiceDtoStatus.ISSUED,
  vatMode: UpdateInvoiceDtoVatMode.STANDARD,
  currency: 'CZK',
  createdDate: new Date().toISOString().split('T')[0],
  duzpDate: new Date().toISOString().split('T')[0],
  dueDate: new Date().toISOString().split('T')[0],
  items: [DEFAULT_ITEM],
});

const findMatchingContactId = (
  invoice: InvoiceResponseDto,
  contacts: Array<{ id: string; name: string; ico?: string }>,
) => {
  const snapshot = invoice.contactSnapshot;
  return (
    contacts.find((contact) => {
      if (snapshot?.ico && contact.ico) return snapshot.ico === contact.ico;
      return contact.name === snapshot?.name;
    })?.id ?? ''
  );
};

const findMatchingBankId = (
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
  const snapshot = invoice.bankAccount;
  return (
    banks.find((bank) => {
      if (snapshot?.iban && bank.iban) return snapshot.iban === bank.iban;
      if (snapshot?.number && bank.number)
        return snapshot.number === bank.number;
      return bank.name === snapshot?.name;
    })?.id ?? ''
  );
};

export const getBankAccountLabel = (account: {
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
  const { data: contacts } = useListContacts();
  const { data: banks } = useBankListByCompany();
  const { data: userProfileResponse } = useUserProfileGet();
  const { mutate: updateInvoice, isPending: isUpdatingInvoice } =
    useInvoiceUpdate();

  const isVatPayer = !!userProfileResponse?.data?.dic?.trim();

  const form = useForm<UpdateInvoiceDto>({
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

  useEffect(() => {
    const invoice = invoiceResponse?.data;
    if (!invoice) return;

    const invoiceType =
      (invoice.type as UpdateInvoiceDtoType) || UpdateInvoiceDtoType.ISSUED;
    const isReceived = invoiceType === UpdateInvoiceDtoType.RECEIVED;

    form.reset({
      id: invoice.id,
      contactId: findMatchingContactId(invoice, sortedContacts),
      bankId: isReceived
        ? undefined
        : findMatchingBankId(invoice, sortedBanks) || undefined,
      bankSnapshot: isReceived
        ? {
            name: invoice.bankAccount?.name ?? '',
            number: invoice.bankAccount?.number ?? '',
            iban: invoice.bankAccount?.iban ?? '',
            swift: invoice.bankAccount?.swift ?? '',
            currency: invoice.bankAccount?.currency ?? '',
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
      variableSymbol: invoice.variableSymbol ?? '',
      specificSymbol: invoice.specificSymbol ?? '',
      konstantSymbol: invoice.konstantSymbol ?? '',
      note: invoice.note ?? '',
      internalNote: invoice.internalNote ?? '',
      originalNumber: invoice.originalNumber ?? '',
      items: invoice.items?.length
        ? invoice.items.map((item) => ({
            name: item.name,
            quantity: toNumber(item.quantity),
            unitPrice: toNumber(item.unitPrice),
            vatRate: item.vatRate != null ? toNumber(item.vatRate) : undefined,
            total: toNumber(item.total),
          }))
        : [DEFAULT_ITEM],
      vatClaim: invoice.vatClaim
        ? {
            shouldClaimVat: invoice.vatClaim.shouldClaimVat,
            claimType:
              invoice.vatClaim.claimType ?? InvoiceVatClaimDtoClaimType.FULL,
            claimRatio:
              invoice.vatClaim.claimRatio != null
                ? toNumber(invoice.vatClaim.claimRatio)
                : undefined,
            claimMonth: invoice.vatClaim.claimMonth
              ? invoice.vatClaim.claimMonth.slice(0, 7)
              : (invoice.duzpDate?.slice(0, 7) ?? ''),
            note: (invoice.vatClaim.note as unknown as string | null) ?? '',
          }
        : {
            shouldClaimVat: true,
            claimType: InvoiceVatClaimDtoClaimType.FULL,
            claimRatio: undefined,
            claimMonth: invoice.duzpDate?.slice(0, 7) ?? '',
            note: '',
          },
    });
  }, [form, invoiceResponse?.data, sortedBanks, sortedContacts]);

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

  const handleSubmit = (data: UpdateInvoiceDto) => {
    const isReceived = data.type === UpdateInvoiceDtoType.RECEIVED;

    const cleanedSnapshot = isReceived
      ? buildBankSnapshot(data.bankSnapshot)
      : undefined;
    const finalBankId = !isReceived ? data.bankId || undefined : undefined;

    const finalVatMode = isVatPayer
      ? data.vatMode
      : UpdateInvoiceDtoVatMode.NON_VAT_PAYER;

    const finalItems = data.items?.map((item) => ({
      ...item,
      vatRate: isVatPayer ? item.vatRate : undefined,
    }));

    const sendVatClaim =
      isReceived &&
      finalVatMode === UpdateInvoiceDtoVatMode.STANDARD &&
      data.vatClaim?.shouldClaimVat === true;

    const vatClaimPayload: InvoiceVatClaimDto | undefined = sendVatClaim
      ? {
          shouldClaimVat: true,
          claimType: data.vatClaim?.claimType,
          claimRatio:
            data.vatClaim?.claimType === InvoiceVatClaimDtoClaimType.PARTIAL &&
            data.vatClaim?.claimRatio != null
              ? Number(data.vatClaim.claimRatio)
              : undefined,
          claimMonth: data.vatClaim?.claimMonth
            ? `${data.vatClaim.claimMonth.slice(0, 7)}-01`
            : undefined,
          note: trimOrUndefined(data.vatClaim?.note),
        }
      : undefined;

    const payload: UpdateInvoiceDto = {
      ...data,
      id: id || data.id,
      vatMode: finalVatMode,
      items: finalItems,
      bankId: finalBankId,
      bankSnapshot: cleanedSnapshot,
      variableSymbol: trimOrUndefined(data.variableSymbol),
      specificSymbol: trimOrUndefined(data.specificSymbol),
      konstantSymbol: trimOrUndefined(data.konstantSymbol),
      note: trimOrUndefined(data.note),
      internalNote: trimOrUndefined(data.internalNote),
      originalNumber: isReceived
        ? trimOrUndefined(data.originalNumber)
        : undefined,
      vatClaim: vatClaimPayload,
    };

    updateInvoice(
      { data: payload },
      {
        onSuccess: async (response) => {
          enqueueSnackbar(i18n.t('invoices.messages.updated'), { variant: 'success' });
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: getInvoiceListByCompanyQueryKey() }),
            queryClient.invalidateQueries({ queryKey: getInvoiceGetQueryKey(id || data.id) }),
          ]);
          navigate(`/invoices/${response.data.id}`);
        },
        onError: () => {
          enqueueSnackbar(i18n.t('invoices.messages.updateFailed'), { variant: 'error' });
        },
      },
    );
  };

  const addItem = () => append({ ...DEFAULT_ITEM });

  return {
    form,
    fields,
    isLoading,
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
