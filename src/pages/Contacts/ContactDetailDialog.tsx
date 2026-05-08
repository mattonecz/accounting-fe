import { useTranslation } from 'react-i18next';
import type { ContactResponseDto } from '@/api/model';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const formatAddress = (company: Pick<ContactResponseDto, 'street' | 'city' | 'psc' | 'country'>) =>
  [company.street, company.psc, company.city, company.country].filter(Boolean).join(', ');

interface ContactDetailDialogProps {
  contact: ContactResponseDto | null;
  onClose: () => void;
}

export const ContactDetailDialog = ({ contact, onClose }: ContactDetailDialogProps) => {
  const { t } = useTranslation();
  return (
    <Dialog open={contact !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{contact?.name}</DialogTitle>
          <DialogDescription>
            {t('contacts.detail.description')}
          </DialogDescription>
        </DialogHeader>
        {contact && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t('contacts.fields.ico')}</p>
              <p className="font-medium">{contact.ico || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t('contacts.fields.dic')}</p>
              <p className="font-medium">{contact.dic || '-'}</p>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <p className="text-sm text-muted-foreground">{t('contacts.detail.address')}</p>
              <p className="font-medium">{formatAddress(contact) || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t('contacts.fields.city')}</p>
              <p className="font-medium">{contact.city || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t('contacts.fields.country')}</p>
              <p className="font-medium">{contact.country || '-'}</p>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <p className="text-sm text-muted-foreground">{t('contacts.fields.email')}</p>
              <p className="font-medium">{contact.email || '-'}</p>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <p className="text-sm text-muted-foreground">{t('contacts.fields.description')}</p>
              <p className="font-medium">{contact.description || '-'}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
