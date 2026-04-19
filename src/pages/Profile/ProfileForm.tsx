import { useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  getUserProfileGetQueryKey,
  useUserProfileCreate,
  useUserProfileUpdate,
} from '@/api/user-profile/user-profile';
import type { CreateUserProfileDto, UserProfileResponseDto } from '@/api/model';
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
import type { UserData } from '@/contexts/AuthContext';
import {
  SPECIAL_TAX_OFFICE_CODE,
  SPECIAL_TAX_OFFICE_WORKPLACE_CODE,
  SPECIAL_TAX_OFFICE_WORKPLACE_LABEL,
  TAX_OFFICE_OPTIONS,
  TAX_OFFICE_WORKPLACE_OPTIONS,
} from '@/lib/taxOfficeCodebooks';

const specialTaxOfficeWorkplaceOption = {
  officeCode: SPECIAL_TAX_OFFICE_CODE,
  code: SPECIAL_TAX_OFFICE_WORKPLACE_CODE,
  label: SPECIAL_TAX_OFFICE_WORKPLACE_LABEL,
};

const splitUserName = (name?: string) => {
  const trimmedName = name?.trim();
  if (!trimmedName) return { firstName: '', lastName: '' };
  const [firstName = '', ...rest] = trimmedName.split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
};

const normalizeCodeValue = (value?: string | null) => {
  if (value == null) return '';
  return String(value).trim();
};

const mapProfileToForm = (
  profile?: UserProfileResponseDto | null,
  user?: UserData | null,
): CreateUserProfileDto => {
  const fallbackName = splitUserName(user?.name);

  return {
    firstName: profile?.firstName ?? fallbackName.firstName,
    lastName: profile?.lastName ?? fallbackName.lastName,
    email: profile?.email ?? user?.email ?? '',
    phone: profile?.phone ?? '',
    dic: profile?.dic ?? '',
    c_ufo: normalizeCodeValue(profile?.c_ufo),
    c_pracufo: normalizeCodeValue(profile?.c_pracufo),
  };
};

const toOptionalField = (value: string) => {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

const validateOptionalEmail = (value: string) => {
  if (!value.trim()) return true;
  return (
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) || 'Zadejte platný e-mail'
  );
};

const toProfilePayload = (
  data: CreateUserProfileDto,
): CreateUserProfileDto => ({
  firstName: data.firstName.trim(),
  lastName: data.lastName.trim(),
  email: toOptionalField(data.email ?? ''),
  phone: toOptionalField(data.phone ?? ''),
  dic: toOptionalField(data.dic ?? ''),
  c_ufo: toOptionalField(data.c_ufo ?? ''),
  c_pracufo: toOptionalField(data.c_pracufo ?? ''),
});

interface ProfileFormProps {
  profile?: UserProfileResponseDto | null;
  user?: UserData | null;
  isMissingProfile: boolean;
  isLoading: boolean;
  hasExistingProfile: boolean;
}

