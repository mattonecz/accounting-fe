import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pencil, Plus } from 'lucide-react';
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
import { CompanyResponseDto, CreateCompanyDto, UpdateCompanyDto } from '@/api/model';
import {
  useCompanyCreate,
  useCompanyListByUser,
  useCompanyUpdate,
} from '@/api/companies/companies';
import { InputController } from '@/components/InputController';
import { Autocomplete } from '@/components/ui/autocomplete';

const formatAddress = (company: Pick<CompanyResponseDto, 'street' | 'city' | 'psc' | 'country'>) => {
  return [company.street, company.psc, company.city, company.country]
    .filter(Boolean)
    .join(', ');
};

export default function Contacts() {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<CompanyResponseDto | null>(null);
  const [editingContact, setEditingContact] = useState<CompanyResponseDto | null>(null);
  const { enqueueSnackbar } = useSnackbar();
  const { mutate: createCompany } = useCompanyCreate();
  const { mutate: updateCompany } = useCompanyUpdate();
  const { data: companies, refetch: refetchCompanies } = useCompanyListByUser();

  const createForm = useForm<CreateCompanyDto>();
  const editForm = useForm<UpdateCompanyDto>();

  const onSubmit = (data: CreateCompanyDto) => {
    createCompany(
      { data },
      {
        onSuccess: () => {
          enqueueSnackbar('Company created successfully', {
            variant: 'success',
          });
          createForm.reset();
          setCreateOpen(false);
          refetchCompanies();
        },
        onError: () => {
          enqueueSnackbar('Failed to create company', { variant: 'error' });
        },
      },
    );
  };

  const onEditSubmit = (data: UpdateCompanyDto) => {
    if (!editingContact) {
      return;
    }

    updateCompany(
      {
        data: {
          ...data,
          id: editingContact.id,
        },
      },
      {
        onSuccess: () => {
          enqueueSnackbar('Company updated successfully', {
            variant: 'success',
          });
          setEditingContact(null);
          editForm.reset();
          refetchCompanies();
        },
        onError: () => {
          enqueueSnackbar('Failed to update company', { variant: 'error' });
        },
      },
    );
  };

  const openEditDialog = (contact: CompanyResponseDto) => {
    setEditingContact(contact);
    editForm.reset({
      id: contact.id,
      name: contact.name,
      ico: contact.ico,
      dic: contact.dic,
      country: contact.country,
      city: contact.city,
      street: contact.street,
      psc: contact.psc,
      email: contact.email,
      description: contact.description,
    });
  };

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Contacts
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage your clients and vendors
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[640px]">
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form
                onSubmit={createForm.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <Autocomplete
                  onChange={(data) => {
                    createForm.reset(data);
                  }}
                />
                <InputController
                  control={createForm.control}
                  name="name"
                  label="Name"
                  type="text"
                  rules={{ required: 'Name is required' }}
                  placeholder="Company name"
                />
                <InputController
                  control={createForm.control}
                  name="ico"
                  label="ICO"
                  type="number"
                  placeholder="1234567890"
                />
                <InputController
                  control={createForm.control}
                  name="dic"
                  label="DIC"
                  type="text"
                  placeholder="CZ1234567890"
                />
                <InputController
                  control={createForm.control}
                  name="country"
                  label="Country"
                  type="text"
                  placeholder="Czech Republic"
                />
                <InputController
                  control={createForm.control}
                  name="city"
                  label="City"
                  type="text"
                  placeholder="Prague"
                />
                <InputController
                  control={createForm.control}
                  name="street"
                  label="Street"
                  type="text"
                  placeholder="123 Main St"
                />
                <InputController
                  control={createForm.control}
                  name="psc"
                  label="PSC"
                  type="number"
                  placeholder="12345"
                />
                <InputController
                  control={createForm.control}
                  name="email"
                  label="Email"
                  type="email"
                  placeholder="contact@company.com"
                />
                <InputController
                  control={createForm.control}
                  name="description"
                  label="Description"
                  type="text"
                  placeholder="Short company note"
                />
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Add Contact</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>ICO</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies?.data.map((contact) => (
                <TableRow
                  key={contact.id}
                  className="cursor-pointer hover:bg-secondary/50"
                  onClick={() => setSelectedContact(contact)}
                >
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.ico}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatAddress(contact) || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      onClick={(event) => {
                        event.stopPropagation();
                        openEditDialog(contact);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={selectedContact !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedContact(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{selectedContact?.name}</DialogTitle>
            <DialogDescription>
              Contact details and registered company information.
            </DialogDescription>
          </DialogHeader>
          {selectedContact && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">ICO</p>
                <p className="font-medium">{selectedContact.ico || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">DIC</p>
                <p className="font-medium">{selectedContact.dic || '-'}</p>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{formatAddress(selectedContact) || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">City</p>
                <p className="font-medium">{selectedContact.city || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Country</p>
                <p className="font-medium">{selectedContact.country || '-'}</p>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{selectedContact.email || '-'}</p>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="font-medium">{selectedContact.description || '-'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={editingContact !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingContact(null);
            editForm.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>
              Update company data for the selected contact.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <InputController
                control={editForm.control}
                name="name"
                label="Name"
                type="text"
                rules={{ required: 'Name is required' }}
                placeholder="Company name"
              />
              <InputController
                control={editForm.control}
                name="ico"
                label="ICO"
                type="number"
                placeholder="1234567890"
              />
              <InputController
                control={editForm.control}
                name="dic"
                label="DIC"
                type="text"
                placeholder="CZ1234567890"
              />
              <InputController
                control={editForm.control}
                name="country"
                label="Country"
                type="text"
                placeholder="Czech Republic"
              />
              <InputController
                control={editForm.control}
                name="city"
                label="City"
                type="text"
                placeholder="Prague"
              />
              <InputController
                control={editForm.control}
                name="street"
                label="Street"
                type="text"
                placeholder="123 Main St"
              />
              <InputController
                control={editForm.control}
                name="psc"
                label="PSC"
                type="number"
                placeholder="12345"
              />
              <InputController
                control={editForm.control}
                name="email"
                label="Email"
                type="email"
                placeholder="contact@company.com"
              />
              <InputController
                control={editForm.control}
                name="description"
                label="Description"
                type="text"
                placeholder="Short company note"
              />
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingContact(null);
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
