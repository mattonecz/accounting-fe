import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import type { ContactResponseDto } from '@/api/model';
import { useListContacts } from '@/api/contacts/contacts';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { DataTableCard } from '@/components/DataTableCard';
import { CreateContactDialog } from './CreateContactDialog';
import { EditContactDialog } from './EditContactDialog';
import { ContactDetailDialog } from './ContactDetailDialog';

const formatAddress = (contact: Pick<ContactResponseDto, 'street' | 'city' | 'psc' | 'country'>) =>
  [contact.street, contact.psc, contact.city, contact.country].filter(Boolean).join(', ');

export default function Contacts() {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactResponseDto | null>(null);
  const [editingContact, setEditingContact] = useState<ContactResponseDto | null>(null);
  const { data: contactsResponse, refetch: refetchContacts } = useListContacts();

  const columns = [
    { header: 'Name', cell: (c: ContactResponseDto) => <span className="font-medium">{c.name}</span> },
    { header: 'ICO', cell: (c: ContactResponseDto) => c.ico },
    {
      header: 'Address',
      cell: (c: ContactResponseDto) => (
        <span className="text-muted-foreground">{formatAddress(c) || '-'}</span>
      ),
    },
    {
      header: 'Actions',
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
            setEditingContact(c);
          }}
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      ),
    },
  ];

  return (
    <PageLayout>
      <PageHeader
        title="Contacts"
        description="Manage your clients and vendors"
        actions={
          <CreateContactDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            onSuccess={() => refetchContacts()}
          />
        }
      />

      <DataTableCard
        title="All Contacts"
        columns={columns}
        data={contactsResponse?.data}
        onRowClick={setSelectedContact}
      />

      <ContactDetailDialog
        contact={selectedContact}
        onClose={() => setSelectedContact(null)}
      />

      <EditContactDialog
        contact={editingContact}
        onClose={() => setEditingContact(null)}
        onSuccess={() => refetchContacts()}
      />
    </PageLayout>
  );
}
