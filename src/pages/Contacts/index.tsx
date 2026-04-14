import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import type { CompanyResponseDto } from '@/api/model';
import { useCompanyListByUser } from '@/api/companies/companies';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { DataTableCard } from '@/components/DataTableCard';
import { CreateContactDialog } from './CreateContactDialog';
import { EditContactDialog } from './EditContactDialog';
import { ContactDetailDialog } from './ContactDetailDialog';

const formatAddress = (company: Pick<CompanyResponseDto, 'street' | 'city' | 'psc' | 'country'>) =>
  [company.street, company.psc, company.city, company.country].filter(Boolean).join(', ');

export default function Contacts() {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<CompanyResponseDto | null>(null);
  const [editingContact, setEditingContact] = useState<CompanyResponseDto | null>(null);
  const { data: companies, refetch: refetchCompanies } = useCompanyListByUser();

  const columns = [
    { header: 'Name', cell: (c: CompanyResponseDto) => <span className="font-medium">{c.name}</span> },
    { header: 'ICO', cell: (c: CompanyResponseDto) => c.ico },
    {
      header: 'Address',
      cell: (c: CompanyResponseDto) => (
        <span className="text-muted-foreground">{formatAddress(c) || '-'}</span>
      ),
    },
    {
      header: 'Actions',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      cell: (c: CompanyResponseDto) => (
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
            onSuccess={() => refetchCompanies()}
          />
        }
      />

      <DataTableCard
        title="All Contacts"
        columns={columns}
        data={companies?.data}
        onRowClick={setSelectedContact}
      />

      <ContactDetailDialog
        contact={selectedContact}
        onClose={() => setSelectedContact(null)}
      />

      <EditContactDialog
        contact={editingContact}
        onClose={() => setEditingContact(null)}
        onSuccess={() => refetchCompanies()}
      />
    </PageLayout>
  );
}
