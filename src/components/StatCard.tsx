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
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-sm font-medium text-muted-foreground">{title}</p>
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
              variantStyles[variant].container,
            )}
          >
            <Icon className={cn("h-4 w-4", variantStyles[variant].icon)} />
          </div>
        </div>
        <p className="mt-3 text-2xl font-bold leading-tight tracking-tight text-foreground tabular-nums">
          {value}
        </p>
        {trend && (
          <p className="mt-1.5 text-xs font-medium text-muted-foreground">{trend}</p>
        )}
      </CardContent>
    </Card>
  );
};
