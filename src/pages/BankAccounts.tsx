import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Building2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useBankListByUser } from '@/api/bank/bank';
import { CreateBankDto } from '@/api/model';
import { InputController } from '@/components/InputController';
import { useBankCreate } from '@/api/bank/bank';

export default function BankAccounts() {
  const [open, setOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const { data: bankAccounts, refetch: refetchBankAccounts } =
    useBankListByUser();
  const { mutate: createBank } = useBankCreate();

  const form = useForm<CreateBankDto>();

  const onSubmit = (data: CreateBankDto) => {
    createBank(
      { data },
      {
        onSuccess: () => {
          enqueueSnackbar(`${data.name} has been added successfully.`, {
            variant: 'success',
          });
          form.reset();
          setOpen(false);
          refetchBankAccounts();
        },
        onError: () => {
          enqueueSnackbar(`Failed to add bank account`, { variant: 'error' });
        },
      },
    );
  };

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Bank Accounts
          </h1>
          <p className="mt-2 text-muted-foreground">
            Track your business accounts
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
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
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
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
                      if (!value && !iban) {
                        return 'Buď číslo účtu nebo IBAN musí být vyplněno';
                      }
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
                      if (!value && !number) {
                        return 'Buď číslo účtu nebo IBAN musí být vyplněno';
                      }
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
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Add Account</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {bankAccounts?.data.map((account) => (
          <Card key={account.id} className="transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{account.name}</CardTitle>
                <Building2 className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {account.name}
                  </p>
                  <p className="text-sm font-mono text-muted-foreground">
                    {account.number}
                  </p>
                </div>
                <div className="border-t pt-3">
                  <p className="text-sm text-muted-foreground">Balance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
