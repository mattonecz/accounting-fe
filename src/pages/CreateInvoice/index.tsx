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
    isCreatingInvoice,
    isCzkCurrency,
    isReceived,
    sortedBanks,
    sortedContacts,
    formatMoney,
    getBankAccountLabel,
    calculateTotals,
    submitInvoice,
  } = useInvoiceForm();

  return (
    <PageLayout>
      <PageHeader
        title={isReceived ? 'Vytvořit přijatou fakturu' : 'Vytvořit fakturu'}
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
            sortedContacts={sortedContacts}
            sortedBanks={sortedBanks}
            isCzkCurrency={isCzkCurrency}
            isReceived={isReceived}
            getBankAccountLabel={getBankAccountLabel}
          />

          <InvoiceItemsCard
            form={form}
            fieldArray={fieldArray}
            formatMoney={formatMoney}
            onRecalculate={calculateTotals}
          />

          <InvoiceSummaryCard form={form} formatMoney={formatMoney} />

          <InvoiceFormActions isCreatingInvoice={isCreatingInvoice} />
        </form>
      </Form>
    </PageLayout>
  );
};

export default CreateInvoice;
