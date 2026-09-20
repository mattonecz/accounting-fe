import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  /** Shown instead of the confirm button when the action is not allowed. */
  blockedReason?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  isPending?: boolean;
  onConfirm: () => void;
}

/**
 * Single confirmation step for destructive or irreversible actions (deletes,
 * cancelling a filing, sending a filing to the tax office).
 */
export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  blockedReason,
  confirmLabel,
  cancelLabel,
  destructive = false,
  isPending = false,
  onConfirm,
}: ConfirmDialogProps) => {
  const { t } = useTranslation();
  const isBlocked = !!blockedReason;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent onClick={(event) => event.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <div>{description}</div>
              {isBlocked && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {blockedReason}
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {cancelLabel ?? t('common.cancel')}
          </AlertDialogCancel>
          {!isBlocked && (
            <AlertDialogAction
              disabled={isPending}
              className={cn(
                'gap-2',
                destructive &&
                  'bg-destructive text-destructive-foreground hover:bg-destructive/90',
              )}
              onClick={(event) => {
                // Keep the dialog mounted while the request is in flight; the
                // caller closes it once the mutation settles.
                event.preventDefault();
                onConfirm();
              }}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {confirmLabel ?? t('common.confirm')}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
