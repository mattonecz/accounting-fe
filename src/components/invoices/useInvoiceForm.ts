import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import i18n from '@/i18n';
import { addDays } from '@/lib/formatters';
import {
  CreateContactDto,
  CreateInvoiceDto,
  CreateInvoiceDtoPaymentMethod,
  CreateInvoiceDtoStatus,
  CreateInvoiceDtoType,
  CreateInvoiceDtoVatClaimType,
  CreateInvoiceDtoVatMode,
  InvoiceBankAccountSnapshotDto,
} from '@/api/model';

export type InvoiceFormValues = CreateInvoiceDto & {
  shouldClaimVat?: boolean;
  /** Helper field – number of days until the due date. Not sent to the backend. */
  paymentDays?: number;
  /** Helper field – when true, `paidDate` is sent and the invoice is created as PAID. */
  isPaid?: boolean;
  /**
   * Helper field – a counterparty picked from ARES or typed by hand that does
   * not exist as a Contact yet. It is created on submit and then referenced
   * via `contactId` (see InvoiceContactField).
   */
  pendingContact?: CreateContactDto | null;
};
import { useListContacts } from '@/api/contacts/contacts';
import { useResolveContactId } from '@/components/invoices/useResolveContactId';
import { useBankListByCompany } from '@/api/bank/bank';
import { useInvoiceCreate, useInvoiceGetCount } from '@/api/invoices/invoices';
import { useCompanyGet } from '@/api/companies/companies';
import { useAuth } from '@/contexts/AuthContext';

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
  const { activeCompanyId } = useAuth();
  const { data: companyResponse } = useCompanyGet(activeCompanyId ?? '');
  const { mutate: createInvoice, isPending: isCreatingInvoice } =
    useInvoiceCreate();
  const { resolveContactId, isCreatingContact } = useResolveContactId();
  const [submitMode, setSubmitMode] = useState<InvoiceSubmitMode>('issued');

  const isVatPayer = !!companyResponse?.data?.vatPayer;

  const today = new Date().toISOString().split('T')[0];
  const defaultPaymentDays = 14;

  const form = useForm<InvoiceFormValues>({
    defaultValues: {
      type: invoiceType,
      currency: 'CZK',
      vatMode: CreateInvoiceDtoVatMode.STANDARD,
      createdDate: today,
      duzpDate: today,
      dueDate: addDays(today, defaultPaymentDays),
      paymentDays: defaultPaymentDays,
      isPaid: false,
      paymentMethod: CreateInvoiceDtoPaymentMethod.BANK_TRANSFER,
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
      pendingContact: null,
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

  // Variable symbol defaults to the invoice number and trails it until the user
  // edits it. Issued invoices only — a received VS comes from the supplier.
  const invoiceNumberValue = form.watch('number');
  useEffect(() => {
    if (isReceived) return;
    if (form.formState.dirtyFields.variableSymbol) return;
    if (invoiceNumberValue) {
      form.setValue('variableSymbol', invoiceNumberValue);
    }
  }, [invoiceNumberValue, form, isReceived]);

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
    const claimMonthField = form.formState.dirtyFields.vatClaimMonth ?? false;
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

  const submitInvoice = async (
    data: InvoiceFormValues,
    mode: InvoiceSubmitMode,
  ) => {
    setSubmitMode(mode);

    const {
      status: _status,
      bankId,
      bankSnapshot,
      shouldClaimVat,
      isPaid,
      paymentDays: _paymentDays,
      pendingContact,
      vatClaimType,
      vatClaimRatio,
      vatClaimMonth,
      vatClaimNote,
      ...rest
    } = data;

    // A new counterparty (ARES / typed by hand) is created as a Contact first,
    // then referenced by its id on the invoice.
    const contactId = await resolveContactId(
      rest.contactId,
      pendingContact,
      sortedContacts,
    );
    if (!contactId) return;
    if (pendingContact) {
      // Point the form at the created contact, so a retry after a failed
      // invoice save does not create the contact a second time.
      form.setValue('contactId', contactId);
      form.setValue('pendingContact', null);
    }

    const cleanedSnapshot = isReceived
      ? buildBankSnapshot(bankSnapshot)
      : undefined;
    const finalBankId = !isReceived ? bankId : undefined;

    const finalVatMode = isVatPayer
      ? rest.vatMode
      : CreateInvoiceDtoVatMode.NON_VAT_PAYER;

    const finalItems = (rest.items ?? []).map((item) => ({
      ...item,
      unit: trimOrUndefined(item.unit),
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

    // A paid invoice only makes sense when issuing – drafts never carry paidDate.
    const finalPaidDate =
      mode === 'issued' && isPaid ? rest.paidDate : undefined;

    const invoicePayload: CreateInvoiceDto = {
      ...rest,
      contactId,
      vatMode: finalVatMode,
      items: finalItems,
      bankId: finalBankId,
      bankSnapshot: cleanedSnapshot,
      paidDate: finalPaidDate,
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
    isCreatingInvoice: isCreatingInvoice || isCreatingContact,
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
