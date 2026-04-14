import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const PageLayout = ({ children, className }: PageLayoutProps) => (
  <div className={cn('flex-1 space-y-6 p-4 md:p-8', className)}>
    {children}
  </div>
);
