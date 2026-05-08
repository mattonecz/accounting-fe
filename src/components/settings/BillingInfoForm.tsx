import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import {
  getCompanyGetQueryKey,
  useCompanyCreate,
  useCompanyGet,
  useCompanyUpdate,
} from '@/api/companies/companies';
import type { CompanyResponseDto, CreateCompanyDto } from '@/api/model';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { InputController } from '@/components/InputController';
import { SelectController } from '@/components/SelectController';
import {
  SPECIAL_TAX_OFFICE_CODE,
  SPECIAL_TAX_OFFICE_WORKPLACE_CODE,
  SPECIAL_TAX_OFFICE_WORKPLACE_LABEL,
  TAX_OFFICE_OPTIONS,
  TAX_OFFICE_WORKPLACE_OPTIONS,
} from '@/lib/taxOfficeCodebooks';

type CompanyFormValues = Omit<CreateCompanyDto, 'email' | 'description'>;

const specialTaxOfficeWorkplaceOption = {
  officeCode: SPECIAL_TAX_OFFICE_CODE,
  code: SPECIAL_TAX_OFFICE_WORKPLACE_CODE,
  label: SPECIAL_TAX_OFFICE_WORKPLACE_LABEL,
};

const normalizeCodeValue = (value?: string | null) => {
  if (value == null) return '';
  return String(value).trim();
};

const mapCompanyToForm = (company?: CompanyResponseDto | null): CompanyFormValues => ({
  name: company?.name ?? '',
  country: company?.country ?? '',
  street: company?.street ?? '',
  city: company?.city ?? '',
  psc: company?.psc ?? '',
  ico: company?.ico ?? '',
  dic: company?.dic ?? '',
  c_ufo: normalizeCodeValue(company?.c_ufo),
  c_pracufo: normalizeCodeValue(company?.c_pracufo),
});

