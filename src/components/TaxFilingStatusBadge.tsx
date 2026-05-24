import { useTranslation } from 'react-i18next';
import { TaxFilingResponseDtoStatus } from '@/api/model';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Ban, CheckCircle2, Loader2, Send, XCircle } from 'lucide-react';

type TaxFilingStatusBadgeProps = {
  status: TaxFilingResponseDtoStatus;
  className?: string;
};

const statusStyles: Record<
  TaxFilingResponseDtoStatus,
  { className: string; icon: typeof Ban }
> = {
  [TaxFilingResponseDtoStatus.PROCESSING]: {
    className: 'border-amber-200 bg-amber-100 text-amber-700',
    icon: Loader2,
  },
  [TaxFilingResponseDtoStatus.READY]: {
    className: 'border-emerald-200 bg-emerald-100 text-emerald-700',
    icon: CheckCircle2,
  },
  [TaxFilingResponseDtoStatus.FAILED]: {
    className: 'border-rose-200 bg-rose-100 text-rose-700',
    icon: XCircle,
  },
  [TaxFilingResponseDtoStatus.SUBMITTED]: {
    className: 'border-sky-200 bg-sky-100 text-sky-700',
    icon: Send,
  },
  [TaxFilingResponseDtoStatus.CANCELLED]: {
    className: 'border-slate-200 bg-slate-100 text-slate-700',
    icon: Ban,
  },
};

export function TaxFilingStatusBadge({
  status,
  className,
}: TaxFilingStatusBadgeProps) {
  const { t } = useTranslation();
  const config = statusStyles[status];
  const Icon = config?.icon ?? Loader2;

  return (
    <Badge variant="outline" className={cn('gap-1.5', config?.className, className)}>
      <Icon
        className={cn(
          'h-3.5 w-3.5',
          status === TaxFilingResponseDtoStatus.PROCESSING && 'animate-spin',
        )}
      />
      <span>{t(`taxFilings.statuses.${status}`, status)}</span>
    </Badge>
  );
}
