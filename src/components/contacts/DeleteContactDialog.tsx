import { useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';

import {
  getListContactsQueryKey,
  useDeleteContact,
} from '@/api/contacts/contacts';
import { useInvoiceListByCompany } from '@/api/invoices/invoices';
import type { ContactResponseDto } from '@/api/model';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { getApiErrorMessage } from '@/lib/apiError';

interface DeleteContactDialogProps {
  contact: Pick<ContactResponseDto, 'id' | 'name'> | null;
  onClose: () => void;
  onDeleted?: (id: string) => void;
}

/**
 * Contacts are referenced by invoices with an `onDelete: RESTRICT` foreign key,
 * so deleting a contact that has documents fails in the database. The linked
 * documents are counted first and the delete is blocked with an explanation
 * instead of letting the request blow up.
 */
export const DeleteContactDialog = ({
  contact,
  onClose,
  onDeleted,
}: DeleteContactDialogProps) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { mutate: deleteContact, isPending } = useDeleteContact();

  const { data: linkedResponse, isLoading: isCounting } =
    useInvoiceListByCompany(
      { contactId: contact?.id, pageSize: 1 },
      { query: { enabled: !!contact } },
    );

  const linkedCount = linkedResponse?.data?.total ?? 0;

  const handleConfirm = () => {
    if (!contact) return;
    const { id } = contact;
    deleteContact(
      { id },
      {
        onSuccess: async () => {
          enqueueSnackbar(t('contacts.delete.success'), { variant: 'success' });
          await queryClient.invalidateQueries({
            queryKey: getListContactsQueryKey(),
          });
          onClose();
          onDeleted?.(id);
        },
        onError: (error) => {
          enqueueSnackbar(
            getApiErrorMessage(error, t, 'contacts.delete.failed'),
            {
              variant: 'error',
            },
          );
        },
      },
    );
  };

  const blockedReason = isCounting
    ? t('contacts.delete.checking')
    : linkedCount > 0
      ? t('contacts.delete.blocked', { count: linkedCount })
      : undefined;

  return (
    <ConfirmDialog
      open={!!contact}
      onOpenChange={(next) => {
        if (!next && !isPending) onClose();
      }}
      title={t('contacts.delete.title')}
      description={t('contacts.delete.description', {
        name: contact?.name || '—',
      })}
      blockedReason={blockedReason}
      confirmLabel={t('contacts.delete.confirm')}
      destructive
      isPending={isPending}
      onConfirm={handleConfirm}
    />
  );
};
