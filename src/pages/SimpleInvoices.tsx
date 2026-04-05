import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { enqueueSnackbar } from "notistack";

const simpleInvoiceSchema = z.object({
  number: z.string().min(1, "Invoice number is required"),
  createdDate: z.string().min(1, "Created date is required"),
  taxDate: z.string().min(1, "Tax date is required"),
  total: z.string().min(1, "Total is required"),
  totalTax: z.string().min(1, "Total tax is required"),
  totalWithTax: z.string().min(1, "Total with tax is required"),
  description: z.string().optional(),
  companyId: z.string().min(1, "Company is required"),
});

type SimpleInvoiceForm = z.infer<typeof simpleInvoiceSchema>;

const SimpleInvoices = () => {
  const [open, setOpen] = useState(false);

  const form = useForm<SimpleInvoiceForm>({
    resolver: zodResolver(simpleInvoiceSchema),
    defaultValues: {
      number: "",
      createdDate: new Date().toISOString().split("T")[0],
      taxDate: new Date().toISOString().split("T")[0],
      total: "",
      totalTax: "",
      totalWithTax: "",
      description: "",
      companyId: "",
    },
  });

  // Mock data - will be replaced with actual backend data
  const invoices = [
    {
      id: "1",
      number: "SI-2024-001",
      createdDate: "2024-01-15",
      taxDate: "2024-01-15",
      total: 1000.0,
      totalTax: 210.0,
      totalWithTax: 1210.0,
      description: "Consulting services",
      company: { name: "Tech Corp" },
    },
    {
      id: "2",
      number: "SI-2024-002",
      createdDate: "2024-01-20",
      taxDate: "2024-01-20",
      total: 2500.0,
      totalTax: 525.0,
      totalWithTax: 3025.0,
      description: "Software development",
      company: { name: "Digital Solutions" },
    },
  ];

  // Mock companies - will be replaced with actual backend data
  const companies = [
    { id: "1", name: "Tech Corp" },
    { id: "2", name: "Digital Solutions" },
    { id: "3", name: "Global Industries" },
  ];

  const onSubmit = (data: SimpleInvoiceForm) => {
    console.log("Creating simple invoice:", data);
    enqueueSnackbar("Simple invoice created successfully", { variant: "success" });
    setOpen(false);
    form.reset();
  };

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Simple Invoices
          </h1>
          <p className="mt-2 text-muted-foreground">
            Create and manage simplified invoices
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Simple Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Simple Invoice</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="SI-2024-001" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <option value="">Select company</option>
                            {companies.map((company) => (
                              <option key={company.id} value={company.id}>
                                {company.name}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="createdDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Created Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="taxDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="total"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} placeholder="0.00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="totalTax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Tax</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} placeholder="0.00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="totalWithTax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total with Tax</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} placeholder="0.00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Enter description..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Invoice</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Simple Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice Number</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Tax Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Total Tax</TableHead>
                <TableHead className="text-right">Total with Tax</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.number}</TableCell>
                  <TableCell>{invoice.company.name}</TableCell>
                  <TableCell>{invoice.createdDate}</TableCell>
                  <TableCell>{invoice.taxDate}</TableCell>
                  <TableCell className="text-right">
                    ${invoice.total.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    ${invoice.totalTax.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    ${invoice.totalWithTax.toFixed(2)}
                  </TableCell>
                  <TableCell>{invoice.description || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleInvoices;
