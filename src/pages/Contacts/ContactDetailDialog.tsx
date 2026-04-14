import type { CompanyResponseDto } from '@/api/model';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const formatAddress = (company: Pick<CompanyResponseDto, 'street' | 'city' | 'psc' | 'country'>) =>
  [company.street, company.psc, company.city, company.country].filter(Boolean).join(', ');

interface ContactDetailDialogProps {
  contact: CompanyResponseDto | null;
  onClose: () => void;
}

export const ContactDetailDialog = ({ contact, onClose }: ContactDetailDialogProps) => (
  <Dialog open={contact !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="sm:max-w-[560px]">
      <DialogHeader>
        <DialogTitle>{contact?.name}</DialogTitle>
        <DialogDescription>
          Contact details and registered company information.
        </DialogDescription>
      </DialogHeader>
      {contact && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">ICO</p>
            <p className="font-medium">{contact.ico || '-'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">DIC</p>
            <p className="font-medium">{contact.dic || '-'}</p>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <p className="text-sm text-muted-foreground">Address</p>
            <p className="font-medium">{formatAddress(contact) || '-'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">City</p>
            <p className="font-medium">{contact.city || '-'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Country</p>
            <p className="font-medium">{contact.country || '-'}</p>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{contact.email || '-'}</p>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <p className="text-sm text-muted-foreground">Description</p>
            <p className="font-medium">{contact.description || '-'}</p>
          </div>
        </div>
      )}
    </DialogContent>
  </Dialog>
);
