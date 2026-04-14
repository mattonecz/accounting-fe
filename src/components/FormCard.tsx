import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FormCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  actions?: React.ReactNode;
}

export const FormCard = ({
  title,
  children,
  className,
  titleClassName,
  actions,
}: FormCardProps) => (
  <Card className={cn('p-6', className)}>
    <div
      className={cn(
        'mb-6',
        actions ? 'flex items-center justify-between' : '',
      )}
    >
      <h3 className={cn('text-lg font-semibold', titleClassName)}>{title}</h3>
      {actions}
    </div>
    {children}
  </Card>
);
