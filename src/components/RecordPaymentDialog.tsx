import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Landmark } from 'lucide-react';

import {
  usePaymentCreate,
  getPaymentListByInvoiceQueryKey,
} from '@/api/payments/payments';
import {
  getInvoiceGetQueryKey,
  getInvoiceListByCompanyQueryKey,
} from '@/api/invoices/invoices';
import {
  CreatePaymentDtoPaymentMethod,
  type InvoiceResponseDto,
} from '@/api/model';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const paymentMethodOptions = [
  {
    value: CreatePaymentDtoPaymentMethod.BANK_TRANSFER,
    label: 'Bankovni prevod',
  },
  {
    value: CreatePaymentDtoPaymentMethod.CASH,
    label: 'Hotovost',
  },
  {
    value: CreatePaymentDtoPaymentMethod.CARD,
    label: 'Kartou',
  },
  {
    value: CreatePaymentDtoPaymentMethod.OTHER,
    label: 'Jine',
  },
] as const;

const paymentMethodSchema = z.enum([
  CreatePaymentDtoPaymentMethod.BANK_TRANSFER,
  CreatePaymentDtoPaymentMethod.CASH,
  CreatePaymentDtoPaymentMethod.CARD,
  CreatePaymentDtoPaymentMethod.OTHER,
]);

const paymentSchema = z.object({
  amount: z.string().min(1, 'Castka je povinna'),
  paymentDate: z.string().min(1, 'Datum platby je povinne'),
  paymentMethod: paymentMethodSchema,
  reference: z.string().min(1, 'Variabilni symbol je povinny'),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

type InvoicePaymentSource = InvoiceResponseDto & {
  paymentMethod?:
    | keyof typeof CreatePaymentDtoPaymentMethod
    | (typeof CreatePaymentDtoPaymentMethod)[keyof typeof CreatePaymentDtoPaymentMethod]
    | null;
};

interface RecordPaymentDialogProps {
  invoice: InvoicePaymentSource;
  onSuccess?: () => void;
  triggerClassName?: string;
  triggerSize?: 'default' | 'sm';
  stopPropagation?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

const getTodayDate = () => new Date().toISOString().split('T')[0];

const getDefaultAmount = (invoice: InvoiceResponseDto) => {
  const rawAmount = invoice.totalWithTax ?? invoice.total ?? 0;
  const amount =
    typeof rawAmount === 'number'
      ? rawAmount
      : Number.parseFloat(String(rawAmount));

  return Number.isFinite(amount) ? amount.toFixed(2) : '0.00';
};

const getDefaultPaymentMethod = (invoice: InvoicePaymentSource) => {
  const paymentMethod = invoice.paymentMethod;

  if (
    paymentMethod &&
    paymentMethodOptions.some((option) => option.value === paymentMethod)
  ) {
    return paymentMethod;
  }

  return CreatePaymentDtoPaymentMethod.BANK_TRANSFER;
};

export function RecordPaymentDialog({
  invoice,
  onSuccess,
  triggerClassName,
  triggerSize = 'sm',
  stopPropagation = false,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  hideTrigger = false,
}: RecordPaymentDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (next: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(next);
    } else {
      setInternalOpen(next);
    }
  };
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { mutate: createPayment, isPending } = usePaymentCreate();

  const defaultValues = useMemo<PaymentFormValues>(
    () => ({
      amount: getDefaultAmount(invoice),
      paymentDate: getTodayDate(),
      paymentMethod: getDefaultPaymentMethod(invoice),
      reference: invoice.number,
    }),
    [invoice],
  );

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      form.reset(defaultValues);
    }
  }, [defaultValues, form, open]);

  const handleSubmit = (values: PaymentFormValues) => {
    createPayment(
      {
        data: {
          invoiceId: invoice.id,
          amount: values.amount,
          paymentDate: values.paymentDate,
          paymentMethod: values.paymentMethod,
          reference: values.reference,
        },
      },
      {
        onSuccess: async () => {
          enqueueSnackbar('Platba byla uspesne zaznamenana', {
            variant: 'success',
          });

          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: getInvoiceListByCompanyQueryKey(),
            }),
            queryClient.invalidateQueries({
              queryKey: getInvoiceGetQueryKey(invoice.id),
            }),
            queryClient.invalidateQueries({
              queryKey: getPaymentListByInvoiceQueryKey(invoice.id),
            }),
          ]);

          onSuccess?.();
          setOpen(false);
          form.reset(defaultValues);
        },
        onError: () => {
          enqueueSnackbar('Zaznamenani platby se nezdarilo', {
            variant: 'error',
          });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size={triggerSize}
            className={triggerClassName}
            onClick={(event) => {
              if (stopPropagation) {
                event.stopPropagation();
              }
            }}
          >
            <Landmark className="h-4 w-4" />
            Zaznamenat platbu
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Zaznamenat platbu</DialogTitle>
          <DialogDescription>Faktura {invoice.number}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Datum platby</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Castka</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variabilni symbol</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma uhrady</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte metodu platby" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paymentMethodOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Zrusit
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Ukladam...' : 'Ulozit platbu'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
