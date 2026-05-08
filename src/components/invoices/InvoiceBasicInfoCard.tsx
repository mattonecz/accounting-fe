import { UseFormReturn } from 'react-hook-form';
import { CreateInvoiceDto, CreateInvoiceDtoVatMode } from '@/api/model';
import { InputController } from '@/components/InputController';
import { SelectController } from '@/components/SelectController';
import { FormCard } from '@/components/FormCard';
import { BankResponseDto } from '@/api/model/bankResponseDto';
import { ContactResponseDto } from '@/api/model/contactResponseDto';

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - Americký dolar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'CZK', label: 'CZK - Česká koruna' },
];

const VAT_MODE_OPTIONS = [
  { value: CreateInvoiceDtoVatMode.STANDARD, label: 'Standardní' },
  {
    value: CreateInvoiceDtoVatMode.REVERSE_CHARGE,
    label: 'Přenesená daňová povinnost',
  },
];

interface InvoiceBasicInfoCardProps {
  form: UseFormReturn<CreateInvoiceDto>;
  sortedContacts: ContactResponseDto[];
  sortedBanks: BankResponseDto[];
  isCzkCurrency: boolean;
  isReceived?: boolean;
  isVatPayer: boolean;
  getBankAccountLabel: (account: {
    name?: string;
    currency?: string;
    number?: string;
    iban?: string;
  }) => string;
}

export const InvoiceBasicInfoCard = ({
  form,
  sortedContacts,
  sortedBanks,
  isCzkCurrency,
  isReceived = false,
  isVatPayer,
  getBankAccountLabel,
}: InvoiceBasicInfoCardProps) => {
  const contactOptions = sortedContacts.map((c) => ({
    value: c.id,
    label: c.name ?? '-',
  }));

  const bankOptions = sortedBanks.map((b) => ({
    value: b.id,
    label: getBankAccountLabel(b),
  }));

  return (
    <>
      <FormCard title="Základní informace" titleClassName="text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <SelectController
            control={form.control}
            name="contactId"
            label={isReceived ? 'Dodavatel' : 'Odběratel'}
            placeholder={
              isReceived ? 'Vyberte dodavatele' : 'Vyberte odběratele'
            }
            options={contactOptions}
            rules={{
              required: isReceived
                ? 'Dodavatel je povinný'
                : 'Odběratel je povinný',
            }}
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

          <SelectController
            control={form.control}
            name="currency"
            label="Měna"
            placeholder="Vyberte měnu"
            options={CURRENCY_OPTIONS}
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
            name="duzpDate"
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

      <FormCard
        title={
          isReceived ? 'Bankovní účet dodavatele' : 'Bankovní účet'
        }
        titleClassName="text-center"
      >
        <div className="max-w-3xl mx-auto space-y-4">
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
            <SelectController
              control={form.control}
              name="bankId"
              label="Bankovní účet"
              placeholder="Vyberte bankovní účet"
              options={bankOptions}
              triggerClassName="w-[400px]"
              rules={{ required: 'Bankovní účet je povinný' }}
            />
          )}
        </div>
      </FormCard>

      <FormCard title="Platební symboly" titleClassName="text-center">
        <div className="max-w-3xl mx-auto space-y-4">
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
        <div className="max-w-3xl mx-auto space-y-4">
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
