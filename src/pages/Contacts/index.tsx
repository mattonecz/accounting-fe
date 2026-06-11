import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Pencil, Plus } from 'lucide-react';
import type { ContactResponseDto } from '@/api/model';
import { useListContacts } from '@/api/contacts/contacts';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { DataTableCard } from '@/components/DataTableCard';

const formatAddress = (contact: Pick<ContactResponseDto, 'street' | 'city' | 'psc' | 'country'>) =>
  [contact.street, contact.psc, contact.city, contact.country].filter(Boolean).join(', ');

export default function Contacts() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: contactsResponse } = useListContacts();

  const columns = [
    { header: t('contacts.columns.name'), cell: (c: ContactResponseDto) => <span className="font-medium">{c.name}</span> },
    { header: t('contacts.columns.ico'), cell: (c: ContactResponseDto) => c.ico },
    {
      header: t('contacts.columns.address'),
      cell: (c: ContactResponseDto) => (
        <span className="text-muted-foreground">{formatAddress(c) || '-'}</span>
      ),
    },
    {
      header: t('contacts.columns.actions'),
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      cell: (c: ContactResponseDto) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/contacts/${c.id}/edit`);
          }}
        >
          <Pencil className="h-4 w-4" />
          {t('common.edit')}
        </Button>
      ),
    },
  ];

  return (
    <PageLayout>
      <PageHeader
        title={t('contacts.title')}
        description={t('contacts.description')}
        actions={
          <Button asChild className="gap-2">
            <Link to="/contacts/create">
              <Plus className="h-4 w-4" />
              {t('contacts.actions.add')}
            </Link>
          </Button>
        }
      />

      <DataTableCard
        title={t('contacts.allContacts')}
        columns={columns}
        data={contactsResponse?.data}
        onRowClick={(contact) => navigate(`/contacts/${contact.id}`)}
      />
    </PageLayout>
  );
}
