import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import type { CreateContactDto } from '@/api/model';
import { useCreateContact } from '@/api/contacts/contacts';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { InputController } from '@/components/InputController';
import { Autocomplete } from '@/components/ui/autocomplete';
import { Plus } from 'lucide-react';

interface CreateContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateContactDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: CreateContactDialogProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const { mutate: createContact } = useCreateContact();
  const form = useForm<CreateContactDto>({ defaultValues: { name: '', country: '' } });

  const onSubmit = (data: CreateContactDto) => {
    createContact(
      { data },
      {
        onSuccess: () => {
          enqueueSnackbar('Contact created successfully', { variant: 'success' });
          form.reset();
          onOpenChange(false);
          onSuccess();
        },
        onError: () => {
          enqueueSnackbar('Failed to create contact', { variant: 'error' });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Autocomplete onChange={(data) => form.reset({ ...data, description: undefined })} />
            <InputController control={form.control} name="name" label="Name" type="text" rules={{ required: 'Name is required' }} placeholder="Company name" />
            <InputController control={form.control} name="ico" label="ICO" type="text" placeholder="1234567890" />
            <InputController control={form.control} name="dic" label="DIC" type="text" placeholder="CZ1234567890" />
            <InputController control={form.control} name="country" label="Country" type="text" placeholder="Czech Republic" rules={{ required: 'Country is required' }} />
            <InputController control={form.control} name="city" label="City" type="text" placeholder="Prague" />
            <InputController control={form.control} name="street" label="Street" type="text" placeholder="123 Main St" />
            <InputController control={form.control} name="psc" label="PSC" type="text" placeholder="12345" />
            <InputController control={form.control} name="email" label="Email" type="email" placeholder="contact@company.com" />
            <InputController control={form.control} name="description" label="Description" type="text" placeholder="Short company note" />
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Contact</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
