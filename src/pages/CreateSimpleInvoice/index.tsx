import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { FormCard } from '@/components/FormCard';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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
import { useUserProfileGet } from '@/api/user-profile/user-profile';
import type { ContactResponseDto, ContactSnapshotDto, CreateInvoiceDto } from '@/api/model';
import {
  CreateInvoiceDtoKind,
  CreateInvoiceDtoVatClaimType,
  InvoiceListByCompanyKind,
} from '@/api/model';

const MANUAL = '__manual__';

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
  total: number;
  totalTax: number;
  totalWithTax: number;
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
  total: 0,
  totalTax: 0,
  totalWithTax: 0,
  description: '',
  shouldClaimVat: true,
  vatClaimType: CreateInvoiceDtoVatClaimType.FULL,
  vatClaimRatio: undefined,
  vatClaimMonth: new Date().toISOString().slice(0, 7),
  vatClaimNote: '',
});

const CreateSimpleInvoice = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const form = useForm<FormValues>({ defaultValues: getDefaultFormValues() });

  const { data: userProfileResponse } = useUserProfileGet();
  const isVatPayer = !!userProfileResponse?.data?.dic?.trim();

  const { data: contacts = [], isLoading: isContactsLoading } =
    useListContacts<ContactResponseDto[]>({
      query: { select: (response) => response.data },
    });

  const companySelect = form.watch('companySelect');
  const isManual = companySelect === MANUAL;

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

  const createMutation = useInvoiceCreate({
    mutation: {
      onSuccess: async () => {
        enqueueSnackbar(t('simpleInvoices.create.messages.created'), { variant: 'success' });
        await queryClient.invalidateQueries({
          queryKey: getInvoiceListByCompanyQueryKey({ kind: InvoiceListByCompanyKind.SIMPLE }),
        });
        navigate('/invoices/simple');
      },
      onError: () => {
        enqueueSnackbar(t('simpleInvoices.create.messages.createFailed'), { variant: 'error' });
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

    createMutation.mutate({
      data: {
        kind: CreateInvoiceDtoKind.SIMPLE,
        ...counterparty,
        number: data.number,
        createdDate: data.createdDate,
        duzpDate: data.duzpDate,
        total: data.total,
        totalTax: data.totalTax,
        totalWithTax: data.totalWithTax,
        description: data.description?.trim() || undefined,
        ...vatClaimFields,
      },
    });
  };

  const numericChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (...event: unknown[]) => void,
  ) => onChange(e.target.value === '' ? 0 : Number(e.target.value));

  return (
    <PageLayout className="space-y-4">
      <PageHeader
        title={t('simpleInvoices.create.title')}
        description={t('simpleInvoices.create.description')}
        backButton
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormCard title={t('simpleInvoices.create.companySection')}>
            <div className="space-y-4">
              <SelectController
                control={form.control}
                name="companySelect"
                label={t('simpleInvoices.create.fields.companySelect')}
                placeholder={t('simpleInvoices.create.placeholders.companySelect')}
                variant="vertical"
                options={companyOptions}
                disabled={isContactsLoading}
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <InputController
                  control={form.control}
                  name="companyName"
                  label={t('simpleInvoices.create.fields.companyName')}
                  variant="vertical"
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
                  variant="vertical"
                  disabled={!isManual}
                />
                <InputController
                  control={form.control}
                  name="companyDic"
                  label={t('simpleInvoices.create.fields.companyDic')}
                  variant="vertical"
                  disabled={!isManual}
                />
              </div>
            </div>
          </FormCard>

          <FormCard title={t('simpleInvoices.create.documentSection')}>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <InputController
                  control={form.control}
                  name="number"
                  label={t('simpleInvoices.create.fields.number')}
                  placeholder="SI-2024-001"
                  variant="vertical"
                  rules={{
                    required: t('simpleInvoices.create.validation.numberRequired'),
                  }}
                />
                <InputController
                  control={form.control}
                  name="createdDate"
                  label={t('simpleInvoices.create.fields.createdDate')}
                  type="date"
                  variant="vertical"
                  rules={{
                    required: t('simpleInvoices.create.validation.createdDateRequired'),
                  }}
                />
                <InputController
                  control={form.control}
                  name="duzpDate"
                  label={t('simpleInvoices.create.fields.duzpDate')}
                  type="date"
                  variant="vertical"
                  rules={{
                    required: t('simpleInvoices.create.validation.duzpDateRequired'),
                  }}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <InputController
                  control={form.control}
                  name="total"
                  label={t('simpleInvoices.create.fields.base')}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  variant="vertical"
                  rules={{
                    required: t('simpleInvoices.create.validation.baseRequired'),
                    min: { value: 0, message: t('simpleInvoices.create.validation.baseMin') },
                  }}
                  onChangeOverride={numericChange}
                />
                <InputController
                  control={form.control}
                  name="totalTax"
                  label={t('simpleInvoices.create.fields.vat')}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  variant="vertical"
                  rules={{
                    required: t('simpleInvoices.create.validation.vatRequired'),
                    min: { value: 0, message: t('simpleInvoices.create.validation.vatMin') },
                  }}
                  onChangeOverride={numericChange}
                />
                <InputController
                  control={form.control}
                  name="totalWithTax"
                  label={t('simpleInvoices.create.fields.totalWithVat')}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  variant="vertical"
                  rules={{
                    required: t('simpleInvoices.create.validation.totalWithVatRequired'),
                    min: {
                      value: 0,
                      message: t('simpleInvoices.create.validation.totalWithVatMin'),
                    },
                  }}
                  onChangeOverride={numericChange}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>{t('simpleInvoices.create.fields.note')}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t('simpleInvoices.create.placeholders.note')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            <Button type="submit" disabled={createMutation.isPending}>
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
