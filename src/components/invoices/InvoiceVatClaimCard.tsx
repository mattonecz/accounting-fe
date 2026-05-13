import { useTranslation } from 'react-i18next';
import {
  FieldPath,
  FieldValues,
  UseFormReturn,
} from 'react-hook-form';
import { FormCard } from '@/components/FormCard';
import { InputController } from '@/components/InputController';
import { SelectController } from '@/components/SelectController';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { InvoiceVatClaimDtoClaimType } from '@/api/model';

interface InvoiceVatClaimCardProps<T extends FieldValues> {
  form: UseFormReturn<T>;
}

const SHOULD_CLAIM_PATH = 'vatClaim.shouldClaimVat';
const CLAIM_TYPE_PATH = 'vatClaim.claimType';
const CLAIM_RATIO_PATH = 'vatClaim.claimRatio';
const CLAIM_MONTH_PATH = 'vatClaim.claimMonth';
const NOTE_PATH = 'vatClaim.note';

export function InvoiceVatClaimCard<T extends FieldValues>({
  form,
}: InvoiceVatClaimCardProps<T>) {
  const { t } = useTranslation();

  const shouldClaim = form.watch(SHOULD_CLAIM_PATH as FieldPath<T>) as
    | boolean
    | undefined;
  const claimType = form.watch(CLAIM_TYPE_PATH as FieldPath<T>) as
    | InvoiceVatClaimDtoClaimType
    | undefined;

  const claimTypeOptions = [
    {
      value: InvoiceVatClaimDtoClaimType.FULL,
      label: t('invoices.vatClaim.claimType.options.FULL'),
    },
    {
      value: InvoiceVatClaimDtoClaimType.PARTIAL,
      label: t('invoices.vatClaim.claimType.options.PARTIAL'),
    },
  ];

  return (
    <FormCard title={t('invoices.vatClaim.title')} titleClassName="text-center">
      <div className="max-w-3xl mx-auto space-y-4">
        <FormField
          control={form.control}
          name={SHOULD_CLAIM_PATH as FieldPath<T>}
          render={({ field }) => (
            <FormItem className="flex items-center gap-4">
              <FormLabel className="w-[200px] text-right">
                {t('invoices.vatClaim.shouldClaim')}
              </FormLabel>
              <div className="flex flex-col">
                <FormControl>
                  <Checkbox
                    checked={!!field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {shouldClaim && (
          <>
            <SelectController
              control={form.control}
              name={CLAIM_TYPE_PATH as FieldPath<T>}
              label={t('invoices.vatClaim.claimType.label')}
              options={claimTypeOptions}
              triggerClassName="w-[250px]"
              rules={{
                required: t('validation.required', {
                  field: t('invoices.vatClaim.claimType.label'),
                }),
              }}
            />

            {claimType === InvoiceVatClaimDtoClaimType.PARTIAL && (
              <InputController
                control={form.control}
                name={CLAIM_RATIO_PATH as FieldPath<T>}
                label={t('invoices.vatClaim.claimRatio.label')}
                placeholder={t('invoices.vatClaim.claimRatio.placeholder')}
                type="number"
                step="0.01"
                className="w-[150px]"
                rules={{
                  required: t('invoices.vatClaim.validation.ratioRequired'),
                  validate: (value: unknown) => {
                    const n = typeof value === 'string' ? Number(value) : (value as number);
                    if (!Number.isFinite(n) || n <= 0 || n >= 1) {
                      return t('invoices.vatClaim.validation.ratioRange');
                    }
                    return true;
                  },
                }}
                onChangeOverride={(e, onChange) => {
                  const raw = e.target.value;
                  onChange(raw === '' ? undefined : Number(raw));
                }}
              />
            )}

            <InputController
              control={form.control}
              name={CLAIM_MONTH_PATH as FieldPath<T>}
              label={t('invoices.vatClaim.claimMonth.label')}
              type="month"
              className="w-[200px]"
            />

            <InputController
              control={form.control}
              name={NOTE_PATH as FieldPath<T>}
              label={t('invoices.vatClaim.note.label')}
              placeholder={t('invoices.vatClaim.note.placeholder')}
              variant="vertical"
            />
          </>
        )}
      </div>
    </FormCard>
  );
}
