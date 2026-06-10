import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import {
  getBankListByCompanyQueryKey,
  useBankListByCompany,
  useBankUpdate,
} from '@/api/bank/bank';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { FormCard } from '@/components/FormCard';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import {
  BankAccountFormFields,
  type BankAccountFormValues,
} from '@/components/bank/BankAccountFormFields';

const UpdateBankAccount = () => {
  const { t } = useTranslation();
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data: bankAccounts, isLoading } = useBankListByCompany();
  const account = useMemo(
    () => bankAccounts?.data?.find((a) => a.id === id),
    [bankAccounts, id],
  );

  const { mutate: updateBank, isPending } = useBankUpdate();
  const form = useForm<BankAccountFormValues>({ defaultValues: { name: '', currency: '' } });

  useEffect(() => {
    if (!account) return;
    form.reset({
      name: account.name ?? '',
      number: account.number,
      iban: account.iban,
      swift: account.swift,
      currency: account.currency ?? '',
    });
  }, [account, form]);

  const onSubmit = (data: BankAccountFormValues) => {
    if (!account) return;
    updateBank(
      { data: { ...data, id: account.id, default: account.default } },
      {
        onSuccess: async () => {
          enqueueSnackbar(t('bankAccounts.messages.updated', { name: data.name }), {
            variant: 'success',
          });
          await queryClient.invalidateQueries({ queryKey: getBankListByCompanyQueryKey() });
          navigate('/bank-accounts');
        },
        onError: () => {
          enqueueSnackbar(t('bankAccounts.messages.updateFailed'), { variant: 'error' });
        },
      },
    );
  };

  return (
    <PageLayout className="space-y-4">
      <PageHeader
        title={t('bankAccounts.edit.title')}
        description={t('bankAccounts.edit.description')}
        backButton
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : !account ? (
        <p className="text-sm text-muted-foreground">{t('bankAccounts.edit.notFound')}</p>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormCard title={t('bankAccounts.edit.title')} titleClassName="text-center">
              <div className="mx-auto max-w-3xl space-y-4">
                <BankAccountFormFields control={form.control} getValues={form.getValues} />
              </div>
            </FormCard>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate('/bank-accounts')}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('bankAccounts.actions.save')}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </PageLayout>
  );
};

export default UpdateBankAccount;
