import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  CreateInvoiceDto,
  CreateInvoiceDtoStatus,
  CreateInvoiceDtoType,
} from '@/api/model';
import { useListContacts } from '@/api/contacts/contacts';
import { useBankListByCompany } from '@/api/bank/bank';
import { useInvoiceCreate, useInvoiceGetCount } from '@/api/invoices/invoices';

export const CURRENCY_SYMBOLS: Record<string, string> = {
  CZK: 'Kč',
  EUR: '€',
  USD: '$',
};

export type InvoiceSubmitMode = 'draft' | 'issued';

export const useInvoiceForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isReceived = searchParams.get('type') === 'received';
  const invoiceType = isReceived
    ? CreateInvoiceDtoType.RECEIVED
    : CreateInvoiceDtoType.ISSUED;

  const { enqueueSnackbar } = useSnackbar();
  const { data: contacts } = useListContacts();
  const { data: banks } = useBankListByCompany();
  const { data: invoiceNumber } = useInvoiceGetCount();
  const { mutate: createInvoice, isPending: isCreatingInvoice } =
    useInvoiceCreate();
  const [submitMode, setSubmitMode] = useState<InvoiceSubmitMode>('issued');

  const form = useForm<CreateInvoiceDto>({
    defaultValues: {
      type: invoiceType,
      currency: 'CZK',
      createdDate: new Date().toISOString().split('T')[0],
      taxDate: new Date().toISOString().split('T')[0],
      dueDate: (() => {
        const date = new Date();
        date.setDate(date.getDate() + 14);
        return date.toISOString().split('T')[0];
      })(),
      items: [{ name: '', quantity: 1, unitPrice: 0, total: 0, vatRate: 21 }],
    },
  });

  const selectedCurrency = form.watch('currency') || 'CZK';
  const currencyLabel = CURRENCY_SYMBOLS[selectedCurrency] || selectedCurrency;
  const isCzkCurrency = selectedCurrency === 'CZK';

  const sortedBanks = [...(banks?.data ?? [])].sort((a, b) => {
    if (a.default !== b.default) {
      return a.default ? -1 : 1;
    }
    return (a.name ?? '').localeCompare(b.name ?? '', 'cs', {
      sensitivity: 'base',
    });
  });

  const sortedContacts = [...(contacts?.data ?? [])].sort((a, b) =>
    (a.name ?? '').localeCompare(b.name ?? '', 'cs', { sensitivity: 'base' }),
  );

  const formatMoney = (value?: number) =>
    `${(value ?? 0).toFixed(2)} ${currencyLabel}`;

  const getBankAccountLabel = (account: {
    name?: string;
    currency?: string;
    number?: string;
    iban?: string;
  }) =>
    `${account.name ?? '-'} (${account.currency ?? '-'})` +
    `: ${account.number || account.iban || '-'}`;

  useEffect(() => {
    if (isReceived) return;
    if (invoiceNumber?.data !== undefined) {
      const year = new Date().getFullYear();
      const number = invoiceNumber.data + 1;
      form.setValue('number', `${year}${String(number).padStart(4, '0')}`);
    }
  }, [invoiceNumber, form, isReceived]);

  useEffect(() => {
    const selectedBankId = form.getValues('bankId');
    if (selectedBankId) return;

    const defaultBank =
      sortedBanks.find((bank) => bank.default) ?? sortedBanks[0];
    if (defaultBank) {
      form.setValue('bankId', defaultBank.id);
    }
  }, [sortedBanks, form]);

  useEffect(() => {
    if (selectedCurrency === 'CZK') {
      form.setValue('exchangeRate', undefined);
    }
  }, [selectedCurrency, form]);

  const fieldArray = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const calculateTotals = () => {
    const items = form.getValues('items');
    items.forEach((item, index) => {
      const computed = (item.quantity || 0) * (item.unitPrice || 0);
      form.setValue(`items.${index}.total`, computed);
    });
  };

  const submitInvoice = (data: CreateInvoiceDto, mode: InvoiceSubmitMode) => {
    setSubmitMode(mode);

    const { status: _status, ...invoicePayload } = data;
    const payload =
      mode === 'draft'
        ? { ...invoicePayload, status: CreateInvoiceDtoStatus.DRAFT }
        : invoicePayload;

    createInvoice(
      { data: payload },
      {
        onSuccess: () => {
          enqueueSnackbar(
            mode === 'draft'
              ? 'Koncept faktury byl úspěšně vytvořen'
              : 'Faktura byla úspěšně vytvořena',
            { variant: 'success' },
          );
          navigate(isReceived ? '/incoming-invoices' : '/outgoing-invoices');
        },
        onError: () => {
          enqueueSnackbar(
            mode === 'draft'
              ? 'Vytvoření konceptu faktury selhalo'
              : 'Vytvoření faktury selhalo',
            { variant: 'error' },
          );
        },
      },
    );
  };

  return {
    form,
    fieldArray,
    submitMode,
    isCreatingInvoice,
    isReceived,
    selectedCurrency,
    currencyLabel,
    isCzkCurrency,
    sortedBanks,
    sortedContacts,
    formatMoney,
    getBankAccountLabel,
    calculateTotals,
    submitInvoice,
  };
};
