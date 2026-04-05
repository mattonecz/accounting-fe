import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInvoiceGetStats } from "@/api/invoices/invoices";
import type { DashboardInvoiceItemDto } from "@/api/model";
import { ArrowUpRight, ArrowDownRight, Scale, FileText } from "lucide-react";

const formatSummaryCurrency = (amount: number, currency = "USD") => {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatCurrency = (amount: number, currency = "USD") => {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercentChange = (value: number) => {
  const sign = value > 0 ? "+" : "";
  return `${sign}${Math.round(value)}% from last month`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString();
};

const getStatusLabel = (status: DashboardInvoiceItemDto["status"]) => {
  if (status === "PAID") {
    return "Paid";
  }

  return "Pending";
};

export default function Dashboard() {
  const { data, isLoading, isError } = useInvoiceGetStats();
  const stats = data?.data;

  const summaryCurrency =
    stats?.recentIncomingInvoices?.[0]?.currency ??
    stats?.recentOutgoingInvoices?.[0]?.currency ??
    "USD";

  const summary = stats?.summary;

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Welcome back! Here's your financial overview.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Income"
          value={formatSummaryCurrency(summary?.totalIncome ?? 0, summaryCurrency)}
          icon={ArrowUpRight}
          trend={summary ? formatPercentChange(summary.incomeChangePct) : undefined}
          variant="success"
        />
        <StatCard
          title="Total Expenses"
          value={formatSummaryCurrency(summary?.totalExpenses ?? 0, summaryCurrency)}
          icon={ArrowDownRight}
          trend={summary ? formatPercentChange(summary.expenseChangePct) : undefined}
          variant="warning"
        />
        <StatCard
          title="Net Balance"
          value={formatSummaryCurrency(summary?.netBalance ?? 0, summaryCurrency)}
          icon={Scale}
          trend={summary ? formatPercentChange(summary.netChangePct) : undefined}
          variant="default"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-success" />
              Recent Incoming Invoices
            </CardTitle>
            <p className="text-sm text-muted-foreground">Latest invoices you received.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!isLoading && !isError && stats?.recentIncomingInvoices?.length ? (
                stats.recentIncomingInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-foreground">{invoice.companyName}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(invoice.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-success">
                        {formatCurrency(invoice.amount, invoice.currency || summaryCurrency)}
                      </p>
                      <p className="text-xs text-muted-foreground">{getStatusLabel(invoice.status)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isLoading
                    ? "Loading incoming invoices..."
                    : isError
                      ? "Unable to load incoming invoices."
                      : "No incoming invoices yet."}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-warning" />
              Recent Outgoing Invoices
            </CardTitle>
            <p className="text-sm text-muted-foreground">Latest invoices you issued.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!isLoading && !isError && stats?.recentOutgoingInvoices?.length ? (
                stats.recentOutgoingInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-foreground">{invoice.companyName}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(invoice.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-warning">
                        {formatCurrency(invoice.amount, invoice.currency || summaryCurrency)}
                      </p>
                      <p className="text-xs text-muted-foreground">{getStatusLabel(invoice.status)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isLoading
                    ? "Loading outgoing invoices..."
                    : isError
                      ? "Unable to load outgoing invoices."
                      : "No outgoing invoices yet."}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
