import { lazy, Suspense } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Sidebar, MobileTopBar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AiChatDialog } from '@/components/AiChatDialog';
import { SnackbarProvider } from 'notistack';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';

// Everything except the landing screens is split per route so the first paint
// does not carry the invoice forms, PDF preview and reporting pages.
const Contacts = lazy(() => import('./pages/Contacts'));
const ContactDetail = lazy(() => import('./pages/ContactDetail'));
const CreateContact = lazy(() => import('./pages/CreateContact'));
const UpdateContact = lazy(() => import('./pages/UpdateContact'));
const BankAccounts = lazy(() => import('./pages/BankAccounts'));
const CreateBankAccount = lazy(() => import('./pages/CreateBankAccount'));
const UpdateBankAccount = lazy(() => import('./pages/UpdateBankAccount'));
const IncomingInvoices = lazy(() => import('./pages/IncomingInvoices'));
const OutgoingInvoices = lazy(() => import('./pages/OutgoingInvoices'));
const CreateInvoice = lazy(() => import('./pages/CreateInvoice'));
const UpdateInvoice = lazy(() => import('./pages/UpdateInvoice'));
const SimpleInvoices = lazy(() => import('./pages/SimpleInvoices'));
const CreateSimpleInvoice = lazy(() => import('./pages/CreateSimpleInvoice'));
const UpdateSimpleInvoice = lazy(() => import('./pages/UpdateSimpleInvoice'));
const InvoiceDetail = lazy(() => import('./pages/InvoiceDetail'));
const TaxReport = lazy(() => import('./pages/TaxReport'));
const TaxFilings = lazy(() => import('./pages/TaxFilings'));
const CreateTaxFiling = lazy(() => import('./pages/CreateTaxFiling'));
const TaxFilingDetail = lazy(() => import('./pages/TaxFilingDetail'));
const DataMessages = lazy(() => import('./pages/DataMessages'));
const CreateDataMessage = lazy(() => import('./pages/CreateDataMessage'));
const DataMessageDetail = lazy(() => import('./pages/DataMessageDetail'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const NotFound = lazy(() => import('./pages/NotFound'));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="flex flex-1 items-center justify-center py-24">
    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
  </div>
);

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
              <Suspense fallback={<RouteFallback />}>
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
                        <div className="flex min-h-screen bg-background">
                          <Sidebar />
                          <div className="flex min-w-0 flex-1 flex-col">
                            <MobileTopBar />
                            <Topbar />
                            <Suspense fallback={<RouteFallback />}>
                              <Routes>
                                <Route path="/" element={<Dashboard />} />
                                <Route
                                  path="/contacts"
                                  element={<Contacts />}
                                />
                                <Route
                                  path="/contacts/create"
                                  element={<CreateContact />}
                                />
                                <Route
                                  path="/contacts/:id/edit"
                                  element={<UpdateContact />}
                                />
                                <Route
                                  path="/contacts/:id"
                                  element={<ContactDetail />}
                                />
                                <Route
                                  path="/bank-accounts"
                                  element={<BankAccounts />}
                                />
                                <Route
                                  path="/bank-accounts/create"
                                  element={<CreateBankAccount />}
                                />
                                <Route
                                  path="/bank-accounts/:id/edit"
                                  element={<UpdateBankAccount />}
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
                                  path="/invoices/simple/create"
                                  element={<CreateSimpleInvoice />}
                                />
                                <Route
                                  path="/invoices/simple/:id/edit"
                                  element={<UpdateSimpleInvoice />}
                                />
                                <Route
                                  path="/invoices/:id"
                                  element={<InvoiceDetail />}
                                />
                                <Route
                                  path="/tax-report"
                                  element={<TaxReport />}
                                />
                                <Route
                                  path="/tax-filings"
                                  element={<TaxFilings />}
                                />
                                <Route
                                  path="/tax-filings/create"
                                  element={<CreateTaxFiling />}
                                />
                                <Route
                                  path="/tax-filings/:id"
                                  element={<TaxFilingDetail />}
                                />
                                <Route
                                  path="/data-messages"
                                  element={<DataMessages />}
                                />
                                <Route
                                  path="/data-messages/create"
                                  element={<CreateDataMessage />}
                                />
                                <Route
                                  path="/data-messages/:id"
                                  element={<DataMessageDetail />}
                                />
                                <Route path="*" element={<NotFound />} />
                              </Routes>
                            </Suspense>
                          </div>
                          <AiChatDialog />
                        </div>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </SnackbarProvider>
      </AuthProvider>
    </I18nextProvider>
  </QueryClientProvider>
);

export default App;