export const ProfileForm = ({
  profile,
  user,
  isMissingProfile,
  isLoading,
  hasExistingProfile,
}: ProfileFormProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { mutate: createProfile, isPending: isCreatingProfile } =
    useUserProfileCreate();
  const { mutate: updateProfile, isPending: isUpdatingProfile } =
    useUserProfileUpdate();
  const isSaving = isCreatingProfile || isUpdatingProfile;
  const isResettingRef = useRef(false);

  const form = useForm<CreateUserProfileDto>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dic: '',
      c_ufo: '',
      c_pracufo: '',
    },
  });
  const { reset, setValue, watch } = form;

  const resetFormValues = (values: CreateUserProfileDto) => {
    isResettingRef.current = true;
    reset(values);
  };

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
    if (profile) {
      resetFormValues(mapProfileToForm(profile, user));
      return;
    }
    if (isMissingProfile || !isLoading) {
      resetFormValues(mapProfileToForm(undefined, user));
    }
  }, [isLoading, isMissingProfile, profile, user]);

  useEffect(() => {
    if (isResettingRef.current) {
      isResettingRef.current = false;
      return;
    }

    if (!selectedTaxOfficeCode) {
      if (selectedWorkplaceCode) setValue('c_pracufo', '');
      return;
    }
    if (selectedTaxOfficeCode === SPECIAL_TAX_OFFICE_CODE) {
      if (selectedWorkplaceCode !== SPECIAL_TAX_OFFICE_WORKPLACE_CODE)
        setValue('c_pracufo', SPECIAL_TAX_OFFICE_WORKPLACE_CODE);
      return;
    }
    const hasMatchingWorkplace = workplaceOptions.some(
      (w) => w.code === selectedWorkplaceCode,
    );
    if (selectedWorkplaceCode && !hasMatchingWorkplace)
      setValue('c_pracufo', '');
  }, [
    selectedTaxOfficeCode,
    selectedWorkplaceCode,
    setValue,
    workplaceOptions,
  ]);

  const onSubmit = (data: CreateUserProfileDto) => {
    const payload = toProfilePayload(data);
    const handleSuccess = (response: { data: UserProfileResponseDto }) => {
      queryClient.setQueryData(getUserProfileGetQueryKey(), response);
      resetFormValues(mapProfileToForm(response.data, user));
      enqueueSnackbar(
        hasExistingProfile
          ? 'Profil byl úspěšně upraven.'
          : 'Profil byl úspěšně vytvořen.',
        { variant: 'success' },
      );
    };
    const handleError = () => {
      enqueueSnackbar(
        hasExistingProfile
          ? 'Úprava profilu se nepodařila.'
          : 'Vytvoření profilu se nepodařilo.',
        { variant: 'error' },
      );
    };
    if (hasExistingProfile) {
      updateProfile(
        { data: payload },
        { onSuccess: handleSuccess, onError: handleError },
      );
      return;
    }
    createProfile(
      { data: payload },
      { onSuccess: handleSuccess, onError: handleError },
    );
  };

  const taxOfficeSelectOptions = TAX_OFFICE_OPTIONS.map((o) => ({
    value: o.code,
    label: o.label,
  }));
  const workplaceSelectOptions = workplaceOptions.map((o) => ({
    value: o.code,
    label: o.label,
  }));
  const workplaceDescription = !selectedTaxOfficeCode
    ? 'Nejdřív vyberte finanční úřad.'
    : selectedTaxOfficeCode === SPECIAL_TAX_OFFICE_CODE
      ? 'U specializovaného finančního úřadu se pracoviště nastaví automaticky na kód 4000.'
      : 'Nabídka obsahuje pouze pracoviště patřící k vybranému finančnímu úřadu.';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Osobní údaje</CardTitle>
            <CardDescription>
              Základní kontaktní údaje uložené ve vašem uživatelském profilu.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <InputController
              control={form.control}
              name="firstName"
              label="Jméno"
              placeholder="Jan"
              variant="vertical"
              rules={{
                required: 'Jméno je povinné',
                validate: (value) =>
                  (value?.trim().length ?? 0) > 0 || 'Jméno je povinné',
              }}
            />
            <InputController
              control={form.control}
              name="lastName"
              label="Příjmení"
              placeholder="Novák"
              variant="vertical"
              rules={{
                required: 'Příjmení je povinné',
                validate: (value) =>
                  (value?.trim().length ?? 0) > 0 || 'Příjmení je povinné',
              }}
            />
            <InputController
              control={form.control}
              name="email"
              label="Kontaktní e-mail"
              placeholder="jan@example.cz"
              variant="vertical"
              rules={{
                validate: (value) => validateOptionalEmail(value ?? ''),
              }}
            />
            <InputController
              control={form.control}
              name="phone"
              label="Telefon"
              placeholder="+420 777 123 456"
              variant="vertical"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Údaje pro daňová podání</CardTitle>
            <CardDescription>
              Pole finančního úřadu a pracoviště vycházejí z oficiálních
              číselníků MOJE daně.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <InputController
              control={form.control}
              name="dic"
              label="DIČ"
              placeholder="CZ12345678"
              variant="vertical"
            />
            <SelectController
              control={form.control}
              name="c_ufo"
              label="Finanční úřad"
              placeholder="Vyberte finanční úřad"
              options={taxOfficeSelectOptions}
              variant="vertical"
              clearLabel="Nevybráno"
            />
            <SelectController
              control={form.control}
              name="c_pracufo"
              label="Územní pracoviště"
              placeholder="Vyberte územní pracoviště"
              options={workplaceSelectOptions}
              variant="vertical"
              containerClassName="md:col-span-2"
              clearLabel={
                selectedTaxOfficeCode !== SPECIAL_TAX_OFFICE_CODE
                  ? 'Nevybráno'
                  : undefined
              }
              disabled={
                !selectedTaxOfficeCode ||
                selectedTaxOfficeCode === SPECIAL_TAX_OFFICE_CODE
              }
              description={workplaceDescription}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={isSaving}>
            {isSaving
              ? hasExistingProfile
                ? 'Ukládám...'
                : 'Vytvářím...'
              : hasExistingProfile
                ? 'Uložit změny'
                : 'Vytvořit profil'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
