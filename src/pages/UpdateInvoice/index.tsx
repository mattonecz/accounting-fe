import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useNavigate, useParams } from 'react-router-dom';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { FormCard } from '@/components/FormCard';
import { useUpdateInvoiceForm } from './useUpdateInvoiceForm';
import { UpdateBasicInfoCard } from './UpdateBasicInfoCard';
import { UpdateItemsCard } from './UpdateItemsCard';

export default function UpdateInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    form,
    fields,
    isLoading,
    isError,
    isUpdatingInvoice,
    isCzkCurrency,
    sortedCompanies,
    sortedBanks,
    formatMoney,
    calculateInvoiceTotals,
    handleSubmit,
    addItem,
    removeItem,
    invoiceResponse,
  } = useUpdateInvoiceForm(id || '');

  if (!id) {
    return (
      <PageLayout>
        <p className="text-muted-foreground">Neplatné ID faktury.</p>
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout>
        <p className="text-muted-foreground">Načítám fakturu k úpravě...</p>
      </PageLayout>
    );
  }

  if (isError || !invoiceResponse?.data) {
    return (
      <PageLayout>
        <p className="text-destructive">Fakturu se nepodařilo načíst.</p>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="space-y-4">
      <PageHeader
        title="Upravit fakturu"
        description="Upravte údaje faktury a uložte změny"
        backButton
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <UpdateBasicInfoCard
            form={form}
            sortedCompanies={sortedCompanies}
            sortedBanks={sortedBanks}
            isCzkCurrency={isCzkCurrency}
          />

          <UpdateItemsCard
            form={form}
            fields={fields}
            formatMoney={formatMoney}
            calculateInvoiceTotals={calculateInvoiceTotals}
            addItem={addItem}
            removeItem={removeItem}
          />

          <FormCard title="Souhrn faktury">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Mezisoučet</p>
                <p className="text-2xl font-bold">
                  {formatMoney(form.watch('total'))}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">DPH celkem</p>
                <p className="text-2xl font-bold">
                  {formatMoney(form.watch('totalTax'))}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Částka celkem</p>
                <p className="text-2xl font-bold">
                  {formatMoney(form.watch('totalWithTax'))}
                </p>
              </div>
            </div>
          </FormCard>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Zrušit
            </Button>
            <Button type="submit" disabled={isUpdatingInvoice}>
              {isUpdatingInvoice ? 'Ukládám změny...' : 'Uložit změny'}
            </Button>
          </div>
        </form>
      </Form>
    </PageLayout>
  );
}
