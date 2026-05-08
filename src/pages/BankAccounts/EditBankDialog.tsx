import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import type { BankResponseDto, UpdateBankDto } from '@/api/model';
import { useBankUpdate } from '@/api/bank/bank';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { InputController } from '@/components/InputController';

interface EditBankDialogProps {
  account: BankResponseDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditBankDialog = ({ account, onClose, onSuccess }: EditBankDialogProps) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const { mutate: updateBank } = useBankUpdate();
  const form = useForm<UpdateBankDto>();

  const open = (nextAccount: BankResponseDto) => {
    form.reset({
      id: nextAccount.id,
      name: nextAccount.name,
      number: nextAccount.number,
      iban: nextAccount.iban,
      swift: nextAccount.swift,
      currency: nextAccount.currency,
      default: nextAccount.default,
    });
  };

  // Reset form when account changes
  if (account) {
    const currentId = form.getValues('id');
    if (currentId !== account.id) open(account);
  }

  const onSubmit = (data: UpdateBankDto) => {
    if (!account) return;
    updateBank(
      { data: { ...data, id: account.id } },
      {
        onSuccess: () => {
          enqueueSnackbar(t('bankAccounts.messages.updated', { name: data.name }), { variant: 'success' });
          form.reset();
          onClose();
          onSuccess();
        },
        onError: () => {
          enqueueSnackbar(t('bankAccounts.messages.updateFailed'), { variant: 'error' });
        },
      },
    );
  };

  return (
    <Dialog
      open={account !== null}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
          form.reset();
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('bankAccounts.edit.title')}</DialogTitle>
          <DialogDescription>{t('bankAccounts.edit.description')}</DialogDescription>
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
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onClose();
                  form.reset();
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit">{t('bankAccounts.actions.save')}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
