import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  Building2,
  FileText,
  FileInput,
  LogOut,
  Calculator,
  Receipt,
  FileCheck,
  MessageSquare,
  Menu,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useSnackbar } from 'notistack';
import { SettingsMenu } from '@/components/settings/SettingsMenu';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const SidebarNavigation = ({ onNavigate }: { onNavigate?: () => void }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const navigationGroups = [
    {
      label: t('nav.sectionOverview'),
      items: [{ name: t('nav.dashboard'), href: '/', icon: Home }],
    },
    {
      label: t('nav.sectionBilling'),
      items: [
        {
          name: t('nav.invoicesIssued'),
          href: '/outgoing-invoices',
          icon: FileInput,
        },
        {
          name: t('nav.invoicesReceived'),
          href: '/incoming-invoices',
          icon: FileText,
        },
        {
          name: t('nav.simpleInvoices'),
          href: '/invoices/simple',
          icon: Receipt,
        },
      ],
    },
    {
      label: t('nav.sectionData'),
      items: [
        { name: t('nav.contacts'), href: '/contacts', icon: Users },
        {
          name: t('nav.bankAccounts'),
          href: '/bank-accounts',
          icon: Building2,
        },
      ],
    },
    {
      label: t('nav.sectionReports'),
      items: [
        { name: t('nav.taxReport'), href: '/tax-report', icon: Calculator },
        { name: t('nav.taxFilings'), href: '/tax-filings', icon: FileCheck },
      ],
    },
    {
      label: t('nav.sectionMessages'),
      items: [
        {
          name: t('nav.dataMessages'),
          href: '/data-messages',
          icon: MessageSquare,
        },
      ],
    },
  ];

  const handleLogout = () => {
    logout();
    enqueueSnackbar(t('auth.messages.logoutSuccess'), { variant: 'success' });
    navigate('/auth');
    onNavigate?.();
  };

  return (
    <>
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-6">
        <span className="h-[18px] w-[18px] shrink-0 rounded bg-brand" />
        <h1 className="text-[15px] font-bold tracking-tight text-foreground">
          FreelanceBooks
        </h1>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3.5 pb-4">
        {navigationGroups.map((group) => (
          <div key={group.label}>
            <p className="px-2.5 pb-1.5 pt-3.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => onNavigate?.()}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors',
                      isActive
                        ? 'bg-muted font-semibold text-foreground'
                        : 'text-foreground/70 hover:bg-muted/60 hover:text-foreground',
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-4 w-4 shrink-0',
                        isActive ? 'text-brand' : 'text-muted-foreground',
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="shrink-0 border-t p-3.5">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="truncate text-xs text-muted-foreground">
            {user?.name || user?.email}
          </span>
          <SettingsMenu />
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
        >
          <LogOut className="h-4 w-4" />
          {t('nav.logout')}
        </Button>
      </div>
    </>
  );
};

export const Sidebar = () => (
  <aside className="sticky top-0 hidden h-screen w-60 max-w-[240px] shrink-0 flex-col border-r bg-card md:flex">
    <SidebarNavigation />
  </aside>
);

export const MobileTopBar = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-card px-3 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('nav.openMenu', { defaultValue: 'Menu' })}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="flex w-60 max-w-[240px] flex-col p-0"
        >
          <SheetTitle className="sr-only">FreelanceBooks</SheetTitle>
          <SidebarNavigation onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex items-center gap-2">
        <span className="h-4 w-4 rounded bg-brand" />
        <span className="text-base font-semibold text-foreground">
          FreelanceBooks
        </span>
      </div>
    </div>
  );
};
