import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface InvoiceLockedNoticeProps {
  invoiceId: string;
  isSimple?: boolean;
}

/**
 * Shown instead of an edit form when the invoice is frozen by a submitted VAT
 * filing — the backend would reject the update anyway.
 */
export const InvoiceLockedNotice = ({
  invoiceId,
  isSimple = false,
}: InvoiceLockedNoticeProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const ns = isSimple ? 'simpleInvoices' : 'invoices';

  return (
    <div className="mx-auto max-w-[760px] space-y-4">
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertTitle>{t(`${ns}.locked.title`)}</AlertTitle>
        <AlertDescription>{t(`${ns}.locked.description`)}</AlertDescription>
      </Alert>
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => navigate(`/invoices/${invoiceId}`)}
      >
        <ArrowLeft className="h-4 w-4" />
        {t('invoices.actions.detail')}
      </Button>
    </div>
  );
};
