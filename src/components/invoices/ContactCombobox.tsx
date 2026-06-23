import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, ChevronsUpDown, Loader2, Search } from 'lucide-react';
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useAresSearch } from '@/api/ares/ares';
import type {
  ContactResponseDto,
  CreateContactDto,
  RegistrationDataResponseDto,
} from '@/api/model';

/** Maps an ARES economic-subject record to the contact-create payload. */
const aresToContact = (data: RegistrationDataResponseDto): CreateContactDto => {
  const sidlo = data.sidlo;
  const streetName = sidlo?.nazevUlice || sidlo?.nazevCastiObce || undefined;
  const houseNumber =
    sidlo?.cisloDomovni != null ? String(sidlo.cisloDomovni) : undefined;
  const orientationNumber =
    sidlo?.cisloOrientacni != null ? String(sidlo.cisloOrientacni) : undefined;
  const numberPart = houseNumber
    ? orientationNumber
      ? `${houseNumber}/${orientationNumber}`
      : houseNumber
    : '';
  const personName = [data.jmeno, data.prijmeni].filter(Boolean).join(' ');
  return {
    name: data.obchodniJmeno || personName,
    country: 'CZ',
    ico: data.ico || undefined,
    dic: data.dic || undefined,
    city: sidlo?.nazevObce || undefined,
    street: [streetName, numberPart].filter(Boolean).join(' ') || undefined,
    psc: sidlo?.psc != null ? String(sidlo.psc) : undefined,
  };
};

interface ContactComboboxProps {
  contacts: ContactResponseDto[];
  /** Currently selected existing contact id (drives the check mark). */
  selectedContactId?: string;
  /** Label shown on the trigger for the current selection. */
  selectedLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  onSelectContact: (contact: ContactResponseDto) => void;
  onSelectAres: (contact: CreateContactDto) => void;
}

const MAX_CONTACTS = 50;

export function ContactCombobox({
  contacts,
  selectedContactId,
  selectedLabel,
  placeholder,
  disabled,
  hasError,
  onSelectContact,
  onSelectAres,
}: ContactComboboxProps) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [mode, setMode] = React.useState<'contacts' | 'ares'>('contacts');

  const {
    mutate: searchAres,
    data: aresData,
    isPending: aresLoading,
    reset: resetAres,
  } = useAresSearch();
  const aresResults = aresData?.data?.ekonomickeSubjekty ?? [];

  const trimmed = query.trim();
  const needle = trimmed.toLowerCase();
  const filteredContacts = (
    needle
      ? contacts.filter(
          (c) =>
            (c.name ?? '').toLowerCase().includes(needle) ||
            (c.ico ?? '').includes(needle),
        )
      : contacts
  ).slice(0, MAX_CONTACTS);

  const reset = () => {
    setQuery('');
    setMode('contacts');
    resetAres();
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const runAresSearch = () => {
    if (!trimmed) return;
    setMode('ares');
    const payload = /^[0-9]+$/.test(trimmed)
      ? { ico: [trimmed] }
      : { obchodniJmeno: trimmed };
    searchAres({ data: payload });
  };

  const handleSelectContact = (contact: ContactResponseDto) => {
    onSelectContact(contact);
    setOpen(false);
    reset();
  };

  const handleSelectAres = (result: RegistrationDataResponseDto) => {
    onSelectAres(aresToContact(result));
    setOpen(false);
    reset();
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            hasError && 'border-destructive',
          )}
        >
          <span
            className={cn('truncate', !selectedLabel && 'text-muted-foreground')}
          >
            {selectedLabel || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t('invoices.create.contactSearch.placeholder')}
            value={query}
            onValueChange={(value) => {
              setQuery(value);
              if (mode === 'ares') setMode('contacts');
            }}
          />
          <CommandList>
            {mode === 'contacts' ? (
              <>
                {filteredContacts.length > 0 && (
                  <CommandGroup
                    heading={t('invoices.create.contactSearch.contactsGroup')}
                  >
                    {filteredContacts.map((contact) => (
                      <CommandItem
                        key={contact.id}
                        value={contact.id}
                        onSelect={() => handleSelectContact(contact)}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4 shrink-0',
                            selectedContactId === contact.id
                              ? 'opacity-100'
                              : 'opacity-0',
                          )}
                        />
                        <span className="min-w-0 flex-1 truncate">
                          {contact.name}
                        </span>
                        {contact.ico && (
                          <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                            {t('invoices.create.contactSearch.ico', {
                              ico: contact.ico,
                            })}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {trimmed.length > 0 && filteredContacts.length === 0 && (
                  <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                    {t('invoices.create.contactSearch.empty')}
                  </p>
                )}
                <CommandGroup>
                  <CommandItem
                    value="__ares-search__"
                    disabled={trimmed.length === 0}
                    onSelect={runAresSearch}
                  >
                    <Search className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {trimmed
                        ? t('invoices.create.contactSearch.searchAres', {
                            query: trimmed,
                          })
                        : t('invoices.create.contactSearch.searchAresHint')}
                    </span>
                  </CommandItem>
                </CommandGroup>
              </>
            ) : (
              <>
                <CommandGroup>
                  <CommandItem
                    value="__back__"
                    onSelect={() => setMode('contacts')}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />
                    {t('invoices.create.contactSearch.back')}
                  </CommandItem>
                </CommandGroup>
                {aresLoading && (
                  <p className="flex items-center justify-center gap-2 px-3 py-6 text-center text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('invoices.create.contactSearch.aresLoading')}
                  </p>
                )}
                {!aresLoading && aresResults.length === 0 && (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {t('invoices.create.contactSearch.aresEmpty')}
                  </p>
                )}
                {!aresLoading && aresResults.length > 0 && (
                  <CommandGroup
                    heading={t('invoices.create.contactSearch.aresGroup')}
                  >
                    {aresResults.map((result, index) => (
                      <CommandItem
                        key={`${result.ico ?? ''}-${index}`}
                        value={`${result.ico ?? ''}-${index}`}
                        onSelect={() => handleSelectAres(result)}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="min-w-0 truncate">
                          {result.obchodniJmeno}
                        </span>
                        {result.ico && (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {t('invoices.create.contactSearch.ico', {
                              ico: result.ico,
                            })}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
