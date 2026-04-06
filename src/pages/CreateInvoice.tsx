import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { useInvoiceCreate, useInvoiceGetCount } from '@/api/invoices/invoices';
import { InputController } from '@/components/InputController';

const CURRENCY_SYMBOLS: Record<string, string> = {
  CZK: 'Kč',
  EUR: '€',
  USD: '$',
};

const CreateInvoice = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { data: companies } = useCompanyListByUser();
  const { data: banks } = useBankListByUser();
  const { data: invoiceNumber } = useInvoiceGetCount();
  const { mutate: createInvoice, isPending: isCreatingInvoice } = useInvoiceCreate();

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
      total: 0,
      totalTax: 0,
      totalWithTax: 0,
      items: [{ name: '', amount: 1, pricePerUnit: 0, vat: 21, units: 1 }],
    },
  });

  const selectedCurrency = form.watch('currency') || 'CZK';
  const currencyLabel = CURRENCY_SYMBOLS[selectedCurrency] || selectedCurrency;
  const isCzkCurrency = selectedCurrency === 'CZK';

  const sortedBanks = [...(banks?.data ?? [])].sort((a, b) => {
    if (a.default !== b.default) {
      return a.default ? -1 : 1;
    }

    return (a.name ?? '').localeCompare(b.name ?? '', 'cs', {
      sensitivity: 'base',
    });
  });

  const sortedCompanies = [...(companies?.data ?? [])].sort((a, b) =>
    (a.name ?? '').localeCompare(b.name ?? '', 'cs', { sensitivity: 'base' }),
  );

  const formatMoney = (value?: number) => {
    return `${(value ?? 0).toFixed(2)} ${currencyLabel}`;
  };

  const getBankAccountLabel = (account: {
    name?: string;
    currency?: string;
    number?: string;
    iban?: string;
  }) => {
    return `${account.name ?? '-'} (${account.currency ?? '-'})` +
      `: ${account.number || account.iban || '-'}`;
  };

  useEffect(() => {
    if (invoiceNumber?.data !== undefined) {
      const year = new Date().getFullYear();
      const number = invoiceNumber.data + 1;
      const formattedNumber = `${year}${String(number).padStart(4, '0')}`;
      form.setValue('number', formattedNumber);
    }
  }, [invoiceNumber, form]);

  useEffect(() => {
    const selectedBankId = form.getValues('bankId');
    if (selectedBankId) {
      return;
    }

    const defaultBank = sortedBanks.find((bank) => bank.default) ?? sortedBanks[0];
    if (defaultBank) {
      form.setValue('bankId', defaultBank.id);
    }
  }, [sortedBanks, form]);

  useEffect(() => {
    if (selectedCurrency === 'CZK') {
      form.setValue('exchangeRate', undefined);
    }
  }, [selectedCurrency, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const calculateItemTotals = () => {
    calculateInvoiceTotals();
  };

  const calculateInvoiceTotals = () => {
    const items = form.getValues('items');
    const total = items.reduce(
      (sum, item) => sum + (item.amount || 0) * (item.pricePerUnit || 0),
      0,
    );
    const totalTax = items.reduce((sum, item) => {
      const itemTotal = (item.amount || 0) * (item.pricePerUnit || 0);
      return sum + itemTotal * ((item.vat || 0) / 100);
    }, 0);
    const totalWithTax = total + totalTax;

    form.setValue('total', total);
    form.setValue('totalTax', totalTax);
    form.setValue('totalWithTax', totalWithTax);
  };

  const onSubmit = (data: CreateInvoiceDto) => {
    createInvoice(
      { data },
      {
        onSuccess: () => {
          enqueueSnackbar('Faktura byla úspěšně vytvořena', {
            variant: 'success',
          });
          navigate('/outgoing-invoices');
        },
        onError: () => {
          enqueueSnackbar('Vytvoření faktury selhalo', {
            variant: 'error',
          });
        },
      },
    );
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Vytvořit fakturu</h2>
          <p className="text-muted-foreground">
            Vyplňte údaje pro vytvoření nové faktury
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6 text-center">
              Základní informace
            </h3>
            <div className="max-w-3xl mx-auto space-y-4">
              <FormField
                control={form.control}
                name="companyId"
                rules={{ required: 'Odběratel je povinný' }}
                render={({ field }) => (
                  <FormItem className="flex items-center gap-4">
                    <FormLabel className="w-[200px] text-right">
                      Odběratel
                    </FormLabel>
                    <div className="flex flex-col">
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-[350px]">
                            <SelectValue placeholder="Vyberte odběratele" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sortedCompanies.map((company) => (
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

              <InputController
                control={form.control}
                name="number"
                label="Číslo faktury"
                placeholder="20250001"
                rules={{ required: 'Číslo faktury je povinné' }}
              />

              <FormField
                control={form.control}
                name="bankId"
                rules={{ required: 'Bankovní účet je povinný' }}
                render={({ field }) => (
                  <FormItem className="flex items-center gap-4">
                    <FormLabel className="w-[200px] text-right">
                      Bankovní účet
                    </FormLabel>
                    <div className="flex flex-col">
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-[400px]">
                            <SelectValue placeholder="Vyberte bankovní účet" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sortedBanks.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {getBankAccountLabel(account)}
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
                      Měna
                    </FormLabel>
                    <div className="flex flex-col">
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Vyberte měnu" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD - Americký dolar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="CZK">
                            CZK - Česká koruna
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              {!isCzkCurrency && (
                <FormField
                  control={form.control}
                  name="exchangeRate"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-4">
                      <FormLabel className="w-[200px] text-right">
                        Kurz
                      </FormLabel>
                      <div className="flex flex-col">
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Volitelně"
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
              )}

              <FormField
                control={form.control}
                name="createdDate"
                rules={{ required: 'Datum vystavení je povinné' }}
                render={({ field }) => (
                  <FormItem className="flex items-center gap-4">
                    <FormLabel className="w-[200px] text-right">
                      Datum vystavení
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
                rules={{ required: 'Datum zdanitelného plnění je povinné' }}
                render={({ field }) => (
                  <FormItem className="flex items-center gap-4">
                    <FormLabel className="w-[200px] text-right">
                      Datum zdanitelného plnění
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
                rules={{ required: 'Datum splatnosti je povinné' }}
                render={({ field }) => (
                  <FormItem className="flex items-center gap-4">
                    <FormLabel className="w-[200px] text-right">
                      Datum splatnosti
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
              <h3 className="text-lg font-semibold">Polozky faktury</h3>
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
                Přidat položku
              </Button>
            </div>

            <div className="space-y-3">
              {/* Column Headers */}
              <div className="flex items-center gap-2 pb-2 border-b">
                <span className="w-8 text-sm font-medium text-muted-foreground">
                  #
                </span>
                <span className="flex-1 text-sm font-medium text-muted-foreground">
                  Popis
                </span>
                <span className="w-24 text-sm font-medium text-muted-foreground">
                  Množství
                </span>
                <span className="w-32 text-sm font-medium text-muted-foreground">
                  Cena
                </span>
                <span className="w-24 text-sm font-medium text-muted-foreground">
                  DPH %
                </span>
                <span className="w-32 text-sm font-medium text-muted-foreground">
                  Celkem
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
                    rules={{ required: 'Popis je povinný' }}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="Popis položky" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.amount`}
                    rules={{
                      required: 'Množství je povinné',
                      min: {
                        value: 0.01,
                        message: 'Množství musí být větší než 0',
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
                              calculateItemTotals();
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
                      required: 'Cena je povinná',
                      min: {
                        value: 0.01,
                        message: 'Cena musí být větší než 0',
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
                              calculateItemTotals();
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
                              calculateItemTotals();
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="w-32">
                    <p className="font-medium">
                      {formatMoney(
                        (form.watch(`items.${index}.amount`) || 0) *
                          (form.watch(`items.${index}.pricePerUnit`) || 0) *
                          (1 + (form.watch(`items.${index}.vat`) || 0) / 100),
                      )}
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
            <h3 className="text-lg font-semibold mb-4">Souhrn faktury</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Mezisoučet</p>
                <p className="text-2xl font-bold">{formatMoney(form.watch('total'))}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">DPH celkem</p>
                <p className="text-2xl font-bold">{formatMoney(form.watch('totalTax'))}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Částka celkem</p>
                <p className="text-2xl font-bold">{formatMoney(form.watch('totalWithTax'))}</p>
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Zrušit
            </Button>
            <Button type="submit" disabled={isCreatingInvoice}>
              {isCreatingInvoice ? 'Vytvářím...' : 'Vytvořit fakturu'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CreateInvoice;
