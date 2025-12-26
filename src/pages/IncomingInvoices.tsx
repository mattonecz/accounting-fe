import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function IncomingInvoices() {
  const navigate = useNavigate();
  const invoices = [
    {
      id: "INV-001",
      client: "Acme Corp",
      amount: "$5,200",
      date: "2024-01-15",
      dueDate: "2024-02-15",
      status: "Paid",
    },
    {
      id: "INV-002",
      client: "TechStart Inc",
      amount: "$3,500",
      date: "2024-01-10",
      dueDate: "2024-02-10",
      status: "Pending",
    },
    {
      id: "INV-003",
      client: "Design Studio",
      amount: "$2,800",
      date: "2024-01-05",
      dueDate: "2024-02-05",
      status: "Paid",
    },
    {
      id: "INV-004",
      client: "Startup Labs",
      amount: "$4,100",
      date: "2024-01-01",
      dueDate: "2024-02-01",
      status: "Overdue",
    },
  ];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Paid":
        return "default";
      case "Pending":
        return "secondary";
      case "Overdue":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Incoming Invoices</h1>
          <p className="mt-2 text-muted-foreground">Track invoices from your clients</p>
        </div>
        <Button className="gap-2" onClick={() => navigate("/invoices/create")}>
          <Plus className="h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow 
                  key={invoice.id} 
                  className="cursor-pointer hover:bg-secondary/50"
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                >
                  <TableCell className="font-mono font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.client}</TableCell>
                  <TableCell className="font-semibold text-success">{invoice.amount}</TableCell>
                  <TableCell className="text-muted-foreground">{invoice.date}</TableCell>
                  <TableCell className="text-muted-foreground">{invoice.dueDate}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(invoice.status)}>{invoice.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/invoices/${invoice.id}`);
                      }}
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
