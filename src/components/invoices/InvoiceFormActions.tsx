import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { InvoiceSubmitMode } from './useInvoiceForm';

interface InvoiceFormActionsProps {
  isCreatingInvoice: boolean;
  submitMode: InvoiceSubmitMode;
  onSaveDraft: () => void;
}

export const InvoiceFormActions = ({
  isCreatingInvoice,
  submitMode,
  onSaveDraft,
}: InvoiceFormActionsProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-end gap-4">
      <Button type="button" variant="outline" onClick={() => navigate(-1)}>
        Zrušit
      </Button>
      <Button
        type="button"
        variant="secondary"
        disabled={isCreatingInvoice}
        onClick={onSaveDraft}
      >
        {isCreatingInvoice && submitMode === 'draft'
          ? 'Ukládám koncept...'
          : 'Vytvořit koncept'}
      </Button>
      <Button type="submit" disabled={isCreatingInvoice}>
        {isCreatingInvoice && submitMode === 'issued'
          ? 'Vytvářím...'
          : 'Vytvořit fakturu'}
      </Button>
    </div>
  );
};
