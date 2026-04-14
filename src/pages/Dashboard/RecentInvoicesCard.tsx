import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import type { DashboardInvoiceItemDto } from '@/api/model';

const formatCurrency = (amount: number, currency = 'USD') =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString();
};

const getStatusLabel = (status: DashboardInvoiceItemDto['status']) =>
  status === 'PAID' ? 'Paid' : 'Pending';

interface RecentInvoicesCardProps {
  title: string;
  description: string;
  invoices: DashboardInvoiceItemDto[] | undefined;
  isLoading: boolean;
  isError: boolean;
  fallbackCurrency: string;
  variant: 'success' | 'warning';
}

export const RecentInvoicesCard = ({
  title,
  description,
  invoices,
  isLoading,
  isError,
  fallbackCurrency,
  variant,
}: RecentInvoicesCardProps) => {
  const iconColor = variant === 'success' ? 'text-success' : 'text-warning';
  const amountColor = variant === 'success' ? 'text-success' : 'text-warning';

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2">
          <FileText className={`h-5 w-5 ${iconColor}`} />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!isLoading && !isError && invoices?.length ? (
            invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {invoice.companyName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(invoice.date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${amountColor}`}>
                    {formatCurrency(
                      invoice.amount,
                      invoice.currency || fallbackCurrency,
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getStatusLabel(invoice.status)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              {isLoading
                ? `Loading ${title.toLowerCase()}...`
                : isError
                  ? `Unable to load ${title.toLowerCase()}.`
                  : `No ${title.toLowerCase()} yet.`}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
