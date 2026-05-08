import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface InvoiceFormActionsProps {
  isCreatingInvoice: boolean;
}

export const InvoiceFormActions = ({ isCreatingInvoice }: InvoiceFormActionsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex justify-end gap-4">
      <Button type="button" variant="outline" onClick={() => navigate(-1)}>
        {t('common.cancel')}
      </Button>
      <Button type="submit" disabled={isCreatingInvoice}>
        {isCreatingInvoice ? t('invoices.actions.creating') : t('invoices.actions.create')}
      </Button>
    </div>
  );
};
