import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/StatCard";
import { TrendingDown, TrendingUp, Calculator, ChevronLeft, ChevronRight } from "lucide-react";

// Mock data - replace with real data from your backend
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const generateMockInvoices = (year: number, month: number, isIncoming: boolean) => {
  const count = Math.floor(Math.random() * 8) + 3;
  return Array.from({ length: count }, (_, i) => ({
    id: `${isIncoming ? 'IN' : 'OUT'}-${year}-${month}-${i + 1}`,
    number: `INV-${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`,
    company: `Company ${i + 1}`,
    date: `${year}-${String(month + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    total: parseFloat((Math.random() * 5000 + 500).toFixed(2)),
    vat: parseFloat((Math.random() * 1000 + 100).toFixed(2)),
  }));
};

const TaxReport = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
  
  const incomingInvoices = generateMockInvoices(parseInt(selectedYear), selectedMonth, true);
  const outgoingInvoices = generateMockInvoices(parseInt(selectedYear), selectedMonth, false);
  
  const totalIncomingVAT = incomingInvoices.reduce((sum, inv) => sum + inv.vat, 0);
  const totalOutgoingVAT = outgoingInvoices.reduce((sum, inv) => sum + inv.vat, 0);
  const netVAT = totalOutgoingVAT - totalIncomingVAT;

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((parseInt(selectedYear) - 1).toString());
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((parseInt(selectedYear) + 1).toString());
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">VAT Tax Report</h2>
          <p className="text-muted-foreground">Monthly VAT breakdown</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-lg font-semibold min-w-[180px] text-center">
              {months[selectedMonth]} {selectedYear}
            </div>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Incoming VAT"
          value={`$${totalIncomingVAT.toFixed(2)}`}
          icon={TrendingDown}
          trend={`${incomingInvoices.length} invoices`}
          variant="default"
        />
        <StatCard
          title="Outgoing VAT"
          value={`$${totalOutgoingVAT.toFixed(2)}`}
          icon={TrendingUp}
          trend={`${outgoingInvoices.length} invoices`}
          variant="default"
        />
        <StatCard
          title="Net VAT Payable"
          value={`$${Math.abs(netVAT).toFixed(2)}`}
          icon={Calculator}
          trend={netVAT >= 0 ? "Amount to pay" : "Amount to reclaim"}
          variant={netVAT >= 0 ? "destructive" : "success"}
        />
      </div>

      <div className="space-y-4">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Incoming Invoices</h3>
            <span className="text-sm text-muted-foreground">{incomingInvoices.length} invoices</span>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">VAT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomingInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.number}</TableCell>
                    <TableCell>{invoice.company}</TableCell>
                    <TableCell className="text-muted-foreground">{invoice.date}</TableCell>
                    <TableCell className="text-right">${invoice.total.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">${invoice.vat.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={3}>Total</TableCell>
                  <TableCell className="text-right">
                    ${incomingInvoices.reduce((sum, inv) => sum + inv.total, 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">${totalIncomingVAT.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Outgoing Invoices</h3>
            <span className="text-sm text-muted-foreground">{outgoingInvoices.length} invoices</span>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">VAT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outgoingInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.number}</TableCell>
                    <TableCell>{invoice.company}</TableCell>
                    <TableCell className="text-muted-foreground">{invoice.date}</TableCell>
                    <TableCell className="text-right">${invoice.total.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">${invoice.vat.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={3}>Total</TableCell>
                  <TableCell className="text-right">
                    ${outgoingInvoices.reduce((sum, inv) => sum + inv.total, 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">${totalOutgoingVAT.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-muted/30">
        <h3 className="text-lg font-semibold mb-3">VAT Report Notes</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• <strong>Incoming VAT:</strong> Tax paid on purchases and expenses (deductible)</li>
          <li>• <strong>Outgoing VAT:</strong> Tax collected on sales and services (payable to tax authority)</li>
          <li>• <strong>Net VAT:</strong> Difference between outgoing and incoming VAT (positive = amount to pay, negative = amount to reclaim)</li>
          <li>• Report data is based on invoice tax dates within the selected fiscal year</li>
        </ul>
      </Card>
    </div>
  );
};

export default TaxReport;
