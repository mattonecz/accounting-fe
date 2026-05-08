import { InvoiceResponseDtoStatus } from '@/api/model';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  FileText,
  Pencil,
  XCircle,
} from 'lucide-react';

type InvoiceStatusBadgeProps = {
  status: InvoiceResponseDtoStatus;
  className?: string;
};

const statusConfig: Record<InvoiceResponseDtoStatus, {
  label: string;
  className: string;
  icon: typeof Pencil;
}> = {
  [InvoiceResponseDtoStatus.DRAFT]: {
    label: 'Koncept',
    className: 'border-slate-200 bg-slate-100 text-slate-700',
    icon: Pencil,
  },
  [InvoiceResponseDtoStatus.ISSUED]: {
    label: 'Vystavena',
    className: 'border-sky-200 bg-sky-100 text-sky-700',
    icon: FileText,
  },
[InvoiceResponseDtoStatus.PAID]: {
    label: 'Uhrazena',
    className: 'border-emerald-200 bg-emerald-100 text-emerald-700',
    icon: CheckCircle2,
  },
  [InvoiceResponseDtoStatus.CANCELLED]: {
    label: 'Zrusena',
    className: 'border-rose-200 bg-rose-100 text-rose-700',
    icon: XCircle,
  },
};

export function InvoiceStatusBadge({
  status,
  className,
}: InvoiceStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn('gap-1.5', config.className, className)}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{config.label}</span>
    </Badge>
  );
}