import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
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
          enqueueSnackbar(`${data.name} has been updated successfully.`, { variant: 'success' });
          form.reset();
          onClose();
          onSuccess();
        },
        onError: () => {
          enqueueSnackbar('Failed to update bank account', { variant: 'error' });
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
          <DialogTitle>Edit Bank Account</DialogTitle>
          <DialogDescription>Update account name, identifier and currency.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <InputController
              control={form.control}
              name="name"
              label="Název účtu"
              type="text"
              rules={{ required: 'Název účtu je povinný' }}
              placeholder="ČSOB CZK"
            />
            <InputController
              control={form.control}
              name="number"
              label="Číslo účtu"
              type="text"
              placeholder="1234567890"
              rules={{
                validate: (value) => {
                  const iban = form.getValues('iban');
                  if (!value && !iban) return 'Buď číslo účtu nebo IBAN musí být vyplněno';
                  return true;
                },
              }}
            />
            <InputController
              control={form.control}
              name="iban"
              label="IBAN"
              type="text"
              placeholder="CZ65 0800 0000 1234 5678 9012"
              rules={{
                validate: (value) => {
                  const number = form.getValues('number');
                  if (!value && !number) return 'Buď číslo účtu nebo IBAN musí být vyplněno';
                  return true;
                },
              }}
            />
            <InputController
              control={form.control}
              name="swift"
              label="SWIFT/BIC"
              type="text"
              placeholder="08000000123456789012"
            />
            <InputController
              control={form.control}
              name="currency"
              label="Měna"
              placeholder="CZK"
              rules={{ required: 'Měna je povinná' }}
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
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
