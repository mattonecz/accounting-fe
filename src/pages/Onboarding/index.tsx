import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyCreate } from '@/api/companies/companies';
import { useUserProfileCreate } from '@/api/user-profile/user-profile';
import { Autocomplete } from '@/components/ui/autocomplete';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DollarSign } from 'lucide-react';
import type { CreateCompanyDto, CreateUserProfileDto } from '@/api/model';
import {
  SPECIAL_TAX_OFFICE_CODE,
  SPECIAL_TAX_OFFICE_WORKPLACE_CODE,
  TAX_OFFICE_OPTIONS,
  TAX_OFFICE_WORKPLACE_OPTIONS,
} from '@/lib/taxOfficeCodebooks';

const CLEAR_SELECT_VALUE = '__none__';

// Jediná podporovaná země (zatím nepodporujeme jiné státy).
const DEFAULT_COUNTRY = 'Česká republika';

const specialTaxOfficeWorkplaceOption = {
  officeCode: SPECIAL_TAX_OFFICE_CODE,
  code: SPECIAL_TAX_OFFICE_WORKPLACE_CODE,
  label: 'Specializovaný finanční úřad',
};

interface OnboardingForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  ico: string;
  companyDic: string;
  country: string;
  street: string;
  houseNumber: string;
  orientationNumber: string;
  registrationNumber: string;
  platceDPH: boolean;
  city: string;
  psc: string;
  dic: string;
  c_ufo: string;
  c_pracufo: string;
}

const ADDRESS_NUMBER_FIELDS = [
  'houseNumber',
  'orientationNumber',
  'registrationNumber',
] as const satisfies readonly (keyof OnboardingForm)[];

function findTaxOfficeCode(financniUrad: string): string {
  if (!financniUrad) return '';
  const match = TAX_OFFICE_OPTIONS.find(
    (o) => o.label.toLowerCase() === financniUrad.toLowerCase(),
  );
  return match?.code ?? '';
}

