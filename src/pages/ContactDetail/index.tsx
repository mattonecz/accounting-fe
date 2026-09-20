import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetContact, useGetContactStats } from '@/api/contacts/contacts';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { DeleteContactDialog } from '@/components/contacts/DeleteContactDialog';
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
  const [deleteOpen, setDeleteOpen] = useState(false);

  const renderContent = () => {
    if (!id) {
      return (
        <p className="text-muted-foreground">
          {t('contacts.detail.invalidId')}
        </p>
      );
    }
    if (isLoading) {
      return (
        <p className="text-muted-foreground">{t('contacts.detail.loading')}</p>
      );
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
            <>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => navigate(`/contacts/${id}/edit`)}
              >
                <Pencil className="h-4 w-4" />
                {t('common.edit')}
              </Button>
              <Button
                variant="outline"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                {t('common.delete')}
              </Button>
            </>
          }
        />

        <ContactInfoCard contact={contact} />

        <ContactStatsCards
          stats={statsQuery.data?.data}
          isLoading={statsQuery.isLoading}
          isError={statsQuery.isError}
        />

        <ContactInvoicesCard contactId={id} />

        <DeleteContactDialog
          contact={deleteOpen ? contact : null}
          onClose={() => setDeleteOpen(false)}
          onDeleted={() => navigate('/contacts')}
        />
      </>
    );
  };

  return <PageLayout>{renderContent()}</PageLayout>;
}
