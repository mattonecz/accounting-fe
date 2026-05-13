import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  Building2,
  FileText,
  FileInput,
  Wallet,
  LogOut,
  Calculator,
  Receipt,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useSnackbar } from 'notistack';
import { SettingsMenu } from '@/components/settings/SettingsMenu';

export const Sidebar = () => {
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
        { name: t('nav.invoicesIssued'), href: '/outgoing-invoices', icon: FileInput },
        { name: t('nav.invoicesReceived'), href: '/incoming-invoices', icon: FileText },
        { name: t('nav.simpleInvoices'), href: '/invoices/simple', icon: Receipt },
      ],
    },
    {
      label: t('nav.sectionData'),
      items: [
        { name: t('nav.contacts'), href: '/contacts', icon: Users },
        { name: t('nav.bankAccounts'), href: '/bank-accounts', icon: Building2 },
      ],
    },
    {
      label: t('nav.sectionReports'),
      items: [{ name: t('nav.taxReport'), href: '/tax-report', icon: Calculator }],
    },
  ];

  const handleLogout = () => {
    logout();
    enqueueSnackbar(t('auth.messages.logoutSuccess'), { variant: 'success' });
    navigate('/auth');
  };

  return (
    <div className="sticky top-0 flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <Wallet className="mr-3 h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold text-foreground">FreelanceBooks</h1>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto p-4">
        {navigationGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
            {group.items.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="border-t border-border p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{user?.name || user?.email}</span>
          <SettingsMenu />
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full justify-start gap-2"
        >
          <LogOut className="h-4 w-4" />
          {t('nav.logout')}
        </Button>
      </div>
    </div>
  );
};
