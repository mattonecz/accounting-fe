import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface InvoiceFormActionsProps {
  isCreatingInvoice: boolean;
}

export const InvoiceFormActions = ({
  isCreatingInvoice,
}: InvoiceFormActionsProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-end gap-4">
      <Button type="button" variant="outline" onClick={() => navigate(-1)}>
        Zrušit
      </Button>
      <Button type="submit" disabled={isCreatingInvoice}>
        {isCreatingInvoice ? 'Vytvářím...' : 'Vytvořit fakturu'}
      </Button>
    </div>
  );
};
