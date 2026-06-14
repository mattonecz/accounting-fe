import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Tiny uppercase "annotation" label used to head every section — the quiet
// mono-ish labels from the wireframe, mapped onto the design-F tokens.
export const annoClass =
  'text-[10px] font-semibold uppercase tracking-wider text-muted-foreground';

export const SectionLabel = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => <p className={cn(annoClass, className)}>{children}</p>;

// Quiet card surface shared by every block on the detail page.
export const DetailCard = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => (
  <div
    className={cn(
      'rounded-xl border border-border/60 bg-card p-5 shadow-sm',
      className,
    )}
  >
    {children}
  </div>
);

// Label + value pair used in the meta / customer grids. An optional `sub`
// line sits quietly beneath the value (e.g. the bank name under an account).
export const MetaField = ({
  label,
  value,
  mono,
  sub,
}: {
  label: ReactNode;
  value: ReactNode;
  mono?: boolean;
  sub?: ReactNode;
}) => (
  <div>
    <div className="text-[11px] text-muted-foreground">{label}</div>
    <div
      className={cn(
        'mt-0.5 text-sm font-medium text-foreground',
        mono && 'tabular-nums',
      )}
    >
      {value || '-'}
    </div>
    {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
  </div>
);
