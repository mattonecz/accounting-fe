import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyCreate } from '@/api/companies/companies';
import { useGetRegistrationData } from '@/api/ares/ares';
import { Autocomplete } from '@/components/ui/autocomplete';
import { InputController } from '@/components/InputController';
import { Form } from '@/components/ui/form';
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
import type {
  CreateCompanyDto,
  CreateCompanyDtoCompanyType,
  RegistrationDataResponseDto,
} from '@/api/model';
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
  companyName: string;
  companyType: '' | CreateCompanyDtoCompanyType;
  ico: string;
  companyDic: string;
  country: string;
  street: string;
  houseNumber: string;
  orientationNumber: string;
  registrationNumber: string;
  vatPayer: boolean;
  city: string;
  psc: string;
  c_ufo: string;
  c_pracufo: string;
}

// Mapování ARES právní formy na typ firmy. Fyzické osoby (kódy "10x") => OSVČ,
// vše ostatní => SRO. Fallback dle přítomnosti jména/příjmení řeší prefill.
function deriveCompanyType(
  pravniForma: string | undefined,
): '' | CreateCompanyDtoCompanyType {
  if (!pravniForma) return '';
  return pravniForma.startsWith('10') ? 'OSVC' : 'SRO';
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
  const { refreshActiveCompany } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const { mutate: createCompany, isPending: isCreatingCompany } =
    useCompanyCreate();
  const { mutate: fetchRegistrationData, isPending: isFetchingRegistration } =
    useGetRegistrationData();
  const isSaving = isCreatingCompany;

  const form = useForm<OnboardingForm>({
    defaultValues: {
      firstName: '',
      lastName: '',
      companyName: '',
      companyType: 'OSVC',
      ico: '',
      companyDic: '',
      country: DEFAULT_COUNTRY,
      street: '',
      houseNumber: '',
      orientationNumber: '',
      registrationNumber: '',
      vatPayer: false,
      city: '',
      psc: '',
      c_ufo: '',
      c_pracufo: '',
    },
  });

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    getValues,
    trigger,
    formState: { errors },
  } = form;

  const selectedTaxOfficeCode = watch('c_ufo');
  const selectedWorkplaceCode = watch('c_pracufo');
  const isOsvc = watch('companyType') === 'OSVC';
  const isVatPayer = watch('vatPayer');

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
  }, [
    selectedTaxOfficeCode,
    selectedWorkplaceCode,
    setValue,
    workplaceOptions,
  ]);

  const validateAtLeastOneNumber = () => {
    const values = getValues();
    const hasAnyNumber = ADDRESS_NUMBER_FIELDS.some((fieldName) =>
      values[fieldName]?.trim(),
    );
    return (
      Boolean(hasAnyNumber) || t('onboarding.validation.addressNumberRequired')
    );
  };

  const handleCompanySelect = (company: Partial<CreateCompanyDto>) => {
    setValue('companyName', company.companyName ?? '');
    setValue('ico', company.ico ?? '');
    setValue('companyDic', company.dic ?? '');
    setValue('street', company.street ?? '');
    setValue('houseNumber', company.houseNumber ?? '');
    setValue('orientationNumber', company.orientationNumber ?? '');
    setValue('registrationNumber', company.registrationNumber ?? '');
    if (typeof company.vatPayer === 'boolean') {
      setValue('vatPayer', company.vatPayer);
    }
    if (company.companyType) {
      setValue('companyType', company.companyType);
    }
    if (company.name) {
      setValue('firstName', company.name);
    }
    if (company.surname) {
      setValue('lastName', company.surname);
    }
    setValue('city', company.city ?? '');
    setValue('psc', company.psc ?? '');
    void trigger('houseNumber');
  };

  const handleCompanySelectWithAres = (
    company: Partial<CreateCompanyDto>,
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

  const prefillFromRegistration = (data: RegistrationDataResponseDto) => {
    if (data.obchodniJmeno) setValue('companyName', data.obchodniJmeno);
    if (data.jmeno) setValue('firstName', data.jmeno);
    if (data.prijmeni) setValue('lastName', data.prijmeni);
    if (data.ico) setValue('ico', data.ico);
    if (data.dic) setValue('companyDic', data.dic);
    setValue('vatPayer', !!data.found);

    const companyType =
      deriveCompanyType(data.pravniForma) ||
      (data.jmeno || data.prijmeni ? 'OSVC' : '');
    if (companyType) setValue('companyType', companyType);

    const sidlo = data.sidlo;
    if (sidlo) {
      const streetName = sidlo.nazevUlice || sidlo.nazevCastiObce || '';
      // typCisloDomovni: 1 = číslo popisné, 2 = číslo evidenční
      const isEvidencni = sidlo.typCisloDomovni === 2;
      const cisloDomovni =
        sidlo.cisloDomovni != null ? String(sidlo.cisloDomovni) : '';
      const cisloOrientacni =
        sidlo.cisloOrientacni != null ? String(sidlo.cisloOrientacni) : '';

      setValue('street', streetName);
      setValue('houseNumber', isEvidencni ? '' : cisloDomovni);
      setValue('registrationNumber', isEvidencni ? cisloDomovni : '');
      setValue('orientationNumber', cisloOrientacni);
      setValue('city', sidlo.nazevObce ?? '');
      setValue('psc', sidlo.psc != null ? String(sidlo.psc) : '');
    }

    if (data.financniUrad) {
      const code = findTaxOfficeCode(data.financniUrad);
      if (code) setValue('c_ufo', code);
    }
  };

  const handleContinue = async () => {
    const valid = await trigger('ico');
    if (!valid) return;

    const { ico } = getValues();
    fetchRegistrationData(
      { data: { ico } },
      {
        onSuccess: (res) => {
          prefillFromRegistration(res.data);
          setStep(2);
        },
        onError: () => {
          enqueueSnackbar(t('onboarding.messages.registrationFailed'), {
            variant: 'warning',
          });
          setStep(2);
        },
      },
    );
  };

  const onSubmit = (data: OnboardingForm) => {
    const isOsvcType = data.companyType === 'OSVC';
    const firstName = data.firstName.trim();
    const lastName = data.lastName.trim();

    // OSVČ: povinné jméno + příjmení. SRO: povinný název firmy.
    if (isOsvcType) {
      let invalid = false;
      if (!firstName) {
        setError('firstName', {
          type: 'required',
          message: t('onboarding.validation.firstNameRequired'),
        });
        invalid = true;
      }
      if (!lastName) {
        setError('lastName', {
          type: 'required',
          message: t('onboarding.validation.lastNameRequired'),
        });
        invalid = true;
      }
      if (invalid) return;
    } else if (!data.companyName.trim()) {
      setError('companyName', {
        type: 'required',
        message: t('onboarding.validation.companyNameRequired'),
      });
      return;
    }

    // U OSVČ se název firmy bere z ARES, jinak se složí z "jméno příjmení".
    const companyName =
      data.companyName.trim() ||
      (isOsvcType ? `${firstName} ${lastName}`.trim() : '');

    const companyPayload: CreateCompanyDto = {
      companyType: data.companyType || 'OSVC',
      name: isOsvcType ? firstName || undefined : undefined,
      surname: isOsvcType ? lastName || undefined : undefined,
      companyName: companyName || undefined,
      country: DEFAULT_COUNTRY,
      ico: data.ico.trim(),
      dic: data.companyDic.trim() || undefined,
      street: data.street.trim() || undefined,
      houseNumber: data.houseNumber.trim() || undefined,
      orientationNumber: data.orientationNumber.trim() || undefined,
      registrationNumber: data.registrationNumber.trim() || undefined,
      vatPayer: data.vatPayer,
      city: data.city.trim(),
      psc: data.psc.trim(),
      c_ufo: data.vatPayer ? data.c_ufo || undefined : undefined,
      c_pracufo: data.vatPayer ? data.c_pracufo || undefined : undefined,
    };

    createCompany(
      { data: companyPayload },
      {
        onSuccess: async () => {
          await refreshActiveCompany();
          enqueueSnackbar(t('onboarding.messages.success'), {
            variant: 'success',
          });
          navigate('/');
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
    <Form {...form}>
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
        <div className="w-full max-w-2xl space-y-6">
          <div className="space-y-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <DollarSign className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">{t('onboarding.title')}</h1>
            <p className="text-muted-foreground">{t('onboarding.subtitle')}</p>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('onboarding.step1.title')}</CardTitle>
                  <CardDescription>
                    {t('onboarding.step1.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <InputController
                    control={control}
                    name="ico"
                    label={t('onboarding.company.fields.ico')}
                    rules={{
                      required: t('onboarding.validation.icoRequired'),
                      validate: (v: string) =>
                        /^\d{8}$/.test(v.trim()) ||
                        t('onboarding.validation.icoInvalid'),
                    }}
                  />
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-muted-foreground"
                      onClick={() => setStep(2)}
                    >
                      {t('onboarding.actions.fillManually')}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  type="button"
                  size="lg"
                  onClick={handleContinue}
                  disabled={isFetchingRegistration}
                >
                  {isFetchingRegistration
                    ? t('onboarding.actions.loadingRegistration')
                    : t('onboarding.actions.continue')}
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('onboarding.company.title')}</CardTitle>
                  <CardDescription>
                    {t('onboarding.company.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Autocomplete
                    onChange={handleCompanySelectWithAres}
                    withFinancniUrad
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    {isOsvc && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="firstName">
                            {t('onboarding.personal.fields.firstName')}
                          </Label>
                          <Input id="firstName" {...register('firstName')} />
                          {errors.firstName && (
                            <p className="text-sm text-destructive">
                              {errors.firstName.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">
                            {t('onboarding.personal.fields.lastName')}
                          </Label>
                          <Input id="lastName" {...register('lastName')} />
                          {errors.lastName && (
                            <p className="text-sm text-destructive">
                              {errors.lastName.message}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="companyName">
                        {t('onboarding.company.fields.name')}
                      </Label>
                      <Input id="companyName" {...register('companyName')} />
                      {errors.companyName && (
                        <p className="text-sm text-destructive">
                          {errors.companyName.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ico">
                        {t('onboarding.company.fields.ico')}
                      </Label>
                      <Input
                        id="ico"
                        {...register('ico', {
                          required: t('onboarding.validation.icoRequired'),
                          validate: (v) =>
                            /^\d{8}$/.test(v.trim()) ||
                            t('onboarding.validation.icoInvalid'),
                        })}
                      />
                      {errors.ico && (
                        <p className="text-sm text-destructive">
                          {errors.ico.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyDic">
                        {t('onboarding.company.fields.dic')}
                      </Label>
                      <Input id="companyDic" {...register('companyDic')} />
                    </div>
                    <Controller
                      control={control}
                      name="companyType"
                      render={({ field }) => (
                        <div className="space-y-2">
                          <Label htmlFor="companyType">
                            {t('onboarding.company.fields.companyType')}
                          </Label>
                          <Select
                            value={field.value || undefined}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger id="companyType">
                              <SelectValue
                                placeholder={t(
                                  'onboarding.company.placeholders.companyType',
                                )}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OSVC">
                                {t('onboarding.company.companyType.OSVC')}
                              </SelectItem>
                              <SelectItem value="SRO">
                                {t('onboarding.company.companyType.SRO')}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    />
                    <Controller
                      control={control}
                      name="vatPayer"
                      render={({ field }) => (
                        <div className="flex items-center gap-3 md:col-span-2">
                          <Switch
                            id="vatPayer"
                            checked={!!field.value}
                            onCheckedChange={field.onChange}
                          />
                          <Label htmlFor="vatPayer" className="!mt-0">
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
                      <Label htmlFor="street">
                        {t('onboarding.company.fields.street')}
                      </Label>
                      <Input id="street" {...register('street')} />
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
                      <Label htmlFor="city">
                        {t('onboarding.company.fields.city')}
                      </Label>
                      <Input
                        id="city"
                        {...register('city', {
                          required: t('onboarding.validation.cityRequired'),
                        })}
                      />
                      {errors.city && (
                        <p className="text-sm text-destructive">
                          {errors.city.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="psc">
                        {t('onboarding.company.fields.psc')}
                      </Label>
                      <Input
                        id="psc"
                        {...register('psc', {
                          required: t('onboarding.validation.pscRequired'),
                        })}
                      />
                      {errors.psc && (
                        <p className="text-sm text-destructive">
                          {errors.psc.message}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {isVatPayer && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('onboarding.tax.title')}</CardTitle>
                    <CardDescription>
                      {t('onboarding.tax.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <Controller
                      control={control}
                      name="c_ufo"
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label htmlFor="c_ufo">
                          {t('onboarding.tax.fields.taxOffice')}
                        </Label>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(
                              value === CLEAR_SELECT_VALUE ? '' : value,
                            )
                          }
                          value={field.value || CLEAR_SELECT_VALUE}
                        >
                          <SelectTrigger id="c_ufo">
                            <SelectValue
                              placeholder={t(
                                'onboarding.tax.placeholders.taxOffice',
                              )}
                            />
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
                        <Label htmlFor="c_pracufo">
                          {t('onboarding.tax.fields.workplace')}
                        </Label>
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
                            <SelectValue
                              placeholder={t(
                                'onboarding.tax.placeholders.workplace',
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedTaxOfficeCode !==
                              SPECIAL_TAX_OFFICE_CODE && (
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
              )}

              <div className="flex justify-between">
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={isSaving}
                >
                  {t('onboarding.actions.back')}
                </Button>
                <Button type="submit" size="lg" disabled={isSaving}>
                  {isSaving
                    ? t('onboarding.actions.saving')
                    : t('onboarding.actions.complete')}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Form>
  );
}
