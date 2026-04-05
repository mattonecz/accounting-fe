import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useInvoiceListByUser } from "@/api/invoices/invoices";
import { InvoiceListByUserType } from "@/api/model/invoiceListByUserType";

export default function IncomingInvoices() {
  const navigate = useNavigate();
  const invoices = useInvoiceListByUser({ type: InvoiceListByUserType.INCOMING });

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Incoming Invoices</h1>
          <p className="mt-2 text-muted-foreground">Track incoming invoices</p>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.data?.data?.data?.map((invoice) => (
                <TableRow 
                  key={invoice.id} 
                  className="cursor-pointer hover:bg-secondary/50"
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                >
                  <TableCell className="font-mono font-medium">{invoice.number}</TableCell>
                  <TableCell>{invoice.company?.name}</TableCell>
                  <TableCell className="font-semibold text-success">{invoice.total}</TableCell>
                  <TableCell className="text-muted-foreground">{invoice.createdDate}</TableCell>
                  <TableCell className="text-muted-foreground">{invoice.dueDate}</TableCell>
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
              {!invoices.isLoading && !invoices.isError && !invoices.data?.data?.data?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No incoming invoices found.
                  </TableCell>
                </TableRow>
              )}
              {invoices.isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Loading invoices...
                  </TableCell>
                </TableRow>
              )}
              {invoices.isError && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-destructive">
                    Failed to load invoices.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
