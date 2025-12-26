import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { CreateInvoiceDto } from '@/api/model';
import { useCompanyListByUser } from '@/api/companies/companies';
import { useBankListByUser } from '@/api/bank/bank';
import { useInvoiceGetCount } from '@/api/invoices/invoices';
import { InputController } from '@/components/InputController';

const CreateInvoice = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { data: companies } = useCompanyListByUser();
  const { data: banks } = useBankListByUser();
  const { data: invoiceNumber } = useInvoiceGetCount();

  const form = useForm<CreateInvoiceDto>({
    defaultValues: {
      type: 'OUTGOING',
      currency: 'CZK',
      createdDate: new Date().toISOString().split('T')[0],
      taxDate: new Date().toISOString().split('T')[0],
      dueDate: (() => {
        const date = new Date();
        date.setDate(date.getDate() + 14);
        return date.toISOString().split('T')[0];
      })(),
      items: [{ name: '', amount: 1, pricePerUnit: 0, vat: 21, units: 1 }],
    },
  });

  useEffect(() => {
    if (invoiceNumber?.data !== undefined) {
      const year = new Date().getFullYear();
      const number = invoiceNumber.data + 1;
      const formattedNumber = `${year}${String(number).padStart(4, '0')}`;
      form.setValue('number', formattedNumber);
    }
  }, [invoiceNumber, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const calculateItemTotals = (index: number) => {
    const items = form.getValues('items');
    const item = items[index];
    const total = item.amount * item.pricePerUnit;
    const totalTax = total * (item.vat / 100);
    const totalWithTax = total + totalTax;

    calculateInvoiceTotals();
  };

  const calculateInvoiceTotals = () => {
    const items = form.getValues('items');
    const total = items.reduce((sum, item) => sum + (item.total || 0), 0);
    const totalTax = items.reduce((sum, item) => sum + (item.totalTax || 0), 0);
    const totalWithTax = items.reduce(
      (sum, item) => sum + (item.totalWithTax || 0),
      0,
    );

    form.setValue('total', total);
    form.setValue('totalTax', totalTax);
    form.setValue('totalWithTax', totalWithTax);
  };

  const onSubmit = (data: CreateInvoiceDto) => {
    console.log('Invoice data:', data);
    enqueueSnackbar('Invoice created successfully', { variant: 'success' });
    navigate('/outgoing-invoices');
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Create Invoice</h2>
          <p className="text-muted-foreground">
            Fill in the details to create a new invoice
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6 text-center">
              Basic Information
            </h3>
            <div className="max-w-3xl mx-auto space-y-4">
              <InputController
                control={form.control}
                name="number"
                label="Invoice Number"
                placeholder="20250001"
                rules={{ required: 'Invoice number is required' }}
              />
              <FormField
                control={form.control}
                name="companyId"
                rules={{ required: 'Company is required' }}
                render={({ field }) => (
                  <FormItem className="flex items-center gap-4">
                    <FormLabel className="w-[200px] text-right">
                      Company
                    </FormLabel>
                    <div className="flex flex-col">
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-[350px]">
                            <SelectValue placeholder="Select company" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companies?.data?.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bankId"
                rules={{ required: 'Bank account is required' }}
                render={({ field }) => (
                  <FormItem className="flex items-center gap-4">
                    <FormLabel className="w-[200px] text-right">
                      Bank Account
                    </FormLabel>
                    <div className="flex flex-col">
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-[400px]">
                            <SelectValue placeholder="Select bank account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {banks?.data?.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-4">
                    <FormLabel className="w-[200px] text-right">
                      Currency
                    </FormLabel>
                    <div className="flex flex-col">
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="CZK">
                            CZK - Czech Koruna
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="exchangeRate"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-4">
                    <FormLabel className="w-[200px] text-right">
                      Exchange Rate
                    </FormLabel>
                    <div className="flex flex-col">
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Optional"
                          className="w-[100px]"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              parseFloat(e.target.value) || undefined,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="createdDate"
                rules={{ required: 'Created date is required' }}
                render={({ field }) => (
                  <FormItem className="flex items-center gap-4">
                    <FormLabel className="w-[200px] text-right">
                      Created Date
                    </FormLabel>
                    <div className="flex flex-col">
                      <FormControl>
                        <Input type="date" className="w-[160px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxDate"
                rules={{ required: 'Tax date is required' }}
                render={({ field }) => (
                  <FormItem className="flex items-center gap-4">
                    <FormLabel className="w-[200px] text-right">
                      Tax Date
                    </FormLabel>
                    <div className="flex flex-col">
                      <FormControl>
                        <Input type="date" className="w-[160px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                rules={{ required: 'Due date is required' }}
                render={({ field }) => (
                  <FormItem className="flex items-center gap-4">
                    <FormLabel className="w-[200px] text-right">
                      Due Date
                    </FormLabel>
                    <div className="flex flex-col">
                      <FormControl>
                        <Input type="date" className="w-[160px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Invoice Items</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    name: '',
                    amount: 1,
                    pricePerUnit: 0,
                    vat: 21,
                    units: 1,
                  })
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {/* Column Headers */}
              <div className="flex items-center gap-2 pb-2 border-b">
                <span className="w-8 text-sm font-medium text-muted-foreground">
                  #
                </span>
                <span className="flex-1 text-sm font-medium text-muted-foreground">
                  Description
                </span>
                <span className="w-24 text-sm font-medium text-muted-foreground">
                  Qty
                </span>
                <span className="w-32 text-sm font-medium text-muted-foreground">
                  Price
                </span>
                <span className="w-24 text-sm font-medium text-muted-foreground">
                  Tax %
                </span>
                <span className="w-32 text-sm font-medium text-muted-foreground">
                  Total
                </span>
                <span className="w-10"></span>
              </div>

              {/* Item Rows */}
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <span className="text-sm font-medium w-8">{index + 1}.</span>

                  <FormField
                    control={form.control}
                    name={`items.${index}.name`}
                    rules={{ required: 'Description is required' }}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="Item description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.amount`}
                    rules={{
                      required: 'Quantity is required',
                      min: {
                        value: 0.01,
                        message: 'Quantity must be greater than 0',
                      },
                    }}
                    render={({ field }) => (
                      <FormItem className="w-24">
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => {
                              field.onChange(parseFloat(e.target.value) || 0);
                              calculateItemTotals(index);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.pricePerUnit`}
                    rules={{
                      required: 'Price is required',
                      min: {
                        value: 0.01,
                        message: 'Price must be greater than 0',
                      },
                    }}
                    render={({ field }) => (
                      <FormItem className="w-32">
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            {...field}
                            onChange={(e) => {
                              field.onChange(parseFloat(e.target.value) || 0);
                              calculateItemTotals(index);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.vat`}
                    render={({ field }) => (
                      <FormItem className="w-24">
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            {...field}
                            onChange={(e) => {
                              field.onChange(parseFloat(e.target.value) || 0);
                              calculateItemTotals(index);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="w-32">
                    <p className="font-medium">
                      $
                      {form.watch(`items.${index}.totalWithTax`)?.toFixed(2) ||
                        '0.00'}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      remove(index);
                      calculateInvoiceTotals();
                    }}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Invoice Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Subtotal</p>
                <p className="text-2xl font-bold">
                  ${form.watch('total')?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tax</p>
                <p className="text-2xl font-bold">
                  ${form.watch('totalTax')?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">
                  ${form.watch('totalWithTax')?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Invoice</Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CreateInvoice;
