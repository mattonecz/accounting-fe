import { useTranslation } from 'react-i18next';
import { DataMessageDtoState } from '@/api/model';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle2, HelpCircle, PackageCheck, Send, XCircle } from 'lucide-react';

type DataMessageStatusBadgeProps = {
  state: DataMessageDtoState;
  className?: string;
};

const stateStyles: Record<
  DataMessageDtoState,
  { className: string; icon: typeof Send }
> = {
  [DataMessageDtoState.SENT]: {
    className: 'border-sky-200 bg-sky-100 text-sky-700',
    icon: Send,
  },
  [DataMessageDtoState.SERVED]: {
    className: 'border-amber-200 bg-amber-100 text-amber-700',
    icon: PackageCheck,
  },
  [DataMessageDtoState.DELIVERED]: {
    className: 'border-emerald-200 bg-emerald-100 text-emerald-700',
    icon: CheckCircle2,
  },
  [DataMessageDtoState.FAILED]: {
    className: 'border-rose-200 bg-rose-100 text-rose-700',
    icon: XCircle,
  },
  [DataMessageDtoState.UNKNOWN]: {
    className: 'border-slate-200 bg-slate-100 text-slate-700',
    icon: HelpCircle,
  },
};

export function DataMessageStatusBadge({
  state,
  className,
}: DataMessageStatusBadgeProps) {
  const { t } = useTranslation();
  const config = stateStyles[state];
  const Icon = config?.icon ?? HelpCircle;

  return (
    <Badge variant="outline" className={cn('gap-1.5', config?.className, className)}>
      <Icon className="h-3.5 w-3.5" />
      <span>{t(`dataMessages.states.${state}`, state)}</span>
    </Badge>
  );
}
