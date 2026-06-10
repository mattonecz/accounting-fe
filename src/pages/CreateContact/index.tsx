import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import type { CreateContactDto } from '@/api/model';
import { getListContactsQueryKey, useCreateContact } from '@/api/contacts/contacts';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { FormCard } from '@/components/FormCard';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Autocomplete } from '@/components/ui/autocomplete';
import {
  ContactFormFields,
  type ContactFormValues,
} from '@/components/contacts/ContactFormFields';

const CreateContact = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { mutate: createContact, isPending } = useCreateContact();
  const form = useForm<ContactFormValues>({ defaultValues: { name: '', country: '' } });

  const onSubmit = (data: ContactFormValues) => {
    createContact(
      { data: data satisfies CreateContactDto },
      {
        onSuccess: async () => {
          enqueueSnackbar(t('contacts.messages.created'), { variant: 'success' });
          await queryClient.invalidateQueries({ queryKey: getListContactsQueryKey() });
          navigate('/contacts');
        },
        onError: () => {
          enqueueSnackbar(t('contacts.messages.createFailed'), { variant: 'error' });
        },
      },
    );
  };

  return (
    <PageLayout className="space-y-4">
      <PageHeader
        title={t('contacts.create.title')}
        description={t('contacts.create.description')}
        backButton
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormCard title={t('contacts.create.title')} titleClassName="text-center">
            <div className="mx-auto max-w-3xl space-y-4">
              <Autocomplete
                onChange={(data) => {
                  const mainNumber = data.houseNumber || data.registrationNumber;
                  const numberPart = mainNumber
                    ? data.orientationNumber
                      ? `${mainNumber}/${data.orientationNumber}`
                      : mainNumber
                    : '';
                  form.reset({
                    name: data.companyName ?? data.name ?? '',
                    country: data.country ?? '',
                    ico: data.ico,
                    dic: data.dic,
                    city: data.city,
                    street: [data.street, numberPart].filter(Boolean).join(' ') || undefined,
                    psc: data.psc,
                  });
                }}
              />
              <ContactFormFields control={form.control} />
            </div>
          </FormCard>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('/contacts')}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('contacts.actions.add')}
            </Button>
          </div>
        </form>
      </Form>
    </PageLayout>
  );
};

export default CreateContact;
