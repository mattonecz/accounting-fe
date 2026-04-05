import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Plus, Building2, Pencil, Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useSnackbar } from 'notistack';
import {
  useBankListByUser,
  useBankSetDefault,
  useBankUpdate,
} from '@/api/bank/bank';
import { BankResponseDto, CreateBankDto, UpdateBankDto } from '@/api/model';
import { InputController } from '@/components/InputController';
import { useBankCreate } from '@/api/bank/bank';
import { cn } from '@/lib/utils';

const getAccountIdentifier = (account: Pick<BankResponseDto, 'number' | 'iban'>) => {
  return account.number || account.iban || '-';
};

export default function BankAccounts() {
  const [open, setOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankResponseDto | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const { data: bankAccounts, refetch: refetchBankAccounts } =
    useBankListByUser();
  const { mutate: createBank } = useBankCreate();
  const { mutate: updateBank } = useBankUpdate();
  const { mutate: setDefaultBank } = useBankSetDefault();

  const form = useForm<CreateBankDto>();
  const editForm = useForm<UpdateBankDto>();

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

  const onEditSubmit = (data: UpdateBankDto) => {
    if (!editingAccount) {
      return;
    }

    updateBank(
      {
        data: {
          ...data,
          id: editingAccount.id,
        },
      },
      {
        onSuccess: () => {
          enqueueSnackbar(`${data.name} has been updated successfully.`, {
            variant: 'success',
          });
          editForm.reset();
          setEditingAccount(null);
          refetchBankAccounts();
        },
        onError: () => {
          enqueueSnackbar('Failed to update bank account', {
            variant: 'error',
          });
        },
      },
    );
  };

  const openEditDialog = (account: BankResponseDto) => {
    setEditingAccount(account);
    editForm.reset({
      id: account.id,
      name: account.name,
      number: account.number,
      iban: account.iban,
      swift: account.swift,
      currency: account.currency,
      default: account.default,
    });
  };

  const handleSetDefault = (account: BankResponseDto) => {
    if (account.default) {
      return;
    }

    setDefaultBank(
      { data: { bankId: account.id } },
      {
        onSuccess: () => {
          enqueueSnackbar(`${account.name} is now the default account.`, {
            variant: 'success',
          });
          refetchBankAccounts();
        },
        onError: () => {
          enqueueSnackbar('Failed to set default account', {
            variant: 'error',
          });
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
          <Card
            key={account.id}
            className={cn(
              'transition-shadow hover:shadow-md',
              account.default && 'border-primary/40 shadow-sm ring-1 ring-primary/20',
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{account.name}</CardTitle>
                  {account.default && (
                    <p className="text-xs font-medium uppercase tracking-wide text-primary">
                      Default account
                    </p>
                  )}
                </div>
                <Building2 className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Číslo účtu</p>
                  <p className="text-base font-medium text-foreground">
                    {getAccountIdentifier(account)}
                  </p>
                </div>
                <div className="space-y-2 border-t pt-4">
                  {account.iban && account.number !== account.iban && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        IBAN
                      </p>
                      <p className="text-sm font-mono text-muted-foreground">
                        {account.iban}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Měna
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {account.currency}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  'h-9 w-9 rounded-full',
                  account.default
                    ? 'text-warning hover:text-warning'
                    : 'text-muted-foreground hover:text-warning',
                )}
                onClick={() => handleSetDefault(account)}
                aria-label={
                  account.default
                    ? 'Default account'
                    : `Set ${account.name} as default account`
                }
                title={
                  account.default ? 'Default account' : 'Set as default account'
                }
              >
                <Star
                  className={cn('h-4 w-4', account.default && 'fill-current')}
                />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => openEditDialog(account)}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog
        open={editingAccount !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditingAccount(null);
            editForm.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Bank Account</DialogTitle>
            <DialogDescription>
              Update account name, identifier and currency.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onEditSubmit)}
              className="space-y-4"
            >
              <InputController
                control={editForm.control}
                name="name"
                label="Název účtu"
                type="text"
                rules={{ required: 'Název účtu je povinný' }}
                placeholder="ČSOB CZK"
              />
              <InputController
                control={editForm.control}
                name="number"
                label="Číslo účtu"
                type="text"
                placeholder="1234567890"
                rules={{
                  validate: (value) => {
                    const iban = editForm.getValues('iban');
                    if (!value && !iban) {
                      return 'Buď číslo účtu nebo IBAN musí být vyplněno';
                    }
                    return true;
                  },
                }}
              />
              <InputController
                control={editForm.control}
                name="iban"
                label="IBAN"
                type="text"
                placeholder="CZ65 0800 0000 1234 5678 9012"
                rules={{
                  validate: (value) => {
                    const number = editForm.getValues('number');
                    if (!value && !number) {
                      return 'Buď číslo účtu nebo IBAN musí být vyplněno';
                    }
                    return true;
                  },
                }}
              />
              <InputController
                control={editForm.control}
                name="swift"
                label="SWIFT/BIC"
                type="text"
                placeholder="08000000123456789012"
              />
              <InputController
                control={editForm.control}
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
                    setEditingAccount(null);
                    editForm.reset();
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
    </div>
  );
}
