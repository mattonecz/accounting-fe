import { useState } from 'react';
import { Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { BillingInfoForm } from './BillingInfoForm';
import { InvoiceDefaultsForm } from './InvoiceDefaultsForm';
import { LanguageSelector } from '@/components/LanguageSelector';

type ActiveDialog = 'billing' | 'defaults' | null;

export const SettingsMenu = () => {
  const { t } = useTranslation();
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const { activeCompanyId } = useAuth();

  const open = (dialog: ActiveDialog) => setActiveDialog(dialog);
  const close = () => setActiveDialog(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top">
          <LanguageSelector />
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => open('billing')}>
            {t('settings.menu.billing')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => open('defaults')}>
            {t('settings.menu.defaults')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={activeDialog === 'billing'} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-2xl p-0">
          <ScrollArea className="max-h-[85vh]">
            <div className="p-6">
              <DialogHeader className="mb-6">
                <DialogTitle>{t('settings.billing.title')}</DialogTitle>
                <DialogDescription>
                  {t('settings.billing.description')}
                </DialogDescription>
              </DialogHeader>
              <BillingInfoForm companyId={activeCompanyId ?? ''} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === 'defaults'} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-2xl p-0">
          <ScrollArea className="max-h-[85vh]">
            <div className="p-6">
              <DialogHeader className="mb-6">
                <DialogTitle>{t('settings.defaults.title')}</DialogTitle>
                <DialogDescription>
                  {t('settings.defaults.description')}
                </DialogDescription>
              </DialogHeader>
              <InvoiceDefaultsForm />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};
