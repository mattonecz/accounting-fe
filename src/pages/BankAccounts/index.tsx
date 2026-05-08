import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { useBankListByCompany, useBankSetDefault } from '@/api/bank/bank';
import type { BankResponseDto } from '@/api/model';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { CreateBankDialog } from './CreateBankDialog';
import { EditBankDialog } from './EditBankDialog';
import { BankAccountCard } from './BankAccountCard';

export default function BankAccounts() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankResponseDto | null>(null);
  const { enqueueSnackbar } = useSnackbar();
  const { data: bankAccounts, refetch: refetchBankAccounts } = useBankListByCompany();
  const { mutate: setDefaultBank } = useBankSetDefault();

  const handleSetDefault = (account: BankResponseDto) => {
    if (account.default) return;
    setDefaultBank(
      { data: { bankId: account.id } },
      {
        onSuccess: () => {
          enqueueSnackbar(t('bankAccounts.messages.setDefault', { name: account.name }), { variant: 'success' });
          refetchBankAccounts();
        },
        onError: () => {
          enqueueSnackbar(t('bankAccounts.messages.setDefaultFailed'), { variant: 'error' });
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
        title={t('bankAccounts.title')}
        description={t('bankAccounts.description')}
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
