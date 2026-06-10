import { Control, UseFormGetValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { InputController } from '@/components/InputController';

export type BankAccountFormValues = {
  name: string;
  number?: string;
  iban?: string;
  swift?: string;
  currency: string;
};

interface BankAccountFormFieldsProps {
  control: Control<BankAccountFormValues>;
  getValues: UseFormGetValues<BankAccountFormValues>;
}

export const BankAccountFormFields = ({ control, getValues }: BankAccountFormFieldsProps) => {
  const { t } = useTranslation();

  return (
    <>
      <InputController
        control={control}
        name="name"
        label={t('bankAccounts.fields.name')}
        type="text"
        rules={{ required: t('validation.required', { field: t('bankAccounts.fields.name') }) }}
        placeholder="ČSOB CZK"
      />
      <InputController
        control={control}
        name="number"
        label={t('bankAccounts.fields.number')}
        type="text"
        placeholder="1234567890"
        rules={{
          validate: (value) => {
            const iban = getValues('iban');
            if (!value && !iban) return t('bankAccounts.validation.numberOrIbanRequired');
            return true;
          },
        }}
      />
      <InputController
        control={control}
        name="iban"
        label={t('bankAccounts.fields.iban')}
        type="text"
        placeholder="CZ65 0800 0000 1234 5678 9012"
        rules={{
          validate: (value) => {
            const number = getValues('number');
            if (!value && !number) return t('bankAccounts.validation.numberOrIbanRequired');
            return true;
          },
        }}
      />
      <InputController
        control={control}
        name="swift"
        label={t('bankAccounts.fields.swift')}
        type="text"
        placeholder="CEKOCZPP"
      />
      <InputController
        control={control}
        name="currency"
        label={t('bankAccounts.fields.currency')}
        placeholder="CZK"
        rules={{ required: t('validation.required', { field: t('bankAccounts.fields.currency') }) }}
      />
    </>
  );
};
