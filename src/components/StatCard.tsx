import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "success" | "warning" | "destructive";
}

export const StatCard = ({ title, value, icon: Icon, trend, variant = "default" }: StatCardProps) => {
  const variantStyles = {
    default: {
      icon: "text-primary",
      container: "bg-primary/10 ring-primary/10",
    },
    success: {
      icon: "text-success",
      container: "bg-success/10 ring-success/10",
    },
    warning: {
      icon: "text-warning",
      container: "bg-warning/10 ring-warning/10",
    },
    destructive: {
      icon: "text-destructive",
      container: "bg-destructive/10 ring-destructive/10",
    },
  };

  return (
    <Card className="border-border/60 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-3 whitespace-nowrap text-[clamp(1.875rem,2.6vw,2.5rem)] font-bold leading-none tracking-tight text-foreground">
              {value}
            </p>
            {trend && <p className="mt-2 text-xs font-medium text-muted-foreground">{trend}</p>}
          </div>
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1",
              variantStyles[variant].container,
            )}
          >
            <Icon className={cn("h-5 w-5", variantStyles[variant].icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
