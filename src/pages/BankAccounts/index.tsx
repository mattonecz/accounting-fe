import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useBankListByUser, useBankSetDefault } from '@/api/bank/bank';
import type { BankResponseDto } from '@/api/model';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { CreateBankDialog } from './CreateBankDialog';
import { EditBankDialog } from './EditBankDialog';
import { BankAccountCard } from './BankAccountCard';

export default function BankAccounts() {
  const [open, setOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankResponseDto | null>(null);
  const { enqueueSnackbar } = useSnackbar();
  const { data: bankAccounts, refetch: refetchBankAccounts } = useBankListByUser();
  const { mutate: setDefaultBank } = useBankSetDefault();

  const handleSetDefault = (account: BankResponseDto) => {
    if (account.default) return;
    setDefaultBank(
      { data: { bankId: account.id } },
      {
        onSuccess: () => {
          enqueueSnackbar(`${account.name} is now the default account.`, { variant: 'success' });
          refetchBankAccounts();
        },
        onError: () => {
          enqueueSnackbar('Failed to set default account', { variant: 'error' });
        },
      },
    );
  };

  const sortedBankAccounts = [...(bankAccounts?.data ?? [])].sort((a, b) => {
    if (a.default !== b.default) return a.default ? -1 : 1;
    return (a.name ?? '').localeCompare(b.name ?? '', 'cs', { sensitivity: 'base' });
  });

  return (
    <PageLayout>
      <PageHeader
        title="Bank Accounts"
        description="Track your business accounts"
        actions={
          <CreateBankDialog
            open={open}
            onOpenChange={setOpen}
            onSuccess={() => refetchBankAccounts()}
          />
        }
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedBankAccounts.map((account) => (
          <BankAccountCard
            key={account.id}
            account={account}
            onEdit={setEditingAccount}
            onSetDefault={handleSetDefault}
          />
        ))}
      </div>

      <EditBankDialog
        account={editingAccount}
        onClose={() => setEditingAccount(null)}
        onSuccess={() => refetchBankAccounts()}
      />
    </PageLayout>
  );
}
