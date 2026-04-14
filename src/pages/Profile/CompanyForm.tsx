import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  getCompanyGetQueryKey,
  useCompanyCreate,
  useCompanyGet,
  useCompanyUpdate,
} from '@/api/companies/companies';
import type { CompanyResponseDto, CreateCompanyDto } from '@/api/model';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { InputController } from '@/components/InputController';

type CompanyFormValues = Omit<CreateCompanyDto, 'isOwn' | 'email' | 'description'>;

const mapCompanyToForm = (company?: CompanyResponseDto | null): CompanyFormValues => ({
  name: company?.name ?? '',
  country: company?.country ?? '',
  street: company?.street ?? '',
  city: company?.city ?? '',
  psc: company?.psc ?? '',
  ico: company?.ico ?? '',
  dic: company?.dic ?? '',
});

const toOptionalField = (value: string) => {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

const toCompanyPayload = (data: CompanyFormValues): CompanyFormValues => ({
  name: data.name.trim(),
  country: data.country.trim(),
  street: toOptionalField(data.street ?? ''),
  city: toOptionalField(data.city ?? ''),
  psc: toOptionalField(data.psc ?? ''),
  ico: toOptionalField(data.ico ?? ''),
  dic: toOptionalField(data.dic ?? ''),
});

interface CompanyFormProps {
  companyId: string;
}

export const CompanyForm = ({ companyId }: CompanyFormProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [companyFallback, setCompanyFallback] = useState<CompanyResponseDto | null>(null);

  const {
    data: companyResponse,
    isError: isCompanyError,
    isLoading: isCompanyLoading,
  } = useCompanyGet(companyId, { query: { retry: false } });

  const { mutate: createCompany, isPending: isCreatingCompany } = useCompanyCreate();
  const { mutate: updateCompany, isPending: isUpdatingCompany } = useCompanyUpdate();

  const companyFromApi = companyResponse?.data;
  const company = companyFromApi ?? companyFallback;
  const hasExistingCompany = Boolean(company?.id);
  const isSaving = isCreatingCompany || isUpdatingCompany;

  const missingCompanyMessage = companyId
    ? 'Firma přiřazená k účtu nebyla nalezena. Po uložení se vytvoří nový záznam.'
    : 'K účtu zatím není přiřazená fakturační firma. Po uložení se vytvoří nový záznam.';

  const form = useForm<CompanyFormValues>({
    defaultValues: mapCompanyToForm(),
  });

  const { reset } = form;

  useEffect(() => {
    if (company) {
      reset(mapCompanyToForm(company));
      return;
    }
    if (!isCompanyLoading) {
      reset(mapCompanyToForm());
    }
  }, [company, isCompanyLoading, reset]);

  const onSubmit = (data: CompanyFormValues) => {
    const payload = toCompanyPayload(data);
    const handleSuccess = (response: { data: CompanyResponseDto }) => {
      queryClient.setQueryData(getCompanyGetQueryKey(response.data.id), response);
      if (!companyId || response.data.id !== companyId) {
        setCompanyFallback(response.data);
      } else {
        setCompanyFallback(null);
      }
      reset(mapCompanyToForm(response.data));
      enqueueSnackbar(
        hasExistingCompany
          ? 'Fakturační údaje byly úspěšně upraveny.'
          : 'Fakturační údaje byly úspěšně vytvořeny.',
        { variant: 'success' },
      );
    };
    const handleError = () => {
      enqueueSnackbar(
        hasExistingCompany
          ? 'Úprava fakturačních údajů se nepodařila.'
          : 'Vytvoření fakturačních údajů se nepodařilo.',
        { variant: 'error' },
      );
    };

    if (hasExistingCompany && company) {
      updateCompany(
        { data: { id: company.id, ...payload } },
        { onSuccess: handleSuccess, onError: handleError },
      );
      return;
    }
    createCompany(
      { data: { ...payload, isOwn: true } },
      { onSuccess: handleSuccess, onError: handleError },
    );
  };

  if (isCompanyLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Načítám fakturační údaje firmy...
        </CardContent>
      </Card>
    );
  }

  if (isCompanyError && !company) {
    return (
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle>Fakturační údaje se nepodařilo načíst</CardTitle>
          <CardDescription>
            Nepodařilo se načíst firmu přiřazenou k účtu.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {!hasExistingCompany && (
          <Card className="border-dashed">
            <CardContent className="p-6 text-sm text-muted-foreground">
              {missingCompanyMessage}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Fakturační údaje</CardTitle>
            <CardDescription>
              Údaje firmy používané na vystavených dokladech a dalších výstupech.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <InputController
              control={form.control}
              name="name"
              label="Název firmy"
              placeholder="ACME s.r.o."
              variant="vertical"
              containerClassName="md:col-span-2"
              rules={{
                required: 'Název firmy je povinný',
                validate: (value) => (value?.trim().length ?? 0) > 0 || 'Název firmy je povinný',
              }}
            />
            <InputController
              control={form.control}
              name="ico"
              label="IČO"
              placeholder="12345678"
              variant="vertical"
            />
            <InputController
              control={form.control}
              name="dic"
              label="DIČ"
              placeholder="CZ12345678"
              variant="vertical"
            />
            <InputController
              control={form.control}
              name="country"
              label="Stát"
              placeholder="Česká republika"
              variant="vertical"
              rules={{
                required: 'Stát je povinný',
                validate: (value) => (value?.trim().length ?? 0) > 0 || 'Stát je povinný',
              }}
            />
            <InputController
              control={form.control}
              name="street"
              label="Ulice a č.p."
              placeholder="Masarykova 12"
              variant="vertical"
              containerClassName="md:col-span-2"
            />
            <InputController
              control={form.control}
              name="city"
              label="Město"
              placeholder="Brno"
              variant="vertical"
            />
            <InputController
              control={form.control}
              name="psc"
              label="PSČ"
              placeholder="60200"
              variant="vertical"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={isSaving}>
            {isSaving
              ? hasExistingCompany
                ? 'Ukládám firmu...'
                : 'Vytvářím firmu...'
              : hasExistingCompany
                ? 'Uložit firmu'
                : 'Vytvořit firmu'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
