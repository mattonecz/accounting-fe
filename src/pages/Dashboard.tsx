import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Users, FileText } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="flex-1 space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Welcome back! Here's your financial overview.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Income"
          value="$45,231"
          icon={TrendingUp}
          trend="+12% from last month"
          variant="success"
        />
        <StatCard
          title="Total Expenses"
          value="$12,456"
          icon={TrendingDown}
          trend="+4% from last month"
          variant="warning"
        />
        <StatCard
          title="Net Balance"
          value="$32,775"
          icon={DollarSign}
          trend="+8% from last month"
          variant="default"
        />
        <StatCard
          title="Active Clients"
          value="24"
          icon={Users}
          trend="2 new this month"
          variant="default"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-success" />
              Recent Incoming Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { client: "Acme Corp", amount: "$5,200", status: "Paid", date: "2024-01-15" },
                { client: "TechStart Inc", amount: "$3,500", status: "Pending", date: "2024-01-10" },
                { client: "Design Studio", amount: "$2,800", status: "Paid", date: "2024-01-05" },
              ].map((invoice, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium text-foreground">{invoice.client}</p>
                    <p className="text-sm text-muted-foreground">{invoice.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-success">{invoice.amount}</p>
                    <p className="text-xs text-muted-foreground">{invoice.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-warning" />
              Recent Outgoing Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { vendor: "Software Licenses", amount: "$299", status: "Paid", date: "2024-01-12" },
                { vendor: "Office Supplies", amount: "$156", status: "Pending", date: "2024-01-08" },
                { vendor: "Cloud Services", amount: "$89", status: "Paid", date: "2024-01-01" },
              ].map((invoice, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium text-foreground">{invoice.vendor}</p>
                    <p className="text-sm text-muted-foreground">{invoice.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-warning">{invoice.amount}</p>
                    <p className="text-xs text-muted-foreground">{invoice.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
