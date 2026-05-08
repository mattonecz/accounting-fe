import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import * as axios from 'axios';
import {
  getInvoiceSettingsGetQueryKey,
  useInvoiceSettingsGet,
  useInvoiceSettingsUpdate,
} from '@/api/invoice-settings/invoice-settings';
import type { InvoiceSettingsResponseDto, UpdateInvoiceSettingsDto } from '@/api/model';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form, FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { InputController } from '@/components/InputController';

interface FormValues {
  invoicePrefix: string;
  invoiceNumberFormat: string;
  nextInvoiceNumber: string;
  dueDaysDefault: string;
  defaultVatRate: string;
  defaultHeaderText: string;
  defaultFooterText: string;
  logoUrl: string;
}

const mapToForm = (settings?: InvoiceSettingsResponseDto | null): FormValues => ({
  invoicePrefix: settings?.invoicePrefix ?? '',
  invoiceNumberFormat: settings?.invoiceNumberFormat ?? '',
  nextInvoiceNumber: settings?.nextInvoiceNumber != null ? String(settings.nextInvoiceNumber) : '',
  dueDaysDefault: settings?.dueDaysDefault != null ? String(settings.dueDaysDefault) : '',
  defaultVatRate: settings?.defaultVatRate != null ? String(settings.defaultVatRate) : '',
  defaultHeaderText: settings?.defaultHeaderText ?? '',
  defaultFooterText: settings?.defaultFooterText ?? '',
  logoUrl: settings?.logoUrl ?? '',
});

const toOptional = (v: string) => v.trim() || undefined;
const toOptionalNumber = (v: string) => {
  const n = parseFloat(v);
  return isNaN(n) ? undefined : n;
};

const toPayload = (data: FormValues): UpdateInvoiceSettingsDto => ({
  invoicePrefix: toOptional(data.invoicePrefix),
  invoiceNumberFormat: toOptional(data.invoiceNumberFormat),
  nextInvoiceNumber: toOptionalNumber(data.nextInvoiceNumber),
  dueDaysDefault: toOptionalNumber(data.dueDaysDefault),
  defaultVatRate: toOptionalNumber(data.defaultVatRate),
  defaultHeaderText: toOptional(data.defaultHeaderText),
  defaultFooterText: toOptional(data.defaultFooterText),
  logoUrl: toOptional(data.logoUrl),
});

export const InvoiceDefaultsForm = () => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { data: settingsResponse, isLoading, error } = useInvoiceSettingsGet({ query: { retry: false } });
  const { mutate: updateSettings, isPending: isSaving } = useInvoiceSettingsUpdate();

  const is404 = axios.isAxiosError(error) && error.response?.status === 404;
  const settings = settingsResponse?.data;

  const form = useForm<FormValues>({ defaultValues: mapToForm() });
  const { reset } = form;

  useEffect(() => {
    reset(mapToForm(settings));
  }, [settings, reset]);

  const onSubmit = (data: FormValues) => {
    updateSettings(
      { data: toPayload(data) },
      {
        onSuccess: (response) => {
          queryClient.setQueryData(getInvoiceSettingsGetQueryKey(), response);
          reset(mapToForm(response.data));
          enqueueSnackbar(t('settings.defaults.messages.saveSuccess'), { variant: 'success' });
        },
        onError: () => {
          enqueueSnackbar(t('settings.defaults.messages.saveError'), { variant: 'error' });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          {t('settings.defaults.loading')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {is404 && (
          <Card className="border-dashed">
            <CardContent className="p-6 text-sm text-muted-foreground">
              {t('settings.defaults.notSetHint')}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t('settings.defaults.card.title')}</CardTitle>
            <CardDescription>{t('settings.defaults.card.description')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <FormLabel>{t('settings.defaults.fields.currency')}</FormLabel>
              <Input value={settings?.currency ?? 'CZK'} disabled className="w-full" />
            </div>

            <InputController
              control={form.control}
              name="invoicePrefix"
              label={t('settings.defaults.fields.invoicePrefix')}
              placeholder="FV"
              variant="vertical"
            />
            <InputController
              control={form.control}
              name="invoiceNumberFormat"
              label={t('settings.defaults.fields.invoiceNumberFormat')}
              placeholder="{YYYY}{0001}"
              variant="vertical"
            />
            <InputController
              control={form.control}
              name="nextInvoiceNumber"
              label={t('settings.defaults.fields.nextInvoiceNumber')}
              type="number"
              variant="vertical"
            />
            <InputController
              control={form.control}
              name="dueDaysDefault"
              label={t('settings.defaults.fields.dueDaysDefault')}
              type="number"
              variant="vertical"
            />
            <InputController
              control={form.control}
              name="defaultVatRate"
              label={t('settings.defaults.fields.defaultVatRate')}
              type="number"
              variant="vertical"
            />
            <Controller
              control={form.control}
              name="defaultHeaderText"
              render={({ field, fieldState }) => (
                <FormItem className="space-y-2 md:col-span-2">
                  <FormLabel>{t('settings.defaults.fields.defaultHeaderText')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="w-full resize-none" rows={3} />
                  </FormControl>
                  {fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}
                </FormItem>
              )}
            />
            <Controller
              control={form.control}
              name="defaultFooterText"
              render={({ field, fieldState }) => (
                <FormItem className="space-y-2 md:col-span-2">
                  <FormLabel>{t('settings.defaults.fields.defaultFooterText')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="w-full resize-none" rows={3} />
                  </FormControl>
                  {fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}
                </FormItem>
              )}
            />
            <InputController
              control={form.control}
              name="logoUrl"
              label={t('settings.defaults.fields.logoUrl')}
              placeholder="https://..."
              variant="vertical"
              containerClassName="md:col-span-2"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={isSaving}>
            {isSaving ? t('common.saving') : t('common.saveChanges')}
          </Button>
        </div>
      </form>
    </Form>
  );
};
