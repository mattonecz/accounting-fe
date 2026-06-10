import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import {
  getGetContactQueryKey,
  getListContactsQueryKey,
  useGetContact,
  useUpdateContact,
} from '@/api/contacts/contacts';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { FormCard } from '@/components/FormCard';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import {
  ContactFormFields,
  type ContactFormValues,
} from '@/components/contacts/ContactFormFields';

const UpdateContact = () => {
  const { t } = useTranslation();
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data: contactResponse, isLoading } = useGetContact(id);
  const contact = contactResponse?.data;

  const { mutate: updateContact, isPending } = useUpdateContact();
  const form = useForm<ContactFormValues>({ defaultValues: { name: '', country: '' } });

  useEffect(() => {
    if (!contact) return;
    form.reset({
      name: contact.name ?? '',
      country: contact.country ?? '',
      ico: contact.ico,
      dic: contact.dic,
      city: contact.city,
      street: contact.street,
      psc: contact.psc,
      email: contact.email,
      description: contact.description,
    });
  }, [contact, form]);

  const onSubmit = (data: ContactFormValues) => {
    updateContact(
      { data: { ...data, id } },
      {
        onSuccess: async () => {
          enqueueSnackbar(t('contacts.messages.updated'), { variant: 'success' });
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: getListContactsQueryKey() }),
            queryClient.invalidateQueries({ queryKey: getGetContactQueryKey(id) }),
          ]);
          navigate('/contacts');
        },
        onError: () => {
          enqueueSnackbar(t('contacts.messages.updateFailed'), { variant: 'error' });
        },
      },
    );
  };

  return (
    <PageLayout className="space-y-4">
      <PageHeader
        title={t('contacts.edit.title')}
        description={t('contacts.edit.description')}
        backButton
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : !contact ? (
        <p className="text-sm text-muted-foreground">{t('contacts.edit.notFound')}</p>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormCard title={t('contacts.edit.title')} titleClassName="text-center">
              <div className="mx-auto max-w-3xl space-y-4">
                <ContactFormFields control={form.control} />
              </div>
            </FormCard>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate('/contacts')}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('contacts.actions.save')}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </PageLayout>
  );
};

export default UpdateContact;
