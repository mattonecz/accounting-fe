import { useTranslation } from 'react-i18next';
import type { ContactResponseDto } from '@/api/model';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const formatAddress = (contact: Pick<ContactResponseDto, 'street' | 'city' | 'psc' | 'country'>) =>
  [contact.street, contact.psc, contact.city, contact.country].filter(Boolean).join(', ');

interface ContactInfoCardProps {
  contact: ContactResponseDto;
}

export const ContactInfoCard = ({ contact }: ContactInfoCardProps) => {
  const { t } = useTranslation();

  const fields = [
    { label: t('contacts.fields.ico'), value: contact.ico },
    { label: t('contacts.fields.dic'), value: contact.dic },
    { label: t('contacts.detail.address'), value: formatAddress(contact), fullWidth: true },
    { label: t('contacts.fields.email'), value: contact.email },
    { label: t('contacts.fields.phone'), value: contact.phone },
    { label: t('contacts.fields.description'), value: contact.description, fullWidth: true },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('contacts.detail.infoTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div
              key={field.label}
              className={field.fullWidth ? 'space-y-1 sm:col-span-2' : 'space-y-1'}
            >
              <p className="text-sm text-muted-foreground">{field.label}</p>
              <p className="font-medium">{field.value || '-'}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
