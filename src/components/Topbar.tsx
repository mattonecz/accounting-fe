import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Ordered by specificity — first matching prefix wins.
const ROUTE_TITLES: [string, string][] = [
  ['/contacts', 'nav.contacts'],
  ['/bank-accounts', 'nav.bankAccounts'],
  ['/outgoing-invoices', 'nav.invoicesIssued'],
  ['/incoming-invoices', 'nav.invoicesReceived'],
  ['/invoices/simple', 'nav.simpleInvoices'],
  ['/invoices', 'nav.invoicesIssued'],
  ['/tax-report', 'nav.taxReport'],
  ['/tax-filings', 'nav.taxFilings'],
  ['/data-messages', 'nav.dataMessages'],
];

export const Topbar = () => {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();

  const titleKey =
    ROUTE_TITLES.find(([prefix]) => pathname.startsWith(prefix))?.[1] ??
    'nav.dashboard';
  const lang = (i18n.language || 'cs').split('-')[0];

  return (
    <header className="sticky top-0 z-20 hidden h-14 shrink-0 items-center border-b bg-card px-8 md:flex">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between">
        <span className="text-sm font-semibold tracking-tight">
          {t(titleKey)}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-full px-3 text-xs text-muted-foreground"
            onClick={() => i18n.changeLanguage(lang === 'cs' ? 'en' : 'cs')}
          >
            <Globe className="h-3.5 w-3.5" />
            {lang.toUpperCase()}
          </Button>
        </div>
      </div>
    </header>
  );
};
