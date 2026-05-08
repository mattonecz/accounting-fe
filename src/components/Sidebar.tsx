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
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useSnackbar } from 'notistack';
import { SettingsMenu } from '@/components/settings/SettingsMenu';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Bank Accounts', href: '/bank-accounts', icon: Building2 },
  { name: 'Faktury vydané', href: '/outgoing-invoices', icon: FileInput },
  { name: 'Faktury přijaté', href: '/incoming-invoices', icon: FileText },
  { name: 'Zjednodušené doklady', href: '/invoices/simple', icon: Receipt },
  { name: 'Přehled DPH', href: '/tax-report', icon: Calculator },
];

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const handleLogout = () => {
    logout();
    enqueueSnackbar('Logged out successfully', { variant: 'success' });
    navigate('/auth');
  };

  return (
    <div className="sticky top-0 flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <Wallet className="mr-3 h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold text-foreground">FreelanceBooks</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
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
          Logout
        </Button>
      </div>
    </div>
  );
};
