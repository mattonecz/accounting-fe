import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetContact, useGetContactStats } from '@/api/contacts/contacts';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { ContactInfoCard } from './ContactInfoCard';
import { ContactStatsCards } from './ContactStatsCards';
import { ContactInvoicesCard } from './ContactInvoicesCard';

export default function ContactDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetContact(id || '');
  const statsQuery = useGetContactStats(id || '');

  const contact = data?.data;

  const renderContent = () => {
    if (!id) {
      return <p className="text-muted-foreground">{t('contacts.detail.invalidId')}</p>;
    }
    if (isLoading) {
      return <p className="text-muted-foreground">{t('contacts.detail.loading')}</p>;
    }
    if (isError || !contact) {
      return <p className="text-destructive">{t('contacts.detail.error')}</p>;
    }

    return (
      <>
        <PageHeader
        backButton
          title={contact.name}
          description={t('contacts.detail.description')}
          actions={
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate(`/contacts/${id}/edit`)}
            >
              <Pencil className="h-4 w-4" />
              {t('common.edit')}
            </Button>
          }
        />

        <ContactInfoCard contact={contact} />

        <ContactStatsCards
          stats={statsQuery.data?.data}
          isLoading={statsQuery.isLoading}
          isError={statsQuery.isError}
        />

        <ContactInvoicesCard contactId={id} />
      </>
    );
  };

  return <PageLayout>{renderContent()}</PageLayout>;
}
