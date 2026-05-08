import { useEffect, useRef } from 'react';
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
import type { UserData } from '@/contexts/AuthContext';

const splitUserName = (name?: string) => {
  const trimmedName = name?.trim();
  if (!trimmedName) return { firstName: '', lastName: '' };
  const [firstName = '', ...rest] = trimmedName.split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
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

const toProfilePayload = (data: CreateUserProfileDto): CreateUserProfileDto => ({
  firstName: data.firstName.trim(),
  lastName: data.lastName.trim(),
  email: toOptionalField(data.email ?? ''),
  phone: toOptionalField(data.phone ?? ''),
  dic: toOptionalField(data.dic ?? ''),
});

interface PersonalInfoFormProps {
  profile?: UserProfileResponseDto | null;
  user?: UserData | null;
  isMissingProfile: boolean;
  isLoading: boolean;
  hasExistingProfile: boolean;
}

export const PersonalInfoForm = ({
  profile,
  user,
  isMissingProfile,
  isLoading,
  hasExistingProfile,
}: PersonalInfoFormProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { mutate: createProfile, isPending: isCreatingProfile } = useUserProfileCreate();
  const { mutate: updateProfile, isPending: isUpdatingProfile } = useUserProfileUpdate();
  const isSaving = isCreatingProfile || isUpdatingProfile;
  const isResettingRef = useRef(false);

  const form = useForm<CreateUserProfileDto>({
    defaultValues: { firstName: '', lastName: '', email: '', phone: '', dic: '' },
  });
  const { reset } = form;

  const resetFormValues = (values: CreateUserProfileDto) => {
    isResettingRef.current = true;
    reset(values);
  };

  useEffect(() => {
    if (profile) {
      resetFormValues(mapProfileToForm(profile, user));
      return;
    }
    if (isMissingProfile || !isLoading) {
      resetFormValues(mapProfileToForm(undefined, user));
    }
  }, [isLoading, isMissingProfile, profile, user]);

  const onSubmit = (data: CreateUserProfileDto) => {
    const payload = toProfilePayload(data);
    const handleSuccess = (response: { data: UserProfileResponseDto }) => {
      queryClient.setQueryData(getUserProfileGetQueryKey(), response);
      resetFormValues(mapProfileToForm(response.data, user));
      enqueueSnackbar(
        hasExistingProfile ? 'Profil byl úspěšně upraven.' : 'Profil byl úspěšně vytvořen.',
        { variant: 'success' },
      );
    };
    const handleError = () => {
      enqueueSnackbar(
        hasExistingProfile ? 'Úprava profilu se nepodařila.' : 'Vytvoření profilu se nepodařilo.',
        { variant: 'error' },
      );
    };
    if (hasExistingProfile) {
      updateProfile({ data: payload }, { onSuccess: handleSuccess, onError: handleError });
      return;
    }
    createProfile({ data: payload }, { onSuccess: handleSuccess, onError: handleError });
  };

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
                validate: (value) => (value?.trim().length ?? 0) > 0 || 'Jméno je povinné',
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
                validate: (value) => (value?.trim().length ?? 0) > 0 || 'Příjmení je povinné',
              }}
            />
            <InputController
              control={form.control}
              name="email"
              label="Kontaktní e-mail"
              placeholder="jan@example.cz"
              variant="vertical"
              rules={{ validate: (value) => validateOptionalEmail(value ?? '') }}
            />
            <InputController
              control={form.control}
              name="phone"
              label="Telefon"
              placeholder="+420 777 123 456"
              variant="vertical"
            />
            <InputController
              control={form.control}
              name="dic"
              label="DIČ"
              placeholder="CZ12345678"
              variant="vertical"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={isSaving}>
            {isSaving
              ? hasExistingProfile ? 'Ukládám...' : 'Vytvářím...'
              : hasExistingProfile ? 'Uložit změny' : 'Vytvořit profil'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