const toOptionalField = (value: string) => {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

const toCompanyPayload = (data: CompanyFormValues): CompanyFormValues => ({
  name: data.name.trim(),
  country: data.country.trim(),
  street: toOptionalField(data.street ?? ''),
  city: toOptionalField(data.city ?? ''),
  psc: toOptionalField(data.psc ?? ''),
  ico: toOptionalField(data.ico ?? ''),
  dic: toOptionalField(data.dic ?? ''),
  c_ufo: toOptionalField(data.c_ufo ?? ''),
  c_pracufo: toOptionalField(data.c_pracufo ?? ''),
});

interface BillingInfoFormProps {
  companyId: string;
}

export const BillingInfoForm = ({ companyId }: BillingInfoFormProps) => {
  const { t } = useTranslation();
  const [companyFallback, setCompanyFallback] = useState<CompanyResponseDto | null>(null);

  const {
    data: companyResponse,
    isError: isCompanyError,
    isLoading: isCompanyLoading,
  } = useCompanyGet(companyId, { query: { retry: false, enabled: !!companyId } });

  const companyFromApi = companyResponse?.data;
  const company = companyFromApi ?? companyFallback;

  if (companyId && isCompanyLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          {t('settings.billing.loading')}
        </CardContent>
      </Card>
    );
  }

  if (isCompanyError && !company) {
    return (
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle>{t('settings.billing.errorTitle')}</CardTitle>
          <CardDescription>{t('settings.billing.errorDescription')}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <BillingInfoFormContent
      key={company?.id ?? 'new'}
      companyId={companyId}
      company={company}
      onCompanyCreated={setCompanyFallback}
    />
  );
};

interface BillingInfoFormContentProps {
  companyId: string;
  company: CompanyResponseDto | null;
  onCompanyCreated: (company: CompanyResponseDto | null) => void;
}

const BillingInfoFormContent = ({
  companyId,
  company,
  onCompanyCreated,
}: BillingInfoFormContentProps) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { mutate: createCompany, isPending: isCreatingCompany } = useCompanyCreate();
  const { mutate: updateCompany, isPending: isUpdatingCompany } = useCompanyUpdate();

  const hasExistingCompany = Boolean(company?.id);
  const isSaving = isCreatingCompany || isUpdatingCompany;

  const missingCompanyMessage = companyId
    ? t('settings.billing.missingCompanyExisting')
    : t('settings.billing.missingCompanyNew');

  const form = useForm<CompanyFormValues>({
    defaultValues: mapCompanyToForm(company),
  });
  const { reset, watch, setValue } = form;

  const selectedTaxOfficeCode = watch('c_ufo');
  const selectedWorkplaceCode = watch('c_pracufo');

  const workplaceOptions = useMemo(() => {
    if (!selectedTaxOfficeCode) return [];
    if (selectedTaxOfficeCode === SPECIAL_TAX_OFFICE_CODE)
      return [specialTaxOfficeWorkplaceOption];
    return TAX_OFFICE_WORKPLACE_OPTIONS.filter(
      (workplace) => workplace.officeCode === selectedTaxOfficeCode,
    );
  }, [selectedTaxOfficeCode]);

  useEffect(() => {
    if (!selectedTaxOfficeCode) {
      if (selectedWorkplaceCode) setValue('c_pracufo', '');
      return;
    }
    if (selectedTaxOfficeCode === SPECIAL_TAX_OFFICE_CODE) {
      if (selectedWorkplaceCode !== SPECIAL_TAX_OFFICE_WORKPLACE_CODE)
        setValue('c_pracufo', SPECIAL_TAX_OFFICE_WORKPLACE_CODE);
      return;
    }
    const hasMatchingWorkplace = workplaceOptions.some((w) => w.code === selectedWorkplaceCode);
    if (selectedWorkplaceCode && !hasMatchingWorkplace) setValue('c_pracufo', '');
  }, [selectedTaxOfficeCode, selectedWorkplaceCode, setValue, workplaceOptions]);

  const onSubmit = (data: CompanyFormValues) => {
    const payload = toCompanyPayload(data);
    const handleSuccess = (response: { data: CompanyResponseDto }) => {
      queryClient.setQueryData(getCompanyGetQueryKey(response.data.id), response);
      if (!companyId || response.data.id !== companyId) {
        onCompanyCreated(response.data);
      } else {
        onCompanyCreated(null);
      }
      reset(mapCompanyToForm(response.data));
      enqueueSnackbar(
        hasExistingCompany
          ? t('settings.billing.messages.updateSuccess')
          : t('settings.billing.messages.createSuccess'),
        { variant: 'success' },
      );
    };
    const handleError = () => {
      enqueueSnackbar(
        hasExistingCompany
          ? t('settings.billing.messages.updateError')
          : t('settings.billing.messages.createError'),
        { variant: 'error' },
      );
    };
    if (hasExistingCompany && company) {
      updateCompany(
        { data: { id: company.id, ...payload } },
        { onSuccess: handleSuccess, onError: handleError },
      );
      return;
    }
    createCompany({ data: payload }, { onSuccess: handleSuccess, onError: handleError });
  };

  const taxOfficeSelectOptions = TAX_OFFICE_OPTIONS.map((o) => ({ value: o.code, label: o.label }));
  const workplaceSelectOptions = workplaceOptions.map((o) => ({ value: o.code, label: o.label }));
  const workplaceDescription = !selectedTaxOfficeCode
    ? t('settings.billing.taxOfficeHint.selectFirst')
    : selectedTaxOfficeCode === SPECIAL_TAX_OFFICE_CODE
      ? t('settings.billing.taxOfficeHint.special')
      : t('settings.billing.taxOfficeHint.normal');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {!hasExistingCompany && (
          <Card className="border-dashed">
            <CardContent className="p-6 text-sm text-muted-foreground">
              {missingCompanyMessage}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t('settings.billing.card.title')}</CardTitle>
            <CardDescription>{t('settings.billing.card.description')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <InputController
              control={form.control}
              name="name"
              label={t('settings.billing.fields.name')}
              placeholder="ACME s.r.o."
              variant="vertical"
              containerClassName="md:col-span-2"
              rules={{
                required: t('validation.required', { field: t('settings.billing.fields.name') }),
                validate: (value) =>
                  (value?.trim().length ?? 0) > 0 ||
                  t('validation.required', { field: t('settings.billing.fields.name') }),
              }}
            />
            <InputController
              control={form.control}
              name="ico"
              label={t('invoices.fields.ico')}
              placeholder="12345678"
              variant="vertical"
            />
            <InputController
              control={form.control}
              name="dic"
              label={t('invoices.fields.dic')}
              placeholder="CZ12345678"
              variant="vertical"
            />
            <InputController
              control={form.control}
              name="country"
              label={t('settings.billing.fields.country')}
              placeholder={t('settings.billing.placeholders.country')}
              variant="vertical"
              rules={{
                required: t('validation.required', { field: t('settings.billing.fields.country') }),
                validate: (value) =>
                  (value?.trim().length ?? 0) > 0 ||
                  t('validation.required', { field: t('settings.billing.fields.country') }),
              }}
            />
            <InputController
              control={form.control}
              name="street"
              label={t('settings.billing.fields.street')}
              placeholder={t('settings.billing.placeholders.street')}
              variant="vertical"
              containerClassName="md:col-span-2"
            />
            <InputController
              control={form.control}
              name="city"
              label={t('settings.billing.fields.city')}
              placeholder={t('settings.billing.placeholders.city')}
              variant="vertical"
            />
            <InputController
              control={form.control}
              name="psc"
              label={t('settings.billing.fields.psc')}
              placeholder="60200"
              variant="vertical"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('settings.billing.taxCard.title')}</CardTitle>
            <CardDescription>{t('settings.billing.taxCard.description')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <SelectController
              control={form.control}
              name="c_ufo"
              label={t('settings.billing.fields.taxOffice')}
              placeholder={t('settings.billing.placeholders.taxOffice')}
              options={taxOfficeSelectOptions}
              variant="vertical"
              clearLabel={t('common.notSelected')}
            />
            <SelectController
              control={form.control}
              name="c_pracufo"
              label={t('settings.billing.fields.taxWorkplace')}
              placeholder={t('settings.billing.placeholders.taxWorkplace')}
              options={workplaceSelectOptions}
              variant="vertical"
              containerClassName="md:col-span-2"
              clearLabel={selectedTaxOfficeCode !== SPECIAL_TAX_OFFICE_CODE ? t('common.notSelected') : undefined}
              disabled={!selectedTaxOfficeCode || selectedTaxOfficeCode === SPECIAL_TAX_OFFICE_CODE}
              description={workplaceDescription}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={isSaving}>
            {isSaving
              ? hasExistingCompany ? t('settings.billing.actions.saving') : t('settings.billing.actions.creating')
              : hasExistingCompany ? t('settings.billing.actions.save') : t('settings.billing.actions.create')}
          </Button>
        </div>
      </form>
    </Form>
  );
};
