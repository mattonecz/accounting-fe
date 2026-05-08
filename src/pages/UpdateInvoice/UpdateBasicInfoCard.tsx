import { Input } from '@/components/ui/input';
import {
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
import { FormCard } from '@/components/FormCard';
import { InputController } from '@/components/InputController';
import { SelectController } from '@/components/SelectController';
import {
  UpdateInvoiceDtoStatus,
  UpdateInvoiceDtoType,
  UpdateInvoiceDtoVatMode,
} from '@/api/model';
import { useWatch } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import type { UpdateInvoiceDto } from '@/api/model';
import { getBankAccountLabel } from './useUpdateInvoiceForm';

interface UpdateBasicInfoCardProps {
  form: UseFormReturn<UpdateInvoiceDto>;
  sortedContacts: Array<{ id: string; name: string }>;
  sortedBanks: Array<{
    id: string;
    name?: string;
    number?: string;
    iban?: string;
    currency?: string;
  }>;
  isCzkCurrency: boolean;
  isVatPayer: boolean;
}

const VAT_MODE_OPTIONS = [
  { value: UpdateInvoiceDtoVatMode.STANDARD, label: 'Standardní' },
  {
    value: UpdateInvoiceDtoVatMode.REVERSE_CHARGE,
    label: 'Přenesená daňová povinnost',
  },
];

export const UpdateBasicInfoCard = ({
  form,
  sortedContacts,
  sortedBanks,
  isCzkCurrency,
  isVatPayer,
}: UpdateBasicInfoCardProps) => {
  const invoiceType = useWatch({ control: form.control, name: 'type' });
  const isReceived = invoiceType === UpdateInvoiceDtoType.RECEIVED;
  const contactLabel = isReceived ? 'Dodavatel' : 'Odběratel';
  const contactPlaceholder = isReceived
    ? 'Vyberte dodavatele'
    : 'Vyberte odběratele';
  const contactRequiredMessage = isReceived
    ? 'Dodavatel je povinný'
    : 'Odběratel je povinný';

  return (
    <>
      <FormCard title="Základní informace" titleClassName="text-center">
        <div className="mx-auto max-w-3xl space-y-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="flex items-center gap-4">
                <FormLabel className="w-[200px] text-right">Stav</FormLabel>
                <div className="flex flex-col">
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Vyberte stav" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UpdateInvoiceDtoStatus.DRAFT}>
                        Koncept
                      </SelectItem>
                      <SelectItem value={UpdateInvoiceDtoStatus.ISSUED}>
                        Vystavena
                      </SelectItem>
                      <SelectItem value={UpdateInvoiceDtoStatus.PAID}>
                        Uhrazena
                      </SelectItem>
                      <SelectItem value={UpdateInvoiceDtoStatus.CANCELLED}>
                        Zrušena
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
            name="contactId"
            rules={{ required: contactRequiredMessage }}
            render={({ field }) => (
              <FormItem className="flex items-center gap-4">
                <FormLabel className="w-[200px] text-right">
                  {contactLabel}
                </FormLabel>
                <div className="flex flex-col">
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-[350px]">
                        <SelectValue placeholder={contactPlaceholder} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sortedContacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.name}
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

          {isReceived && (
            <InputController
              control={form.control}
              name="originalNumber"
              label="Číslo dodavatele"
              placeholder="Číslo na faktuře dodavatele"
            />
          )}

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem className="flex items-center gap-4">
                <FormLabel className="w-[200px] text-right">Měna</FormLabel>
                <div className="flex flex-col">
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Vyberte měnu" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="USD">USD - Americký dolar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="CZK">CZK - Česká koruna</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          {isVatPayer && (
            <SelectController
              control={form.control}
              name="vatMode"
              label="Režim DPH"
              placeholder="Vyberte režim DPH"
              options={VAT_MODE_OPTIONS}
              rules={{ required: 'Režim DPH je povinný' }}
            />
          )}

          {!isCzkCurrency && (
            <FormField
              control={form.control}
              name="exchangeRate"
              render={({ field }) => (
                <FormItem className="flex items-center gap-4">
                  <FormLabel className="w-[200px] text-right">Kurz</FormLabel>
                  <div className="flex flex-col">
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Volitelně"
                        className="w-[100px]"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || undefined)
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
            name="duzpDate"
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
      </FormCard>

      <FormCard
        title={isReceived ? 'Bankovní účet dodavatele' : 'Bankovní účet'}
        titleClassName="text-center"
      >
        <div className="mx-auto max-w-3xl space-y-4">
          {isReceived ? (
            <>
              <InputController
                control={form.control}
                name="bankSnapshot.name"
                label="Název banky"
                placeholder="Volitelně"
              />
              <InputController
                control={form.control}
                name="bankSnapshot.number"
                label="Číslo účtu"
                placeholder="123456789/0100"
              />
              <InputController
                control={form.control}
                name="bankSnapshot.iban"
                label="IBAN"
                placeholder="CZ65..."
              />
              <InputController
                control={form.control}
                name="bankSnapshot.swift"
                label="SWIFT/BIC"
                placeholder="Volitelně"
              />
            </>
          ) : (
            <FormField
              control={form.control}
              name="bankId"
              render={({ field }) => (
                <FormItem className="flex items-center gap-4">
                  <FormLabel className="w-[200px] text-right">
                    Bankovní účet
                  </FormLabel>
                  <div className="flex flex-col">
                    <Select onValueChange={field.onChange} value={field.value}>
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
          )}
        </div>
      </FormCard>

      <FormCard title="Platební symboly" titleClassName="text-center">
        <div className="mx-auto max-w-3xl space-y-4">
          <InputController
            control={form.control}
            name="variableSymbol"
            label="Variabilní symbol"
            placeholder="Volitelně"
          />
          <InputController
            control={form.control}
            name="specificSymbol"
            label="Specifický symbol"
            placeholder="Volitelně"
          />
          <InputController
            control={form.control}
            name="konstantSymbol"
            label="Konstantní symbol"
            placeholder="Volitelně"
          />
        </div>
      </FormCard>

      <FormCard title="Poznámky" titleClassName="text-center">
        <div className="mx-auto max-w-3xl space-y-4">
          <InputController
            control={form.control}
            name="note"
            label="Poznámka"
            placeholder="Zobrazí se na faktuře"
            variant="vertical"
          />
          <InputController
            control={form.control}
            name="internalNote"
            label="Interní poznámka"
            placeholder="Není viditelná pro protistranu"
            variant="vertical"
          />
        </div>
      </FormCard>
    </>
  );
};
