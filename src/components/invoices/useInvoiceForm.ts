import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import i18n from '@/i18n';
import {
  CreateInvoiceDto,
  CreateInvoiceDtoStatus,
  CreateInvoiceDtoType,
  CreateInvoiceDtoVatClaimType,
  CreateInvoiceDtoVatMode,
  InvoiceBankAccountSnapshotDto,
} from '@/api/model';

export type InvoiceFormValues = CreateInvoiceDto & {
  shouldClaimVat?: boolean;
};
import { useListContacts } from '@/api/contacts/contacts';
import { useBankListByCompany } from '@/api/bank/bank';
import { useInvoiceCreate, useInvoiceGetCount } from '@/api/invoices/invoices';
import { useUserProfileGet } from '@/api/user-profile/user-profile';

export const CURRENCY_SYMBOLS: Record<string, string> = {
  CZK: 'Kč',
  EUR: '€',
  USD: '$',
};

export type InvoiceSubmitMode = 'draft' | 'issued';

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
  const { data: userProfileResponse } = useUserProfileGet();
  const { mutate: createInvoice, isPending: isCreatingInvoice } =
    useInvoiceCreate();
  const [submitMode, setSubmitMode] = useState<InvoiceSubmitMode>('issued');

  const isVatPayer = !!userProfileResponse?.data?.dic?.trim();

  const form = useForm<InvoiceFormValues>({
    defaultValues: {
      type: invoiceType,
      currency: 'CZK',
      vatMode: CreateInvoiceDtoVatMode.STANDARD,
      createdDate: new Date().toISOString().split('T')[0],
      duzpDate: new Date().toISOString().split('T')[0],
      dueDate: (() => {
        const date = new Date();
        date.setDate(date.getDate() + 14);
        return date.toISOString().split('T')[0];
      })(),
      items: [
        {
          name: '',
          quantity: 1,
          unitPrice: 0,
          total: 0,
          vatRate: isVatPayer ? 21 : undefined,
        },
      ],
      shouldClaimVat: true,
      vatClaimType: CreateInvoiceDtoVatClaimType.FULL,
      vatClaimRatio: undefined,
      vatClaimMonth: new Date().toISOString().slice(0, 7),
      vatClaimNote: '',
    },
  });

  // Sync per-item vatRate once the profile loads (the dropdown for vatMode is
  // hidden for non-VAT payers, and submitInvoice coerces vatMode itself).
  useEffect(() => {
    const items = form.getValues('items') ?? [];
    items.forEach((item, index) => {
      if (isVatPayer && item.vatRate == null) {
        form.setValue(`items.${index}.vatRate`, 21);
      }
      if (!isVatPayer && item.vatRate != null) {
        form.setValue(`items.${index}.vatRate`, undefined);
      }
    });
  }, [isVatPayer, form]);

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
    if (isReceived) return;
    const selectedBankId = form.getValues('bankId');
    if (selectedBankId) return;

    const defaultBank =
      sortedBanks.find((bank) => bank.default) ?? sortedBanks[0];
    if (defaultBank) {
      form.setValue('bankId', defaultBank.id);
    }
  }, [sortedBanks, form, isReceived]);

  useEffect(() => {
    if (selectedCurrency === 'CZK') {
      form.setValue('exchangeRate', undefined);
    }
  }, [selectedCurrency, form]);

  const duzpDate = form.watch('duzpDate');
  useEffect(() => {
    if (!duzpDate) return;
    const claimMonthField =
      form.formState.dirtyFields.vatClaimMonth ?? false;
    if (claimMonthField) return;
    form.setValue('vatClaimMonth', duzpDate.slice(0, 7));
  }, [duzpDate, form]);

  const fieldArray = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const calculateTotals = () => {
    const items = form.getValues('items') ?? [];
    items.forEach((item, index) => {
      const computed = (item.quantity || 0) * (item.unitPrice || 0);
      form.setValue(`items.${index}.total`, computed);
    });
  };

  const submitInvoice = (data: InvoiceFormValues, mode: InvoiceSubmitMode) => {
    setSubmitMode(mode);

    const {
      status: _status,
      bankId,
      bankSnapshot,
      shouldClaimVat,
      vatClaimType,
      vatClaimRatio,
      vatClaimMonth,
      vatClaimNote,
      ...rest
    } = data;

    const cleanedSnapshot = isReceived
      ? buildBankSnapshot(bankSnapshot)
      : undefined;
    const finalBankId = !isReceived ? bankId : undefined;

    const finalVatMode = isVatPayer
      ? rest.vatMode
      : CreateInvoiceDtoVatMode.NON_VAT_PAYER;

    const finalItems = (rest.items ?? []).map((item) => ({
      ...item,
      vatRate: isVatPayer ? item.vatRate : undefined,
    }));

    const sendVatClaim =
      isReceived &&
      finalVatMode === CreateInvoiceDtoVatMode.STANDARD &&
      shouldClaimVat === true;

    const vatClaimFields: Pick<
      CreateInvoiceDto,
      'vatClaimType' | 'vatClaimRatio' | 'vatClaimMonth' | 'vatClaimNote'
    > = sendVatClaim
      ? {
          vatClaimType,
          vatClaimRatio:
            vatClaimType === CreateInvoiceDtoVatClaimType.PARTIAL &&
            vatClaimRatio != null
              ? Number(vatClaimRatio)
              : undefined,
          vatClaimMonth: vatClaimMonth
            ? `${vatClaimMonth.slice(0, 7)}-01`
            : undefined,
          vatClaimNote: trimOrUndefined(vatClaimNote),
        }
      : {};

    const invoicePayload: CreateInvoiceDto = {
      ...rest,
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
              ? i18n.t('invoices.messages.draftCreated')
              : i18n.t('invoices.messages.created'),
            { variant: 'success' },
          );
          navigate(isReceived ? '/incoming-invoices' : '/outgoing-invoices');
        },
        onError: () => {
          enqueueSnackbar(
            mode === 'draft'
              ? i18n.t('invoices.messages.draftCreateFailed')
              : i18n.t('invoices.messages.createFailed'),
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
    isVatPayer,
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
