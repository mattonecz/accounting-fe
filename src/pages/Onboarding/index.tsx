import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
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
  city: string;
  psc: string;
  dic: string;
  c_ufo: string;
  c_pracufo: string;
}

function findTaxOfficeCode(financniUrad: string): string {
  if (!financniUrad) return '';
  const match = TAX_OFFICE_OPTIONS.find(
    (o) => o.label.toLowerCase() === financniUrad.toLowerCase(),
  );
  return match?.code ?? '';
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user, updateUser } = useAuth();
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
      country: 'CZ',
      street: '',
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

  const handleCompanySelect = (company: CreateCompanyDto) => {
    setValue('companyName', company.name ?? '');
    setValue('ico', company.ico ?? '');
    setValue('companyDic', company.dic ?? '');
    setValue('country', company.country ?? 'CZ');
    setValue('street', company.street ?? '');
    setValue('city', company.city ?? '');
    setValue('psc', company.psc ?? '');
    // Prefill DPH details from company lookup
    if (company.dic) {
      setValue('dic', company.dic);
    }
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
      country: data.country,
      isOwn: true,
      ico: data.ico || undefined,
      dic: data.companyDic || undefined,
      street: data.street || undefined,
      city: data.city || undefined,
      psc: data.psc || undefined,
    };

    const profilePayload: CreateUserProfileDto = {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.trim() || undefined,
      phone: data.phone.trim() || undefined,
      dic: data.dic.trim() || undefined,
      c_ufo: data.c_ufo || undefined,
      c_pracufo: data.c_pracufo || undefined,
    };

    createCompany(
      { data: companyPayload },
      {
        onSuccess: (companyRes) => {
          createProfile(
            { data: profilePayload },
            {
              onSuccess: () => {
                updateUser({ companyId: companyRes.data.id });
                enqueueSnackbar('Profil a firma byly úspěšně vytvořeny.', {
                  variant: 'success',
                });
                navigate('/');
              },
              onError: () => {
                // Company created but profile failed — still set companyId so user can edit profile later
                updateUser({ companyId: companyRes.data.id });
                enqueueSnackbar(
                  'Firma vytvořena, ale profil se nepodařilo uložit. Můžete ho upravit v nastavení.',
                  { variant: 'warning' },
                );
                navigate('/');
              },
            },
          );
        },
        onError: () => {
          enqueueSnackbar('Vytvoření firmy se nepodařilo.', {
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
          <h1 className="text-2xl font-bold">Nastavení profilu</h1>
          <p className="text-muted-foreground">
            Vyplňte své údaje a informace o firmě pro dokončení registrace.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal info */}
          <Card>
            <CardHeader>
              <CardTitle>Osobní údaje</CardTitle>
              <CardDescription>
                Základní kontaktní údaje pro váš profil.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Jméno</Label>
                <Input
                  id="firstName"
                  {...register('firstName', {
                    required: 'Jméno je povinné',
                    validate: (v) => v.trim().length > 0 || 'Jméno je povinné',
                  })}
                  placeholder="Jan"
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Příjmení</Label>
                <Input
                  id="lastName"
                  {...register('lastName', {
                    required: 'Příjmení je povinné',
                    validate: (v) =>
                      v.trim().length > 0 || 'Příjmení je povinné',
                  })}
                  placeholder="Novák"
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Kontaktní e-mail</Label>
                <Input
                  id="email"
                  {...register('email')}
                  placeholder="jan@example.cz"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="+420 777 123 456"
                />
              </div>
            </CardContent>
          </Card>

          {/* Company info */}
          <Card>
            <CardHeader>
              <CardTitle>Firma</CardTitle>
              <CardDescription>
                Údaje o vaší firmě. Zadejte IČO nebo název pro vyhledání v ARES.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Autocomplete
                onChange={handleCompanySelectWithAres}
                withFinancniUrad
              />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Název firmy</Label>
                  <Input
                    id="companyName"
                    {...register('companyName', {
                      required: 'Název firmy je povinný',
                    })}
                    placeholder="Firma s.r.o."
                  />
                  {errors.companyName && (
                    <p className="text-sm text-destructive">
                      {errors.companyName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ico">IČO</Label>
                  <Input id="ico" {...register('ico')} placeholder="12345678" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyDic">DIČ firmy</Label>
                  <Input
                    id="companyDic"
                    {...register('companyDic')}
                    placeholder="CZ12345678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Země</Label>
                  <Input
                    id="country"
                    {...register('country')}
                    placeholder="CZ"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="street">Ulice</Label>
                  <Input
                    id="street"
                    {...register('street')}
                    placeholder="Hlavní 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Město</Label>
                  <Input
                    id="city"
                    {...register('city')}
                    placeholder="Praha"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="psc">PSČ</Label>
                  <Input
                    id="psc"
                    {...register('psc')}
                    placeholder="110 00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* DPH details */}
          <Card>
            <CardHeader>
              <CardTitle>Údaje pro daňová podání</CardTitle>
              <CardDescription>
                Pole finančního úřadu a pracoviště vycházejí z oficiálních
                číselníků MOJE daně.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dic">DIČ</Label>
                <Input
                  id="dic"
                  {...register('dic')}
                  placeholder="CZ12345678"
                />
              </div>

              <Controller
                control={control}
                name="c_ufo"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="c_ufo">Finanční úřad</Label>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(
                          value === CLEAR_SELECT_VALUE ? '' : value,
                        )
                      }
                      value={field.value || CLEAR_SELECT_VALUE}
                    >
                      <SelectTrigger id="c_ufo">
                        <SelectValue placeholder="Vyberte finanční úřad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={CLEAR_SELECT_VALUE}>
                          Nevybráno
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
                    <Label htmlFor="c_pracufo">Územní pracoviště</Label>
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
                        <SelectValue placeholder="Vyberte územní pracoviště" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedTaxOfficeCode !== SPECIAL_TAX_OFFICE_CODE && (
                          <SelectItem value={CLEAR_SELECT_VALUE}>
                            Nevybráno
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
                        ? 'Nejdřív vyberte finanční úřad.'
                        : selectedTaxOfficeCode === SPECIAL_TAX_OFFICE_CODE
                          ? 'U specializovaného finančního úřadu se pracoviště nastaví automaticky na kód 4000.'
                          : 'Nabídka obsahuje pouze pracoviště patřící k vybranému finančnímu úřadu.'}
                    </p>
                  </div>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={isSaving}>
              {isSaving ? 'Ukládám...' : 'Dokončit registraci'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