export default function Onboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user, refreshActiveCompany } = useAuth();
  const { mutate: createCompany, isPending: isCreatingCompany } =
    useCompanyCreate();
  const { mutate: createProfile, isPending: isCreatingProfile } =
    useUserProfileCreate();
  const isSaving = isCreatingCompany || isCreatingProfile;

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<OnboardingForm>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: user?.email ?? '',
      phone: '',
      companyName: '',
      ico: '',
      companyDic: '',
      country: DEFAULT_COUNTRY,
      street: '',
      houseNumber: '',
      orientationNumber: '',
      registrationNumber: '',
      platceDPH: false,
      city: '',
      psc: '',
      dic: '',
      c_ufo: '',
      c_pracufo: '',
    },
  });

  const selectedTaxOfficeCode = watch('c_ufo');
  const selectedWorkplaceCode = watch('c_pracufo');

  const workplaceOptions = useMemo(() => {
    if (!selectedTaxOfficeCode) return [];
    if (selectedTaxOfficeCode === SPECIAL_TAX_OFFICE_CODE)
      return [specialTaxOfficeWorkplaceOption];
    return TAX_OFFICE_WORKPLACE_OPTIONS.filter(
      (w) => w.officeCode === selectedTaxOfficeCode,
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
    const hasMatch = workplaceOptions.some(
      (w) => w.code === selectedWorkplaceCode,
    );
    if (selectedWorkplaceCode && !hasMatch) setValue('c_pracufo', '');
  }, [selectedTaxOfficeCode, selectedWorkplaceCode, setValue, workplaceOptions]);

  const validateAtLeastOneNumber = () => {
    const values = getValues();
    const hasAnyNumber = ADDRESS_NUMBER_FIELDS.some((fieldName) =>
      values[fieldName]?.trim(),
    );
    return Boolean(hasAnyNumber) || t('onboarding.validation.addressNumberRequired');
  };

  const handleCompanySelect = (company: CreateCompanyDto) => {
    setValue('companyName', company.name ?? '');
    setValue('ico', company.ico ?? '');
    setValue('companyDic', company.dic ?? '');
    setValue('street', company.street ?? '');
    setValue('houseNumber', company.houseNumber ?? '');
    setValue('orientationNumber', company.orientationNumber ?? '');
    setValue('registrationNumber', company.registrationNumber ?? '');
    if (typeof company.platceDPH === 'boolean') {
      setValue('platceDPH', company.platceDPH);
    }
    setValue('city', company.city ?? '');
    setValue('psc', company.psc ?? '');
    if (company.dic) {
      setValue('dic', company.dic);
    }
    void trigger('houseNumber');
  };

  const handleCompanySelectWithAres = (
    company: CreateCompanyDto,
    financniUrad?: string,
  ) => {
    handleCompanySelect(company);
    if (financniUrad) {
      const code = findTaxOfficeCode(financniUrad);
      if (code) {
        setValue('c_ufo', code);
      }
    }
  };

  const onSubmit = (data: OnboardingForm) => {
    const companyPayload: CreateCompanyDto = {
      name: data.companyName,
      country: DEFAULT_COUNTRY,
      ico: data.ico || undefined,
      dic: data.companyDic || undefined,
      street: data.street || undefined,
      houseNumber: data.houseNumber || undefined,
      orientationNumber: data.orientationNumber || undefined,
      registrationNumber: data.registrationNumber || undefined,
      platceDPH: data.platceDPH,
      city: data.city || undefined,
      psc: data.psc || undefined,
      c_ufo: data.c_ufo || undefined,
      c_pracufo: data.c_pracufo || undefined,
    };

    const profilePayload: CreateUserProfileDto = {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.trim() || undefined,
      phone: data.phone.trim() || undefined,
      dic: data.dic.trim() || undefined,
    };

    createCompany(
      { data: companyPayload },
      {
        onSuccess: () => {
          createProfile(
            { data: profilePayload },
            {
              onSuccess: async () => {
                await refreshActiveCompany();
                enqueueSnackbar(t('onboarding.messages.success'), {
                  variant: 'success',
                });
                navigate('/');
              },
              onError: async () => {
                await refreshActiveCompany();
                enqueueSnackbar(t('onboarding.messages.partial'), { variant: 'warning' });
                navigate('/');
              },
            },
          );
        },
        onError: () => {
          enqueueSnackbar(t('onboarding.messages.companyFailed'), {
            variant: 'error',
          });
        },
      },
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <DollarSign className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">{t('onboarding.title')}</h1>
          <p className="text-muted-foreground">{t('onboarding.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('onboarding.personal.title')}</CardTitle>
              <CardDescription>{t('onboarding.personal.description')}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('onboarding.personal.fields.firstName')}</Label>
                <Input
                  id="firstName"
                  {...register('firstName', {
                    required: t('onboarding.validation.firstNameRequired'),
                    validate: (v) => v.trim().length > 0 || t('onboarding.validation.firstNameRequired'),
                  })}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('onboarding.personal.fields.lastName')}</Label>
                <Input
                  id="lastName"
                  {...register('lastName', {
                    required: t('onboarding.validation.lastNameRequired'),
                    validate: (v) =>
                      v.trim().length > 0 || t('onboarding.validation.lastNameRequired'),
                  })}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('onboarding.personal.fields.email')}</Label>
                <Input
                  id="email"
                  {...register('email')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t('onboarding.personal.fields.phone')}</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('onboarding.company.title')}</CardTitle>
              <CardDescription>{t('onboarding.company.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Autocomplete
                onChange={handleCompanySelectWithAres}
                withFinancniUrad
              />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="companyName">{t('onboarding.company.fields.name')}</Label>
                  <Input
                    id="companyName"
                    {...register('companyName', {
                      required: t('onboarding.validation.companyNameRequired'),
                    })}
                  />
                  {errors.companyName && (
                    <p className="text-sm text-destructive">
                      {errors.companyName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ico">{t('onboarding.company.fields.ico')}</Label>
                  <Input id="ico" {...register('ico')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyDic">{t('onboarding.company.fields.dic')}</Label>
                  <Input
                    id="companyDic"
                    {...register('companyDic')}
                  />
                </div>
                <Controller
                  control={control}
                  name="platceDPH"
                  render={({ field }) => (
                    <div className="flex items-center gap-3 md:col-span-2">
                      <Switch
                        id="platceDPH"
                        checked={!!field.value}
                        onCheckedChange={field.onChange}
                      />
                      <Label htmlFor="platceDPH" className="!mt-0">
                        {t('onboarding.company.fields.platceDPH')}
                      </Label>
                    </div>
                  )}
                />
                <Controller
                  control={control}
                  name="country"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="country">
                        {t('onboarding.company.fields.country')}
                      </Label>
                      <Select
                        value={field.value || DEFAULT_COUNTRY}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="country">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={DEFAULT_COUNTRY}>
                            {DEFAULT_COUNTRY}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />
                <div className="space-y-2">
                  <Label htmlFor="street">{t('onboarding.company.fields.street')}</Label>
                  <Input
                    id="street"
                    {...register('street')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="houseNumber">
                    {t('onboarding.company.fields.houseNumber')}
                  </Label>
                  <Input
                    id="houseNumber"
                    {...register('houseNumber', {
                      validate: validateAtLeastOneNumber,
                      onChange: () => void trigger('houseNumber'),
                    })}
                  />
                  {errors.houseNumber && (
                    <p className="text-sm text-destructive">
                      {errors.houseNumber.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orientationNumber">
                    {t('onboarding.company.fields.orientationNumber')}
                  </Label>
                  <Input
                    id="orientationNumber"
                    {...register('orientationNumber', {
                      onChange: () => void trigger('houseNumber'),
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">
                    {t('onboarding.company.fields.registrationNumber')}
                  </Label>
                  <Input
                    id="registrationNumber"
                    {...register('registrationNumber', {
                      onChange: () => void trigger('houseNumber'),
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">{t('onboarding.company.fields.city')}</Label>
                  <Input
                    id="city"
                    {...register('city')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="psc">{t('onboarding.company.fields.psc')}</Label>
                  <Input
                    id="psc"
                    {...register('psc')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('onboarding.tax.title')}</CardTitle>
              <CardDescription>{t('onboarding.tax.description')}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dic">{t('onboarding.tax.fields.dic')}</Label>
                <Input
                  id="dic"
                  {...register('dic')}
                />
              </div>

              <Controller
                control={control}
                name="c_ufo"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="c_ufo">{t('onboarding.tax.fields.taxOffice')}</Label>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(
                          value === CLEAR_SELECT_VALUE ? '' : value,
                        )
                      }
                      value={field.value || CLEAR_SELECT_VALUE}
                    >
                      <SelectTrigger id="c_ufo">
                        <SelectValue placeholder={t('onboarding.tax.placeholders.taxOffice')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={CLEAR_SELECT_VALUE}>
                          {t('onboarding.taxOfficeClear')}
                        </SelectItem>
                        {TAX_OFFICE_OPTIONS.map((option) => (
                          <SelectItem key={option.code} value={option.code}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />

              <Controller
                control={control}
                name="c_pracufo"
                render={({ field }) => (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="c_pracufo">{t('onboarding.tax.fields.workplace')}</Label>
                    <Select
                      disabled={
                        !selectedTaxOfficeCode ||
                        selectedTaxOfficeCode === SPECIAL_TAX_OFFICE_CODE
                      }
                      onValueChange={(value) =>
                        field.onChange(
                          value === CLEAR_SELECT_VALUE ? '' : value,
                        )
                      }
                      value={field.value || CLEAR_SELECT_VALUE}
                    >
                      <SelectTrigger id="c_pracufo">
                        <SelectValue placeholder={t('onboarding.tax.placeholders.workplace')} />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedTaxOfficeCode !== SPECIAL_TAX_OFFICE_CODE && (
                          <SelectItem value={CLEAR_SELECT_VALUE}>
                            {t('onboarding.taxOfficeClear')}
                          </SelectItem>
                        )}
                        {workplaceOptions.map((option) => (
                          <SelectItem key={option.code} value={option.code}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      {!selectedTaxOfficeCode
                        ? t('onboarding.tax.hints.noOffice')
                        : selectedTaxOfficeCode === SPECIAL_TAX_OFFICE_CODE
                          ? t('onboarding.tax.hints.special')
                          : t('onboarding.tax.hints.normal')}
                    </p>
                  </div>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={isSaving}>
              {isSaving ? t('onboarding.actions.saving') : t('onboarding.actions.complete')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
