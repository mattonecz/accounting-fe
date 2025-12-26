import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

// Mock data - in real app this would come from API
const getInvoiceById = (id: string) => ({
  id: id,
  number: "INV-2024-001",
  type: "INCOMING",
  client: {
    name: "Acme Corp",
    address: "123 Business Street",
    city: "New York, NY 10001",
    taxId: "US123456789",
  },
  company: {
    name: "Your Company Name",
    address: "456 Company Avenue",
    city: "San Francisco, CA 94102",
    email: "billing@yourcompany.com",
    phone: "+1 (555) 123-4567",
    taxId: "US987654321",
  },
  bank: {
    name: "Bank of America",
    accountNumber: "1234567890",
    iban: "US12 3456 7890 1234 5678 90",
    swift: "BOFAUS3N",
  },
  createdDate: "2024-01-15",
  taxDate: "2024-01-15",
  dueDate: "2024-02-15",
  status: "Paid",
  currency: "USD",
  items: [
    {
      description: "Web Development Services",
      quantity: 40,
      unitPrice: 100,
      taxRate: 10,
      total: 4000,
      totalTax: 400,
      totalWithTax: 4400,
    },
    {
      description: "UI/UX Design",
      quantity: 20,
      unitPrice: 80,
      taxRate: 10,
      total: 1600,
      totalTax: 160,
      totalWithTax: 1760,
    },
  ],
  total: 5600,
  totalTax: 560,
  totalWithTax: 6160,
  notes: "Payment due within 30 days. Thank you for your business.",
});

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const invoice = getInvoiceById(id || "");

  const handlePrint = () => {
    window.print();
  };

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
    <div className="min-h-screen bg-muted/30">
      {/* Action Bar - Hidden on print */}
      <div className="print:hidden bg-background border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="default" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* A4 Invoice Container */}
      <div className="flex justify-center py-8 print:p-0">
        <div className="w-[210mm] min-h-[297mm] bg-background shadow-lg print:shadow-none print:w-full">
          <div className="p-16 print:p-16">
            {/* Header */}
            <div className="flex justify-between items-start mb-12 pb-8 border-b-2 border-border">
              <div>
                <h1 className="text-5xl font-bold mb-3">INVOICE</h1>
                <p className="text-lg font-mono text-muted-foreground">{invoice.number}</p>
                <Badge variant={getStatusVariant(invoice.status)} className="mt-2 print:border print:border-current">
                  {invoice.status}
                </Badge>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold mb-3">{invoice.company.name}</h2>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{invoice.company.address}</p>
                  <p>{invoice.company.city}</p>
                  <p className="mt-3">{invoice.company.email}</p>
                  <p>{invoice.company.phone}</p>
                  <p className="mt-2">Tax ID: {invoice.company.taxId}</p>
                </div>
              </div>
            </div>

            {/* Invoice & Client Info */}
            <div className="grid grid-cols-2 gap-12 mb-12">
              <div>
                <h3 className="text-xs font-bold text-muted-foreground mb-3 tracking-wider">BILL TO</h3>
                <p className="font-bold text-lg mb-2">{invoice.client.name}</p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{invoice.client.address}</p>
                  <p>{invoice.client.city}</p>
                  <p className="mt-2">Tax ID: {invoice.client.taxId}</p>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-muted-foreground mb-3 tracking-wider">INVOICE DETAILS</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Issue Date:</span>
                    <span className="font-semibold">{invoice.createdDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax Date:</span>
                    <span className="font-semibold">{invoice.taxDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Due Date:</span>
                    <span className="font-semibold">{invoice.dueDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-12">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/30 print:bg-muted/50">
                    <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground tracking-wider">DESCRIPTION</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-muted-foreground tracking-wider">QTY</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-muted-foreground tracking-wider">RATE</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-muted-foreground tracking-wider">TAX</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-muted-foreground tracking-wider">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="border-b border-border">
                      <td className="py-4 px-4">{item.description}</td>
                      <td className="py-4 px-4 text-right">{item.quantity}</td>
                      <td className="py-4 px-4 text-right">{invoice.currency} {item.unitPrice.toFixed(2)}</td>
                      <td className="py-4 px-4 text-right">{item.taxRate}%</td>
                      <td className="py-4 px-4 text-right font-semibold">
                        {invoice.currency} {item.totalWithTax.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-12">
              <div className="w-80">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-semibold">{invoice.currency} {invoice.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-muted-foreground">Tax:</span>
                    <span className="font-semibold">{invoice.currency} {invoice.totalTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-4 border-t-2 border-border">
                    <span className="text-xl font-bold">Total:</span>
                    <span className="text-xl font-bold">{invoice.currency} {invoice.totalWithTax.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="mb-12 p-6 bg-muted/30 rounded print:bg-muted/50">
              <h3 className="text-xs font-bold text-muted-foreground mb-4 tracking-wider">PAYMENT DETAILS</h3>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Bank Name</p>
                  <p className="font-semibold">{invoice.bank.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Account Number</p>
                  <p className="font-mono font-semibold">{invoice.bank.accountNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">IBAN</p>
                  <p className="font-mono font-semibold">{invoice.bank.iban}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">SWIFT/BIC</p>
                  <p className="font-mono font-semibold">{invoice.bank.swift}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mb-8">
                <h3 className="text-xs font-bold text-muted-foreground mb-2 tracking-wider">NOTES</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{invoice.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-sm text-muted-foreground pt-8 border-t border-border">
              <p>Thank you for your business!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;
