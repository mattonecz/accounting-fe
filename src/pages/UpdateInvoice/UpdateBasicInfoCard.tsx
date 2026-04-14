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
import { UpdateInvoiceDtoStatus, UpdateInvoiceDtoType } from '@/api/model';
import type { UseFormReturn } from 'react-hook-form';
import type { UpdateInvoiceDto } from '@/api/model';
import { getBankAccountLabel } from './useUpdateInvoiceForm';

interface UpdateBasicInfoCardProps {
  form: UseFormReturn<UpdateInvoiceDto>;
  sortedCompanies: Array<{ id: string; name: string }>;
  sortedBanks: Array<{
    id: string;
    name?: string;
    number?: string;
    iban?: string;
    currency?: string;
  }>;
  isCzkCurrency: boolean;
}

export const UpdateBasicInfoCard = ({
  form,
  sortedCompanies,
  sortedBanks,
  isCzkCurrency,
}: UpdateBasicInfoCardProps) => (
  <FormCard title="Základní informace" titleClassName="text-center">
    <div className="mx-auto max-w-3xl space-y-4">
      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem className="flex items-center gap-4">
            <FormLabel className="w-[200px] text-right">Typ dokladu</FormLabel>
            <div className="flex flex-col">
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Vyberte typ dokladu" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={UpdateInvoiceDtoType.ISSUED}>
                    Vydaná faktura
                  </SelectItem>
                  <SelectItem value={UpdateInvoiceDtoType.RECEIVED}>
                    Přijatá faktura
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
                  <SelectItem value={UpdateInvoiceDtoStatus.OVERDUE}>
                    Po splatnosti
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
        name="companyId"
        rules={{ required: 'Protistrana je povinná' }}
        render={({ field }) => (
          <FormItem className="flex items-center gap-4">
            <FormLabel className="w-[200px] text-right">Protistrana</FormLabel>
            <div className="flex flex-col">
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-[350px]">
                    <SelectValue placeholder="Vyberte protistranu" />
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
  </FormCard>
);
