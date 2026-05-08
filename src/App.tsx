import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AiChatDialog } from '@/components/AiChatDialog';
import { SnackbarProvider } from 'notistack';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import BankAccounts from './pages/BankAccounts';
import IncomingInvoices from './pages/IncomingInvoices';
import OutgoingInvoices from './pages/OutgoingInvoices';
import CreateInvoice from './pages/CreateInvoice';
import UpdateInvoice from './pages/UpdateInvoice';
import SimpleInvoices from './pages/SimpleInvoices';
import InvoiceDetail from './pages/InvoiceDetail';
import TaxReport from './pages/TaxReport';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nextProvider i18n={i18n}>
    <AuthProvider>
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        autoHideDuration={3000}
      >
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute requireNoCompany>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/*"
                element={
                  <ProtectedRoute requireCompany>
                    <div className="flex min-h-screen bg-background justify-center">
                      <div className="flex w-full max-w-[1200px] border-x shadow-lg">
                        <Sidebar />
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/contacts" element={<Contacts />} />
                          <Route
                            path="/bank-accounts"
                            element={<BankAccounts />}
                          />
                          <Route
                            path="/incoming-invoices"
                            element={<IncomingInvoices />}
                          />
                          <Route
                            path="/outgoing-invoices"
                            element={<OutgoingInvoices />}
                          />
                          <Route
                            path="/invoices/create"
                            element={<CreateInvoice />}
                          />
                          <Route
                            path="/invoices/:id/edit"
                            element={<UpdateInvoice />}
                          />
                          <Route
                            path="/invoices/simple"
                            element={<SimpleInvoices />}
                          />
                          <Route
                            path="/invoices/:id"
                            element={<InvoiceDetail />}
                          />
                          <Route path="/tax-report" element={<TaxReport />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </div>
                      <AiChatDialog />
                    </div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SnackbarProvider>
    </AuthProvider>
  </I18nextProvider>
  </QueryClientProvider>
);

export default App;
