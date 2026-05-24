import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import {
  getCompanyGetIsdsSettingsQueryKey,
  useCompanyGetIsdsSettings,
  useCompanyUpdateIsdsCredentials,
} from '@/api/companies/companies';
import { useDataMessagesTestLogin } from '@/api/data-messages/data-messages';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { InputController } from '@/components/InputController';

interface IsdsCredentialsFormValues {
  username: string;
  password: string;
}

export const IsdsCredentialsForm = () => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  const { data: settingsResponse } = useCompanyGetIsdsSettings({
    query: { retry: false },
  });
  const settings = settingsResponse?.data;
  const hasPassword = settings?.hasPassword ?? false;

  const form = useForm<IsdsCredentialsFormValues>({
    defaultValues: { username: '', password: '' },
  });
  const { control, handleSubmit, reset, setValue, watch } = form;

  // Sync the username from the server; never populate the password field.
  useEffect(() => {
    if (settings) {
      reset({ username: settings.username ?? '', password: '' });
    }
  }, [settings, reset]);

  const { mutate: updateCredentials, isPending: isSaving } =
    useCompanyUpdateIsdsCredentials();
  const { mutate: testLogin, isPending: isTesting } =
    useDataMessagesTestLogin();

  const username = watch('username');
  const password = watch('password');
  const hasBothFields =
    username.trim().length > 0 && password.trim().length > 0;
  const isBusy = isSaving || isTesting;
  const passwordToggleLabel = showPassword
    ? t('settings.billing.isds.actions.hidePassword')
    : t('settings.billing.isds.actions.showPassword');

  const onSubmit = (data: IsdsCredentialsFormValues) => {
    updateCredentials(
      {
        data: {
          username: data.username.trim(),
          password: data.password.trim(),
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getCompanyGetIsdsSettingsQueryKey(),
          });
          setValue('password', '');
          enqueueSnackbar(t('settings.billing.isds.messages.saveSuccess'), {
            variant: 'success',
          });
        },
        onError: () => {
          enqueueSnackbar(t('settings.billing.isds.messages.saveError'), {
            variant: 'error',
          });
        },
      },
    );
  };

  const handleTest = () => {
    testLogin(
      { data: { username: username.trim(), password: password.trim() } },
      {
        onSuccess: (response) => {
          const { success, statusMessage, owner } = response.data;
          if (success) {
            const detail = [owner?.name, statusMessage]
              .filter(Boolean)
              .join(' – ');
            enqueueSnackbar(
              detail
                ? `${t('settings.billing.isds.messages.testSuccess')} (${detail})`
                : t('settings.billing.isds.messages.testSuccess'),
              { variant: 'success' },
            );
          } else {
            enqueueSnackbar(
              statusMessage || t('settings.billing.isds.messages.testFailure'),
              { variant: 'error' },
            );
          }
        },
        onError: () => {
          enqueueSnackbar(t('settings.billing.isds.messages.testError'), {
            variant: 'error',
          });
        },
      },
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.billing.isds.card.title')}</CardTitle>
            <CardDescription>
              {t('settings.billing.isds.card.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <InputController
              control={control}
              name="username"
              label={t('settings.billing.isds.fields.username')}
              placeholder={t('settings.billing.isds.placeholders.username')}
              variant="vertical"
              autoComplete="username"
            />
            <FormField
              control={control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-2 md:col-span-2">
                  <FormLabel>
                    {t('settings.billing.isds.fields.password')}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        className="w-full pr-10"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label={passwordToggleLabel}
                        title={passwordToggleLabel}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {hasPassword && (
              <p className="text-sm text-muted-foreground md:col-span-2">
                {t('settings.billing.isds.passwordSetInfo')}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleTest}
            disabled={isBusy || !hasBothFields}
          >
            {isTesting
              ? t('settings.billing.isds.actions.testing')
              : t('settings.billing.isds.actions.test')}
          </Button>
          <Button type="submit" disabled={isBusy || !hasBothFields}>
            {isSaving
              ? t('settings.billing.isds.actions.saving')
              : t('settings.billing.isds.actions.save')}
          </Button>
        </div>
      </form>
    </Form>
  );
};
