import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { enqueueSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
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
import { Loader2, Plus } from 'lucide-react';
import { useListContacts } from '@/api/contacts/contacts';
import {
  getSimpleInvoiceListByCompanyQueryKey,
  useSimpleInvoiceCreate,
} from '@/api/simple-invoice/simple-invoice';
import type { ContactResponseDto, CreateSimpleInvoiceDto } from '@/api/model';
import i18n from '@/i18n';

const getDefaultFormValues = (): CreateSimpleInvoiceDto => ({
  number: '',
  createdDate: new Date().toISOString().split('T')[0],
  duzpDate: new Date().toISOString().split('T')[0],
  total: 0,
  totalTax: 0,
  totalWithTax: 0,
  description: '',
  contactId: '',
});

interface CreateSimpleInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateSimpleInvoiceDialog = ({
  open,
  onOpenChange,
}: CreateSimpleInvoiceDialogProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const form = useForm<CreateSimpleInvoiceDto>({ defaultValues: getDefaultFormValues() });

  const { data: contacts = [], isLoading: isContactsLoading } =
    useListContacts<ContactResponseDto[]>({
      query: { select: (response) => response.data },
    });

  const createMutation = useSimpleInvoiceCreate({
    mutation: {
      onSuccess: async () => {
        enqueueSnackbar(i18n.t('simpleInvoices.messages.createSuccess'), { variant: 'success' });
        await queryClient.invalidateQueries({ queryKey: getSimpleInvoiceListByCompanyQueryKey() });
        onOpenChange(false);
        form.reset(getDefaultFormValues());
      },
      onError: () => {
        enqueueSnackbar(i18n.t('simpleInvoices.messages.createError'), { variant: 'error' });
      },
    },
  });

  const onSubmit = (data: CreateSimpleInvoiceDto) => {
    createMutation.mutate({
      data: {
        contactId: data.contactId || undefined,
        number: data.number,
        createdDate: data.createdDate,
        duzpDate: data.duzpDate,
        total: data.total,
        totalTax: data.totalTax,
        totalWithTax: data.totalWithTax,
        description: data.description?.trim() || undefined,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          {t('simpleInvoices.actions.create')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('simpleInvoices.dialog.title')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="number"
                rules={{ required: t('validation.required', { field: t('simpleInvoices.fields.number') }) }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('simpleInvoices.fields.number')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="SI-2024-001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('simpleInvoices.fields.company')}</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        disabled={isContactsLoading}
                      >
                        <option value="">
                          {isContactsLoading ? t('common.loading') : t('simpleInvoices.placeholders.contact')}
                        </option>
                        {contacts.map((contact) => (
                          <option key={contact.id} value={contact.id}>
                            {contact.name}
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
                rules={{ required: t('validation.required', { field: t('invoices.fields.createdDate') }) }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('invoices.fields.createdDate')}</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duzpDate"
                rules={{ required: t('validation.required', { field: t('invoices.fields.duzpDate') }) }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('invoices.fields.duzpDate')}</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="total"
                rules={{
                  required: t('validation.required', { field: t('simpleInvoices.fields.base') }),
                  min: { value: 0, message: t('validation.minZero') },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('simpleInvoices.fields.base')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} value={field.value ?? 0}
                        onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                        placeholder="0.00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="totalTax"
                rules={{
                  required: t('validation.required', { field: t('simpleInvoices.fields.vat') }),
                  min: { value: 0, message: t('validation.minZero') },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('simpleInvoices.fields.vat')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} value={field.value ?? 0}
                        onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                        placeholder="0.00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="totalWithTax"
                rules={{
                  required: t('validation.required', { field: t('simpleInvoices.fields.totalWithVat') }),
                  min: { value: 0, message: t('validation.minZero') },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('simpleInvoices.fields.totalWithVat')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} value={field.value ?? 0}
                        onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                        placeholder="0.00" />
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
                  <FormLabel>{t('invoices.fields.note')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder={t('simpleInvoices.placeholders.description')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.saving')}
                  </>
                ) : (
                  t('simpleInvoices.dialog.submit')
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
