import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  CreateInvoiceDto,
  CreateInvoiceDtoStatus,
  CreateInvoiceDtoType,
} from '@/api/model';
import { useCompanyListByUser } from '@/api/companies/companies';
import { useBankListByUser } from '@/api/bank/bank';
import { useInvoiceCreate, useInvoiceGetCount } from '@/api/invoices/invoices';

export const CURRENCY_SYMBOLS: Record<string, string> = {
  CZK: 'Kč',
  EUR: '€',
  USD: '$',
};

export type InvoiceSubmitMode = 'draft' | 'issued';

export const useInvoiceForm = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { data: companies } = useCompanyListByUser();
  const { data: banks } = useBankListByUser();
  const { data: invoiceNumber } = useInvoiceGetCount();
  const { mutate: createInvoice, isPending: isCreatingInvoice } =
    useInvoiceCreate();
  const [submitMode, setSubmitMode] = useState<InvoiceSubmitMode>('issued');

  const form = useForm<CreateInvoiceDto>({
    defaultValues: {
      type: CreateInvoiceDtoType.ISSUED,
      currency: 'CZK',
      createdDate: new Date().toISOString().split('T')[0],
      taxDate: new Date().toISOString().split('T')[0],
      dueDate: (() => {
        const date = new Date();
        date.setDate(date.getDate() + 14);
        return date.toISOString().split('T')[0];
      })(),
      total: 0,
      totalTax: 0,
      totalWithTax: 0,
      items: [{ name: '', amount: 1, pricePerUnit: 0, vat: 21, units: 1 }],
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

  const sortedCompanies = [...(companies?.data ?? [])].sort((a, b) =>
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
    if (invoiceNumber?.data !== undefined) {
      const year = new Date().getFullYear();
      const number = invoiceNumber.data + 1;
      form.setValue('number', `${year}${String(number).padStart(4, '0')}`);
    }
  }, [invoiceNumber, form]);

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
    const total = items.reduce(
      (sum, item) => sum + (item.amount || 0) * (item.pricePerUnit || 0),
      0,
    );
    const totalTax = items.reduce((sum, item) => {
      const itemTotal = (item.amount || 0) * (item.pricePerUnit || 0);
      return sum + itemTotal * ((item.vat || 0) / 100);
    }, 0);

    form.setValue('total', total);
    form.setValue('totalTax', totalTax);
    form.setValue('totalWithTax', total + totalTax);
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
          navigate('/outgoing-invoices');
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
    selectedCurrency,
    currencyLabel,
    isCzkCurrency,
    sortedBanks,
    sortedCompanies,
    formatMoney,
    getBankAccountLabel,
    calculateTotals,
    submitInvoice,
  };
};
