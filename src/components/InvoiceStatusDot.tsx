import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { InvoiceDisplayStatus } from '@/lib/invoiceStatus';

type InvoiceStatusDotProps = {
  status: InvoiceDisplayStatus;
  className?: string;
};

const statusStyles: Record<InvoiceDisplayStatus, { dot: string; text: string }> = {
  PAID: { dot: 'bg-success', text: 'text-success' },
  ISSUED: { dot: 'bg-muted-foreground', text: 'text-muted-foreground' },
  OVERDUE: { dot: 'bg-destructive', text: 'text-destructive' },
  DRAFT: { dot: 'bg-muted-foreground/50', text: 'text-muted-foreground' },
  CANCELLED: { dot: 'bg-muted-foreground/50', text: 'text-muted-foreground' },
};

/** Quiet status indicator — a small coloured dot + label, no background fill. */
export function InvoiceStatusDot({ status, className }: InvoiceStatusDotProps) {
  const { t } = useTranslation();
  const style = statusStyles[status] ?? statusStyles.ISSUED;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-xs font-medium',
        style.text,
        status === 'CANCELLED' && 'line-through',
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', style.dot)} />
      {t(`invoices.statuses.${status}`, status)}
    </span>
  );
}
