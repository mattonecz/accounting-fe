import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        <p className="text-muted-foreground">{t('invoices.detail.invalidId')}</p>
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout>
        <p className="text-muted-foreground">{t('invoices.update.loading')}</p>
      </PageLayout>
    );
  }

  if (isError || !invoiceResponse?.data) {
    return (
      <PageLayout>
        <p className="text-destructive">{t('invoices.detail.loadError')}</p>
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
        title={t('invoices.update.title')}
        description={t('invoices.update.description')}
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

          <FormCard title={t('invoices.summary.title')}>
            <div
              className={`grid grid-cols-1 gap-4 ${
                isVatPayer ? 'md:grid-cols-3' : 'md:grid-cols-1'
              }`}
            >
              <div>
                <p className="text-sm text-muted-foreground">
                  {isVatPayer ? t('invoices.summary.subtotal') : t('invoices.summary.total')}
                </p>
                <p className="text-2xl font-bold">{formatMoney(total)}</p>
              </div>
              {isVatPayer && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('invoices.summary.totalTax')}</p>
                    <p className="text-2xl font-bold">{formatMoney(totalTax)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('invoices.summary.total')}</p>
                    <p className="text-2xl font-bold">{formatMoney(total + totalTax)}</p>
                  </div>
                </>
              )}
            </div>
          </FormCard>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isUpdatingInvoice}>
              {isUpdatingInvoice ? t('invoices.update.saving') : t('invoices.update.save')}
            </Button>
          </div>
        </form>
      </Form>
    </PageLayout>
  );
}
