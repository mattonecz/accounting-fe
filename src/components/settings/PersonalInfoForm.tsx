import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        hasExistingProfile
          ? t('settings.personal.messages.updateSuccess')
          : t('settings.personal.messages.createSuccess'),
        { variant: 'success' },
      );
    };
    const handleError = () => {
      enqueueSnackbar(
        hasExistingProfile
          ? t('settings.personal.messages.updateError')
          : t('settings.personal.messages.createError'),
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
            <CardTitle>{t('settings.personal.card.title')}</CardTitle>
            <CardDescription>{t('settings.personal.card.description')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <InputController
              control={form.control}
              name="firstName"
              label={t('settings.personal.fields.firstName')}
              placeholder="Jan"
              variant="vertical"
              rules={{
                required: t('validation.required', { field: t('settings.personal.fields.firstName') }),
                validate: (value) =>
                  (value?.trim().length ?? 0) > 0 ||
                  t('validation.required', { field: t('settings.personal.fields.firstName') }),
              }}
            />
            <InputController
              control={form.control}
              name="lastName"
              label={t('settings.personal.fields.lastName')}
              placeholder="Novák"
              variant="vertical"
              rules={{
                required: t('validation.required', { field: t('settings.personal.fields.lastName') }),
                validate: (value) =>
                  (value?.trim().length ?? 0) > 0 ||
                  t('validation.required', { field: t('settings.personal.fields.lastName') }),
              }}
            />
            <InputController
              control={form.control}
              name="email"
              label={t('settings.personal.fields.email')}
              placeholder="jan@example.cz"
              variant="vertical"
              rules={{
                validate: (value) => {
                  if (!value?.trim()) return true;
                  return (
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ||
                    t('validation.email')
                  );
                },
              }}
            />
            <InputController
              control={form.control}
              name="phone"
              label={t('settings.personal.fields.phone')}
              placeholder="+420 777 123 456"
              variant="vertical"
            />
            <InputController
              control={form.control}
              name="dic"
              label={t('invoices.fields.dic')}
              placeholder="CZ12345678"
              variant="vertical"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={isSaving}>
            {isSaving
              ? t('common.saving')
              : hasExistingProfile
                ? t('common.saveChanges')
                : t('settings.personal.actions.create')}
          </Button>
        </div>
      </form>
    </Form>
  );
};
