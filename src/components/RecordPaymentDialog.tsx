import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
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

const paymentMethodSchema = z.enum([
  CreatePaymentDtoPaymentMethod.BANK_TRANSFER,
  CreatePaymentDtoPaymentMethod.CASH,
  CreatePaymentDtoPaymentMethod.CARD,
  CreatePaymentDtoPaymentMethod.OTHER,
]);

type PaymentFormValues = {
  amount: string;
  paymentDate: string;
  paymentMethod: typeof CreatePaymentDtoPaymentMethod[keyof typeof CreatePaymentDtoPaymentMethod];
  reference: string;
};

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

const getDefaultPaymentMethod = (
  invoice: InvoicePaymentSource,
): typeof CreatePaymentDtoPaymentMethod[keyof typeof CreatePaymentDtoPaymentMethod] => {
  const pm = invoice.paymentMethod;
  const values = Object.values(CreatePaymentDtoPaymentMethod) as string[];
  if (pm && values.includes(pm as string)) {
    return pm as typeof CreatePaymentDtoPaymentMethod[keyof typeof CreatePaymentDtoPaymentMethod];
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
  const { t } = useTranslation();
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

  const paymentSchema = z.object({
    amount: z.string().min(1, t('payments.validation.amountRequired')),
    paymentDate: z.string().min(1, t('payments.validation.dateRequired')),
    paymentMethod: paymentMethodSchema,
    reference: z.string().min(1, t('payments.validation.referenceRequired')),
  });

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

  const paymentMethodOptions = [
    { value: CreatePaymentDtoPaymentMethod.BANK_TRANSFER, label: t('invoices.paymentMethods.BANK_TRANSFER') },
    { value: CreatePaymentDtoPaymentMethod.CASH, label: t('invoices.paymentMethods.CASH') },
    { value: CreatePaymentDtoPaymentMethod.CARD, label: t('invoices.paymentMethods.CARD') },
    { value: CreatePaymentDtoPaymentMethod.OTHER, label: t('invoices.paymentMethods.OTHER') },
  ];

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
          enqueueSnackbar(t('payments.messages.recordSuccess'), { variant: 'success' });

          await Promise.all([
            queryClient.invalidateQueries({ queryKey: getInvoiceListByCompanyQueryKey() }),
            queryClient.invalidateQueries({ queryKey: getInvoiceGetQueryKey(invoice.id) }),
            queryClient.invalidateQueries({ queryKey: getPaymentListByInvoiceQueryKey(invoice.id) }),
          ]);

          onSuccess?.();
          setOpen(false);
          form.reset(defaultValues);
        },
        onError: () => {
          enqueueSnackbar(t('payments.messages.recordError'), { variant: 'error' });
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
              if (stopPropagation) event.stopPropagation();
            }}
          >
            <Landmark className="h-4 w-4" />
            {t('payments.actions.record')}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{t('payments.actions.record')}</DialogTitle>
          <DialogDescription>{t('invoices.fields.number')} {invoice.number}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('payments.fields.date')}</FormLabel>
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
                  <FormLabel>{t('payments.fields.amount')}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" inputMode="decimal" {...field} />
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
                  <FormLabel>{t('payments.fields.reference')}</FormLabel>
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
                  <FormLabel>{t('payments.fields.method')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('payments.placeholders.method')} />
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
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? t('common.saving') : t('payments.actions.save')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
