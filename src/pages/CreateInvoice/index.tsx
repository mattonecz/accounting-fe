import { Form } from '@/components/ui/form';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { useInvoiceForm } from '@/components/invoices/useInvoiceForm';
import { InvoiceBasicInfoCard } from '@/components/invoices/InvoiceBasicInfoCard';
import { InvoiceItemsCard } from '@/components/invoices/InvoiceItemsCard';
import { InvoiceSummaryCard } from '@/components/invoices/InvoiceSummaryCard';
import { InvoiceFormActions } from '@/components/invoices/InvoiceFormActions';

const CreateInvoice = () => {
  const {
    form,
    fieldArray,
    submitMode,
    isCreatingInvoice,
    isCzkCurrency,
    sortedBanks,
    sortedCompanies,
    formatMoney,
    getBankAccountLabel,
    calculateTotals,
    submitInvoice,
  } = useInvoiceForm();

  return (
    <PageLayout>
      <PageHeader
        title="Vytvořit fakturu"
        description="Vyplňte údaje pro vytvoření nové faktury"
        backButton
      />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => submitInvoice(data, 'issued'))}
          className="space-y-6"
        >
          <InvoiceBasicInfoCard
            form={form}
            sortedCompanies={sortedCompanies}
            sortedBanks={sortedBanks}
            isCzkCurrency={isCzkCurrency}
            getBankAccountLabel={getBankAccountLabel}
          />

          <InvoiceItemsCard
            form={form}
            fieldArray={fieldArray}
            formatMoney={formatMoney}
            onRecalculate={calculateTotals}
          />

          <InvoiceSummaryCard form={form} formatMoney={formatMoney} />

          <InvoiceFormActions
            isCreatingInvoice={isCreatingInvoice}
            submitMode={submitMode}
            onSaveDraft={form.handleSubmit((data) =>
              submitInvoice(data, 'draft'),
            )}
          />
        </form>
      </Form>
    </PageLayout>
  );
};

export default CreateInvoice;
