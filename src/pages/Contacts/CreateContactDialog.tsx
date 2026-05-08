import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const { mutate: createContact } = useCreateContact();
  const form = useForm<CreateContactDto>({ defaultValues: { name: '', country: '' } });

  const onSubmit = (data: CreateContactDto) => {
    createContact(
      { data },
      {
        onSuccess: () => {
          enqueueSnackbar(t('contacts.messages.created'), { variant: 'success' });
          form.reset();
          onOpenChange(false);
          onSuccess();
        },
        onError: () => {
          enqueueSnackbar(t('contacts.messages.createFailed'), { variant: 'error' });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          {t('contacts.actions.add')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{t('contacts.create.title')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Autocomplete onChange={(data) => form.reset({ ...data, description: undefined })} />
            <InputController control={form.control} name="name" label={t('contacts.fields.name')} type="text" rules={{ required: t('validation.required', { field: t('contacts.fields.name') }) }} placeholder={t('contacts.placeholders.name')} />
            <InputController control={form.control} name="ico" label={t('contacts.fields.ico')} type="text" placeholder="1234567890" />
            <InputController control={form.control} name="dic" label={t('contacts.fields.dic')} type="text" placeholder="CZ1234567890" />
            <InputController control={form.control} name="country" label={t('contacts.fields.country')} type="text" placeholder={t('contacts.placeholders.country')} rules={{ required: t('validation.required', { field: t('contacts.fields.country') }) }} />
            <InputController control={form.control} name="city" label={t('contacts.fields.city')} type="text" placeholder={t('contacts.placeholders.city')} />
            <InputController control={form.control} name="street" label={t('contacts.fields.street')} type="text" placeholder={t('contacts.placeholders.street')} />
            <InputController control={form.control} name="psc" label={t('contacts.fields.psc')} type="text" placeholder="12345" />
            <InputController control={form.control} name="email" label={t('contacts.fields.email')} type="email" placeholder={t('contacts.placeholders.email')} />
            <InputController control={form.control} name="description" label={t('contacts.fields.description')} type="text" placeholder={t('contacts.placeholders.description')} />
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit">{t('contacts.actions.add')}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
