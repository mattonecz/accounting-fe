import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import type { CompanyResponseDto, UpdateCompanyDto } from '@/api/model';
import { useCompanyUpdate } from '@/api/companies/companies';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { InputController } from '@/components/InputController';

interface EditContactDialogProps {
  contact: CompanyResponseDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditContactDialog = ({ contact, onClose, onSuccess }: EditContactDialogProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const { mutate: updateCompany } = useCompanyUpdate();
  const form = useForm<UpdateCompanyDto>();

  if (contact) {
    const currentId = form.getValues('id');
    if (currentId !== contact.id) {
      form.reset({
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
    }
  }

  const onSubmit = (data: UpdateCompanyDto) => {
    if (!contact) return;
    updateCompany(
      { data: { ...data, id: contact.id } },
      {
        onSuccess: () => {
          enqueueSnackbar('Company updated successfully', { variant: 'success' });
          onClose();
          form.reset();
          onSuccess();
        },
        onError: () => {
          enqueueSnackbar('Failed to update company', { variant: 'error' });
        },
      },
    );
  };

  return (
    <Dialog
      open={contact !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          form.reset();
        }
      }}
    >
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
          <DialogDescription>Update company data for the selected contact.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <InputController control={form.control} name="name" label="Name" type="text" rules={{ required: 'Name is required' }} placeholder="Company name" />
            <InputController control={form.control} name="ico" label="ICO" type="number" placeholder="1234567890" />
            <InputController control={form.control} name="dic" label="DIC" type="text" placeholder="CZ1234567890" />
            <InputController control={form.control} name="country" label="Country" type="text" placeholder="Czech Republic" />
            <InputController control={form.control} name="city" label="City" type="text" placeholder="Prague" />
            <InputController control={form.control} name="street" label="Street" type="text" placeholder="123 Main St" />
            <InputController control={form.control} name="psc" label="PSC" type="number" placeholder="12345" />
            <InputController control={form.control} name="email" label="Email" type="email" placeholder="contact@company.com" />
            <InputController control={form.control} name="description" label="Description" type="text" placeholder="Short company note" />
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => { onClose(); form.reset(); }}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
