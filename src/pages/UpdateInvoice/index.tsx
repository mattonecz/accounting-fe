import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useNavigate, useParams } from 'react-router-dom';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { FormCard } from '@/components/FormCard';
import { useUpdateInvoiceForm, toNumber } from './useUpdateInvoiceForm';
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
    isVatPayer,
    sortedContacts,
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

  const items = form.watch('items') ?? [];
  const total = items.reduce(
    (sum, item) => sum + toNumber(item.quantity) * toNumber(item.unitPrice),
    0,
  );
  const totalTax = isVatPayer
    ? items.reduce((sum, item) => {
        const base = toNumber(item.quantity) * toNumber(item.unitPrice);
        return sum + base * (toNumber(item.vatRate) / 100);
      }, 0)
    : 0;

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
            sortedContacts={sortedContacts}
            sortedBanks={sortedBanks}
            isCzkCurrency={isCzkCurrency}
            isVatPayer={isVatPayer}
          />

          <UpdateItemsCard
            form={form}
            fields={fields}
            formatMoney={formatMoney}
            calculateInvoiceTotals={calculateInvoiceTotals}
            addItem={addItem}
            removeItem={removeItem}
            isVatPayer={isVatPayer}
          />

          <FormCard title="Souhrn faktury">
            <div
              className={`grid grid-cols-1 gap-4 ${
                isVatPayer ? 'md:grid-cols-3' : 'md:grid-cols-1'
              }`}
            >
              <div>
                <p className="text-sm text-muted-foreground">
                  {isVatPayer ? 'Mezisoučet' : 'Částka celkem'}
                </p>
                <p className="text-2xl font-bold">{formatMoney(total)}</p>
              </div>
              {isVatPayer && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">DPH celkem</p>
                    <p className="text-2xl font-bold">{formatMoney(totalTax)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Částka celkem</p>
                    <p className="text-2xl font-bold">{formatMoney(total + totalTax)}</p>
                  </div>
                </>
              )}
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
