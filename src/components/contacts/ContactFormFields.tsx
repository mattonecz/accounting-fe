import { Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { InputController } from '@/components/InputController';

export type ContactFormValues = {
  name: string;
  country: string;
  ico?: string;
  dic?: string;
  city?: string;
  street?: string;
  psc?: string;
  email?: string;
  description?: string;
};

interface ContactFormFieldsProps {
  control: Control<ContactFormValues>;
}

export const ContactFormFields = ({ control }: ContactFormFieldsProps) => {
  const { t } = useTranslation();

  return (
    <>
      <InputController
        control={control}
        name="name"
        label={t('contacts.fields.name')}
        type="text"
        rules={{ required: t('validation.required', { field: t('contacts.fields.name') }) }}
        placeholder={t('contacts.placeholders.name')}
      />
      <InputController
        control={control}
        name="ico"
        label={t('contacts.fields.ico')}
        type="text"
        placeholder="1234567890"
      />
      <InputController
        control={control}
        name="dic"
        label={t('contacts.fields.dic')}
        type="text"
        placeholder="CZ1234567890"
      />
      <InputController
        control={control}
        name="country"
        label={t('contacts.fields.country')}
        type="text"
        placeholder={t('contacts.placeholders.country')}
        rules={{ required: t('validation.required', { field: t('contacts.fields.country') }) }}
      />
      <InputController
        control={control}
        name="city"
        label={t('contacts.fields.city')}
        type="text"
        placeholder={t('contacts.placeholders.city')}
      />
      <InputController
        control={control}
        name="street"
        label={t('contacts.fields.street')}
        type="text"
        placeholder={t('contacts.placeholders.street')}
      />
      <InputController
        control={control}
        name="psc"
        label={t('contacts.fields.psc')}
        type="text"
        placeholder="12345"
      />
      <InputController
        control={control}
        name="email"
        label={t('contacts.fields.email')}
        type="email"
        placeholder={t('contacts.placeholders.email')}
      />
      <InputController
        control={control}
        name="description"
        label={t('contacts.fields.description')}
        type="text"
        placeholder={t('contacts.placeholders.description')}
      />
    </>
  );
};
