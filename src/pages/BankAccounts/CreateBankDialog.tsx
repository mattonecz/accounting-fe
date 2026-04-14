import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
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
  const { enqueueSnackbar } = useSnackbar();
  const { mutate: createBank } = useBankCreate();
  const form = useForm<CreateBankDto>();

  const onSubmit = (data: CreateBankDto) => {
    createBank(
      { data },
      {
        onSuccess: () => {
          enqueueSnackbar(`${data.name} has been added successfully.`, { variant: 'success' });
          form.reset();
          onOpenChange(false);
          onSuccess();
        },
        onError: () => {
          enqueueSnackbar('Failed to add bank account', { variant: 'error' });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Bank Account</DialogTitle>
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
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Account</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
