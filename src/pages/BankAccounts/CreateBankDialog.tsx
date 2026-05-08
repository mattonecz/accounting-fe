import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import type { CreateBankDto } from '@/api/model';
import { useBankCreate } from '@/api/bank/bank';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { InputController } from '@/components/InputController';
import { Plus } from 'lucide-react';

interface CreateBankDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateBankDialog = ({ open, onOpenChange, onSuccess }: CreateBankDialogProps) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const { mutate: createBank } = useBankCreate();
  const form = useForm<CreateBankDto>();

  const onSubmit = (data: CreateBankDto) => {
    createBank(
      { data },
      {
        onSuccess: () => {
          enqueueSnackbar(t('bankAccounts.messages.created', { name: data.name }), { variant: 'success' });
          form.reset();
          onOpenChange(false);
          onSuccess();
        },
        onError: () => {
          enqueueSnackbar(t('bankAccounts.messages.createFailed'), { variant: 'error' });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          {t('bankAccounts.create.trigger')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('bankAccounts.create.title')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <InputController
              control={form.control}
              name="name"
              label={t('bankAccounts.fields.name')}
              type="text"
              rules={{ required: t('validation.required', { field: t('bankAccounts.fields.name') }) }}
              placeholder="ČSOB CZK"
            />
            <InputController
              control={form.control}
              name="number"
              label={t('bankAccounts.fields.number')}
              type="text"
              placeholder="1234567890"
              rules={{
                validate: (value) => {
                  const iban = form.getValues('iban');
                  if (!value && !iban) return t('bankAccounts.validation.numberOrIbanRequired');
                  return true;
                },
              }}
            />
            <InputController
              control={form.control}
              name="iban"
              label={t('bankAccounts.fields.iban')}
              type="text"
              placeholder="CZ65 0800 0000 1234 5678 9012"
              rules={{
                validate: (value) => {
                  const number = form.getValues('number');
                  if (!value && !number) return t('bankAccounts.validation.numberOrIbanRequired');
                  return true;
                },
              }}
            />
            <InputController
              control={form.control}
              name="swift"
              label={t('bankAccounts.fields.swift')}
              type="text"
              placeholder="08000000123456789012"
            />
            <InputController
              control={form.control}
              name="currency"
              label={t('bankAccounts.fields.currency')}
              placeholder="CZK"
              rules={{ required: t('validation.required', { field: t('bankAccounts.fields.currency') }) }}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit">{t('bankAccounts.actions.create')}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
