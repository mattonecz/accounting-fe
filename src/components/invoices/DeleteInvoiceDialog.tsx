import { useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';

import {
  getInvoiceGetQueryKey,
  getInvoiceListByCompanyQueryKey,
  getInvoiceGetStatsQueryKey,
  useInvoiceDelete,
} from '@/api/invoices/invoices';
import type { InvoiceResponseDto } from '@/api/model';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { getApiErrorMessage } from '@/lib/apiError';
import { isInvoiceLocked } from '@/lib/invoiceLock';

export type DeletableInvoice = Pick<
  InvoiceResponseDto,
  'id' | 'number' | 'kind' | 'isLocked'
>;

interface DeleteInvoiceDialogProps {
  /** The invoice to delete; `null` keeps the dialog closed. */
  invoice: DeletableInvoice | null;
  onClose: () => void;
  onDeleted?: (id: string) => void;
}

/**
 * Confirmation + delete for both regular invoices and simplified documents.
 * Invoices locked by a submitted VAT filing cannot be deleted — the dialog
 * explains why instead of offering a button that the backend would reject.
 */
export const DeleteInvoiceDialog = ({
  invoice,
  onClose,
  onDeleted,
}: DeleteInvoiceDialogProps) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { mutate: deleteInvoice, isPending } = useInvoiceDelete();

  const isSimple = invoice?.kind === 'SIMPLE';
  const ns = isSimple ? 'simpleInvoices' : 'invoices';
  const locked = isInvoiceLocked(invoice);

  const handleConfirm = () => {
    if (!invoice) return;
    const { id } = invoice;
    deleteInvoice(
      { id },
      {
        onSuccess: async () => {
          enqueueSnackbar(t(`${ns}.delete.success`), { variant: 'success' });
          queryClient.removeQueries({ queryKey: getInvoiceGetQueryKey(id) });
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: getInvoiceListByCompanyQueryKey(),
            }),
            queryClient.invalidateQueries({
              queryKey: getInvoiceGetStatsQueryKey(),
            }),
          ]);
          onClose();
          onDeleted?.(id);
        },
        onError: (error) => {
          enqueueSnackbar(getApiErrorMessage(error, t, `${ns}.delete.failed`), {
            variant: 'error',
          });
        },
      },
    );
  };

  return (
    <ConfirmDialog
      open={!!invoice}
      onOpenChange={(next) => {
        if (!next && !isPending) onClose();
      }}
      title={t(`${ns}.delete.title`)}
      description={t(`${ns}.delete.description`, {
        number: invoice?.number || '—',
      })}
      blockedReason={locked ? t(`${ns}.locked.description`) : undefined}
      confirmLabel={t(`${ns}.delete.confirm`)}
      destructive
      isPending={isPending}
      onConfirm={handleConfirm}
    />
  );
};
