import { Link, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { useBankListByCompany, useBankSetDefault } from '@/api/bank/bank';
import type { BankResponseDto } from '@/api/model';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { BankAccountCard } from './BankAccountCard';

export default function BankAccounts() {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
          <Button asChild className="gap-2">
            <Link to="/bank-accounts/create">
              <Plus className="h-4 w-4" />
              {t('bankAccounts.create.trigger')}
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedBankAccounts.map((account) => (
          <BankAccountCard
            key={account.id}
            account={account}
            onEdit={(a) => navigate(`/bank-accounts/${a.id}/edit`)}
            onSetDefault={handleSetDefault}
          />
        ))}
      </div>
    </PageLayout>
  );
}
