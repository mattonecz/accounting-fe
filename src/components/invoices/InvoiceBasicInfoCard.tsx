import { UseFormReturn } from 'react-hook-form';
import { CreateInvoiceDto } from '@/api/model';
import { InputController } from '@/components/InputController';
import { SelectController } from '@/components/SelectController';
import { FormCard } from '@/components/FormCard';
import { BankResponseDto } from '@/api/model/bankResponseDto';
import { CompanyResponseDto } from '@/api/model/companyResponseDto';

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - Americký dolar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'CZK', label: 'CZK - Česká koruna' },
];

interface InvoiceBasicInfoCardProps {
  form: UseFormReturn<CreateInvoiceDto>;
  sortedCompanies: CompanyResponseDto[];
  sortedBanks: BankResponseDto[];
  isCzkCurrency: boolean;
  getBankAccountLabel: (account: {
    name?: string;
    currency?: string;
    number?: string;
    iban?: string;
  }) => string;
}

export const InvoiceBasicInfoCard = ({
  form,
  sortedCompanies,
  sortedBanks,
  isCzkCurrency,
  getBankAccountLabel,
}: InvoiceBasicInfoCardProps) => {
  const companyOptions = sortedCompanies.map((c) => ({
    value: c.id,
    label: c.name ?? '-',
  }));

  const bankOptions = sortedBanks.map((b) => ({
    value: b.id,
    label: getBankAccountLabel(b),
  }));

  return (
    <FormCard title="Základní informace" titleClassName="text-center">
      <div className="max-w-3xl mx-auto space-y-4">
        <SelectController
          control={form.control}
          name="companyId"
          label="Odběratel"
          placeholder="Vyberte odběratele"
          options={companyOptions}
          rules={{ required: 'Odběratel je povinný' }}
        />

        <InputController
          control={form.control}
          name="number"
          label="Číslo faktury"
          placeholder="20250001"
          rules={{ required: 'Číslo faktury je povinné' }}
        />

        <SelectController
          control={form.control}
          name="bankId"
          label="Bankovní účet"
          placeholder="Vyberte bankovní účet"
          options={bankOptions}
          triggerClassName="w-[400px]"
          rules={{ required: 'Bankovní účet je povinný' }}
        />

        <SelectController
          control={form.control}
          name="currency"
          label="Měna"
          placeholder="Vyberte měnu"
          options={CURRENCY_OPTIONS}
        />

        {!isCzkCurrency && (
          <InputController
            control={form.control}
            name="exchangeRate"
            label="Kurz"
            placeholder="Volitelně"
            type="number"
            step="0.01"
            className="w-[100px]"
            onChangeOverride={(e, onChange) =>
              onChange(parseFloat(e.target.value) || undefined)
            }
          />
        )}

        <InputController
          control={form.control}
          name="createdDate"
          label="Datum vystavení"
          type="date"
          className="w-[160px]"
          rules={{ required: 'Datum vystavení je povinné' }}
        />

        <InputController
          control={form.control}
          name="taxDate"
          label="Datum zdanitelného plnění"
          type="date"
          className="w-[160px]"
          rules={{ required: 'Datum zdanitelného plnění je povinné' }}
        />

        <InputController
          control={form.control}
          name="dueDate"
          label="Datum splatnosti"
          type="date"
          className="w-[160px]"
          rules={{ required: 'Datum splatnosti je povinné' }}
        />
      </div>
    </FormCard>
  );
};
