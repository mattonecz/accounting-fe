import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { Loader2, Sparkles } from 'lucide-react';
import { useDocumentParseReceipt } from '@/api/documents/documents';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type UploadReceiptButtonProps = Pick<
  ButtonProps,
  'variant' | 'size' | 'className'
>;

/**
 * Opens a file picker, sends the receipt image to the AI parse endpoint and
 * navigates to the simple-invoice form prefilled with the extracted data.
 */
export const UploadReceiptButton = ({
  variant = 'outline',
  size,
  className,
}: UploadReceiptButtonProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { mutate: parseReceipt, isPending } = useDocumentParseReceipt({
    mutation: {
      onSuccess: (response) => {
        enqueueSnackbar(t('receiptUpload.success'), { variant: 'success' });
        navigate('/invoices/simple/create', {
          state: { receipt: response.data.data },
        });
      },
      onError: () => {
        enqueueSnackbar(t('receiptUpload.error'), { variant: 'error' });
      },
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Allow re-selecting the same file after an error.
    event.target.value = '';
    if (!file) return;
    parseReceipt({ data: { file } });
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn('gap-1.5', className)}
        disabled={isPending}
        onClick={() => inputRef.current?.click()}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {isPending
          ? t('receiptUpload.processing')
          : t('receiptUpload.button')}
      </Button>
    </>
  );
};
