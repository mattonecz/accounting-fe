import { useEffect, useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  getInvoiceGetQueryKey,
  getInvoiceListByCompanyQueryKey,
  useInvoiceGet,
  useInvoiceUpdate,
} from '@/api/invoices/invoices';
import { useListContacts } from '@/api/contacts/contacts';
import { useBankListByCompany } from '@/api/bank/bank';
import {
  InvoiceResponseDto,
  UpdateInvoiceDto,
  UpdateInvoiceDtoStatus,
  UpdateInvoiceDtoType,
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

const getDefaultValues = (): UpdateInvoiceDto => ({
  id: '',
  type: UpdateInvoiceDtoType.ISSUED,
  status: UpdateInvoiceDtoStatus.ISSUED,
  currency: 'CZK',
  createdDate: new Date().toISOString().split('T')[0],
  taxDate: new Date().toISOString().split('T')[0],
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
  const { mutate: updateInvoice, isPending: isUpdatingInvoice } =
    useInvoiceUpdate();

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

    form.reset({
      id: invoice.id,
      contactId: findMatchingContactId(invoice, sortedContacts),
      bankId: findMatchingBankId(invoice, sortedBanks),
      number: invoice.number,
      currency: invoice.currency,
      type:
        (invoice.type as UpdateInvoiceDtoType) || UpdateInvoiceDtoType.ISSUED,
      status:
        (invoice.status as UpdateInvoiceDtoStatus) ||
        UpdateInvoiceDtoStatus.ISSUED,
      exchangeRate: invoice.exchangeRate,
      createdDate: invoice.createdDate,
      taxDate: invoice.taxDate,
      dueDate: invoice.dueDate,
      items: invoice.items?.length
        ? invoice.items.map((item) => ({
            name: item.name,
            quantity: toNumber(item.quantity),
            unitPrice: toNumber(item.unitPrice),
            vatRate: item.vatRate != null ? toNumber(item.vatRate) : undefined,
            total: toNumber(item.total),
          }))
        : [DEFAULT_ITEM],
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
    updateInvoice(
      { data: { ...data, id: id || data.id } },
      {
        onSuccess: async (response) => {
          enqueueSnackbar('Faktura byla úspěšně upravena', {
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
          enqueueSnackbar('Úprava faktury selhala', { variant: 'error' });
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
