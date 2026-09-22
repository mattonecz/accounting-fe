import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { Loader2, ScanText } from 'lucide-react';
import { useDocumentParseInvoice } from '@/api/documents/documents';
import { ParsedInvoiceType } from '@/api/model';
import { Button, type ButtonProps } from '@/components/ui/button';
import type { ParsedInvoiceState } from '@/lib/parsedDocument';
import { cn } from '@/lib/utils';

type UploadInvoiceButtonProps = Pick<
  ButtonProps,
  'variant' | 'size' | 'className'
>;

/**
 * Opens a file picker, sends the invoice (image or PDF — the backend passes a
 * PDF to the model as is) to the AI parse endpoint and
 * opens the create form of the type the backend recognised — issued or
 * received — regardless of which list the button was pressed on.
 */
export const UploadInvoiceButton = ({
  variant = 'outline',
  size,
  className,
}: UploadInvoiceButtonProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { mutate: parseInvoice, isPending } = useDocumentParseInvoice({
    mutation: {
      onSuccess: (response) => {
        const { data, llmCalls } = response.data;
        const isIssued = data.type === ParsedInvoiceType.ISSUED;
        enqueueSnackbar(
          t(
            isIssued
              ? 'invoiceUpload.successIssued'
              : 'invoiceUpload.successReceived',
          ),
          { variant: 'success' },
        );
        const state: ParsedInvoiceState = { parsedInvoice: data, llmCalls };
        navigate(
          isIssued ? '/invoices/create' : '/invoices/create?type=received',
          { state },
        );
      },
      onError: () => {
        enqueueSnackbar(t('invoiceUpload.error'), { variant: 'error' });
      },
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Allow re-selecting the same file after an error.
    event.target.value = '';
    if (!file) return;
    parseInvoice({ data: { file } });
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn('gap-2', className)}
        disabled={isPending}
        onClick={() => inputRef.current?.click()}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ScanText className="h-4 w-4" />
        )}
        {isPending ? t('invoiceUpload.processing') : t('invoiceUpload.button')}
      </Button>
    </>
  );
};
