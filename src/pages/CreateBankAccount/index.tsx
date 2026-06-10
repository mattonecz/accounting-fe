import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import type { CreateBankDto } from '@/api/model';
import { getBankListByCompanyQueryKey, useBankCreate } from '@/api/bank/bank';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { FormCard } from '@/components/FormCard';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import {
  BankAccountFormFields,
  type BankAccountFormValues,
} from '@/components/bank/BankAccountFormFields';

const CreateBankAccount = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { mutate: createBank, isPending } = useBankCreate();
  const form = useForm<BankAccountFormValues>({ defaultValues: { name: '', currency: '' } });

  const onSubmit = (data: BankAccountFormValues) => {
    createBank(
      { data: data satisfies CreateBankDto },
      {
        onSuccess: async () => {
          enqueueSnackbar(t('bankAccounts.messages.created', { name: data.name }), {
            variant: 'success',
          });
          await queryClient.invalidateQueries({ queryKey: getBankListByCompanyQueryKey() });
          navigate('/bank-accounts');
        },
        onError: () => {
          enqueueSnackbar(t('bankAccounts.messages.createFailed'), { variant: 'error' });
        },
      },
    );
  };

  return (
    <PageLayout className="space-y-4">
      <PageHeader
        title={t('bankAccounts.create.title')}
        description={t('bankAccounts.create.description')}
        backButton
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormCard title={t('bankAccounts.create.title')} titleClassName="text-center">
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
              {t('bankAccounts.actions.create')}
            </Button>
          </div>
        </form>
      </Form>
    </PageLayout>
  );
};

export default CreateBankAccount;
