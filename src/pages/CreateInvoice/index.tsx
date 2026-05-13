import { useTranslation } from 'react-i18next';
import { Form } from '@/components/ui/form';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { useInvoiceForm } from '@/components/invoices/useInvoiceForm';
import { InvoiceBasicInfoCard } from '@/components/invoices/InvoiceBasicInfoCard';
import { InvoiceItemsCard } from '@/components/invoices/InvoiceItemsCard';
import { InvoiceSummaryCard } from '@/components/invoices/InvoiceSummaryCard';
import { InvoiceFormActions } from '@/components/invoices/InvoiceFormActions';
import { InvoiceVatClaimCard } from '@/components/invoices/InvoiceVatClaimCard';
import { CreateInvoiceDtoVatMode } from '@/api/model';

const CreateInvoice = () => {
  const { t } = useTranslation();
  const {
    form,
    fieldArray,
    isCreatingInvoice,
    isCzkCurrency,
    isReceived,
    isVatPayer,
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
        title={isReceived ? t('invoices.create.titleReceived') : t('invoices.create.title')}
        description={t('invoices.create.description')}
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
            isVatPayer={isVatPayer}
            getBankAccountLabel={getBankAccountLabel}
          />

          <InvoiceItemsCard
            form={form}
            fieldArray={fieldArray}
            formatMoney={formatMoney}
            onRecalculate={calculateTotals}
            isVatPayer={isVatPayer}
          />

          <InvoiceSummaryCard
            form={form}
            formatMoney={formatMoney}
            isVatPayer={isVatPayer}
          />

          {isVatPayer &&
            isReceived &&
            form.watch('vatMode') === CreateInvoiceDtoVatMode.STANDARD && (
              <InvoiceVatClaimCard form={form} />
            )}

          <InvoiceFormActions isCreatingInvoice={isCreatingInvoice} />
        </form>
      </Form>
    </PageLayout>
  );
};

export default CreateInvoice;
