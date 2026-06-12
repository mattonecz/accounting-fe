import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const PageLayout = ({ children, className }: PageLayoutProps) => (
  <div className="flex-1 p-4 md:p-8">
    <div className={cn('mx-auto w-full max-w-[1280px] space-y-6', className)}>
      {children}
    </div>
  </div>
);
