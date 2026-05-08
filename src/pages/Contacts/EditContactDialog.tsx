import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import type { ContactResponseDto, UpdateContactDto } from '@/api/model';
import { useUpdateContact } from '@/api/contacts/contacts';
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
  contact: ContactResponseDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditContactDialog = ({ contact, onClose, onSuccess }: EditContactDialogProps) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const { mutate: updateContact } = useUpdateContact();
  const form = useForm<UpdateContactDto>();

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

  const onSubmit = (data: UpdateContactDto) => {
    if (!contact) return;
    updateContact(
      { data: { ...data, id: contact.id } },
      {
        onSuccess: () => {
          enqueueSnackbar(t('contacts.messages.updated'), { variant: 'success' });
          onClose();
          form.reset();
          onSuccess();
        },
        onError: () => {
          enqueueSnackbar(t('contacts.messages.updateFailed'), { variant: 'error' });
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
          <DialogTitle>{t('contacts.edit.title')}</DialogTitle>
          <DialogDescription>{t('contacts.edit.description')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <InputController control={form.control} name="name" label={t('contacts.fields.name')} type="text" rules={{ required: t('validation.required', { field: t('contacts.fields.name') }) }} placeholder={t('contacts.placeholders.name')} />
            <InputController control={form.control} name="ico" label={t('contacts.fields.ico')} type="text" placeholder="1234567890" />
            <InputController control={form.control} name="dic" label={t('contacts.fields.dic')} type="text" placeholder="CZ1234567890" />
            <InputController control={form.control} name="country" label={t('contacts.fields.country')} type="text" placeholder={t('contacts.placeholders.country')} />
            <InputController control={form.control} name="city" label={t('contacts.fields.city')} type="text" placeholder={t('contacts.placeholders.city')} />
            <InputController control={form.control} name="street" label={t('contacts.fields.street')} type="text" placeholder={t('contacts.placeholders.street')} />
            <InputController control={form.control} name="psc" label={t('contacts.fields.psc')} type="text" placeholder="12345" />
            <InputController control={form.control} name="email" label={t('contacts.fields.email')} type="email" placeholder={t('contacts.placeholders.email')} />
            <InputController control={form.control} name="description" label={t('contacts.fields.description')} type="text" placeholder={t('contacts.placeholders.description')} />
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => { onClose(); form.reset(); }}>
                {t('common.cancel')}
              </Button>
              <Button type="submit">{t('contacts.actions.save')}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
