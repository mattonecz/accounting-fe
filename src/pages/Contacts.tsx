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
import { Plus, Mail, Phone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { CreateCompanyDto } from '@/api/model';
import {
  useCompanyCreate,
  useCompanyListByUser,
} from '@/api/companies/companies';
import { InputController } from '@/components/InputController';
import { Autocomplete } from '@/components/ui/autocomplete';

export default function Contacts() {
  const [open, setOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { mutate: createCompany } = useCompanyCreate();
  const { data: companies, refetch: refetchCompanies } = useCompanyListByUser();

  const form = useForm<CreateCompanyDto>();

  const onSubmit = (data: CreateCompanyDto) => {
    createCompany(
      { data },
      {
        onSuccess: () => {
          enqueueSnackbar('Company created successfully', {
            variant: 'success',
          });
          form.reset();
          setOpen(false);
          refetchCompanies();
        },
        onError: () => {
          enqueueSnackbar('Failed to create company', { variant: 'error' });
        },
      },
    );
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <Autocomplete
                  onChange={(data) => {
                    form.reset(data);
                  }}
                  placeholder="Company name"
                />
                <InputController
                  control={form.control}
                  name="name"
                  label="Name"
                  type="text"
                  rules={{ required: 'Name is required' }}
                  placeholder="Company name"
                />
                <InputController
                  control={form.control}
                  name="ico"
                  label="ICO"
                  type="number"
                  placeholder="1234567890"
                />
                <InputController
                  control={form.control}
                  name="dic"
                  label="DIC"
                  type="text"
                  placeholder="CZ1234567890"
                />
                <InputController
                  control={form.control}
                  name="country"
                  label="Country"
                  type="text"
                  placeholder="Czech Republic"
                />
                <InputController
                  control={form.control}
                  name="city"
                  label="City"
                  type="text"
                  placeholder="Prague"
                />
                <InputController
                  control={form.control}
                  name="street"
                  label="Street"
                  type="text"
                  placeholder="123 Main St"
                />
                <InputController
                  control={form.control}
                  name="psc"
                  label="PSC"
                  type="number"
                  placeholder="12345"
                />
                <InputController
                  control={form.control}
                  name="email"
                  label="Email"
                  type="email"
                  placeholder="contact@company.com"
                />
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
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
                <TableHead>ICO/DIC</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies?.data.map((contact) => (
                <TableRow
                  key={contact.id}
                  className="cursor-pointer hover:bg-secondary/50"
                >
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>
                    {contact.ico} / {contact.dic}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {contact.email}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {contact.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold"></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
