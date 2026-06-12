import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QueueItemAction {
  label: string;
  primary?: boolean;
}

interface QueueItemProps {
  tag: string;
  tagClassName: string;
  title: string;
  meta: string;
  actions: QueueItemAction[];
}

export const QueueItem = ({ tag, tagClassName, title, meta, actions }: QueueItemProps) => (
  <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-3 last:border-b-0">
    <div className="min-w-0">
      <span
        className={cn(
          'text-[10px] font-semibold uppercase tracking-wider',
          tagClassName,
        )}
      >
        {tag}
      </span>
      <p className="truncate text-sm font-medium text-foreground">{title}</p>
      <p className="truncate text-xs text-muted-foreground">{meta}</p>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      {actions.map((action) => (
        <Button
          key={action.label}
          size="sm"
          variant={action.primary ? 'default' : 'ghost'}
          className="h-7 px-2.5 text-xs"
        >
          {action.label}
        </Button>
      ))}
    </div>
  </div>
);
