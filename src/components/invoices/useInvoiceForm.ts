import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import i18n from '@/i18n';
import {
  CreateInvoiceDto,
  CreateInvoiceDtoStatus,
  CreateInvoiceDtoType,
  CreateInvoiceDtoVatMode,
  InvoiceBankAccountSnapshotDto,
  InvoiceVatClaimDto,
  InvoiceVatClaimDtoClaimType,
} from '@/api/model';
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
  const initialVatMode: CreateInvoiceDtoVatMode = isVatPayer
    ? CreateInvoiceDtoVatMode.STANDARD
    : CreateInvoiceDtoVatMode.NON_VAT_PAYER;

  const form = useForm<CreateInvoiceDto>({
    defaultValues: {
      type: invoiceType,
      currency: 'CZK',
      vatMode: initialVatMode,
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
      vatClaim: {
        shouldClaimVat: true,
        claimType: InvoiceVatClaimDtoClaimType.FULL,
        claimRatio: undefined,
        claimMonth: new Date().toISOString().slice(0, 7),
        note: '',
      },
    },
  });

  // Once we know whether the user is a VAT payer, sync the form's vatMode
  // default — react-hook-form has already initialised with whatever value was
  // present on first render (likely the non-VAT-payer fallback while the
  // profile request was still pending).
  useEffect(() => {
    const current = form.getValues('vatMode');
    if (isVatPayer && current === CreateInvoiceDtoVatMode.NON_VAT_PAYER) {
      form.setValue('vatMode', CreateInvoiceDtoVatMode.STANDARD);
    }
    if (!isVatPayer && current !== CreateInvoiceDtoVatMode.NON_VAT_PAYER) {
      form.setValue('vatMode', CreateInvoiceDtoVatMode.NON_VAT_PAYER);
    }
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
      form.formState.dirtyFields.vatClaim?.claimMonth ?? false;
    if (claimMonthField) return;
    form.setValue('vatClaim.claimMonth', duzpDate.slice(0, 7));
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

  const submitInvoice = (data: CreateInvoiceDto, mode: InvoiceSubmitMode) => {
    setSubmitMode(mode);

    const { status: _status, bankId, bankSnapshot, vatClaim, ...rest } = data;

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
      vatClaim?.shouldClaimVat === true;

    const vatClaimPayload: InvoiceVatClaimDto | undefined = sendVatClaim
      ? {
          shouldClaimVat: true,
          claimType: vatClaim.claimType,
          claimRatio:
            vatClaim.claimType === InvoiceVatClaimDtoClaimType.PARTIAL &&
            vatClaim.claimRatio != null
              ? Number(vatClaim.claimRatio)
              : undefined,
          claimMonth: vatClaim.claimMonth
            ? `${vatClaim.claimMonth.slice(0, 7)}-01`
            : undefined,
          note: trimOrUndefined(vatClaim.note),
        }
      : undefined;

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
      vatClaim: vatClaimPayload,
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
