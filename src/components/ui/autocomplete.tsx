import * as React from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useCompanySearch } from '@/api/companies/companies';
import { useEffect } from 'react';
import { EkonomickySubjektDto } from '@/api/model/ekonomickySubjektDto';
import { Label } from './label';
import { CreateCompanyDto } from '@/api/model';

interface AutocompleteProps {
  onChange: (value: CreateCompanyDto) => void;
  debounceMs?: number;
  disabled?: boolean;
  className?: string;
}

export function Autocomplete({
  onChange,
  debounceMs = 300,
  disabled = false,
  className,
}: AutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<EkonomickySubjektDto[]>(
    [],
  );
  const [loading, setLoading] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const debounceTimerRef = React.useRef<NodeJS.Timeout>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const { mutate: searchCompanies, status, data, error } = useCompanySearch();

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);

    if (!open && newValue.length > 0) {
      setOpen(true);
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (newValue.length === 0) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      const data = /^[0-9]+$/.test(newValue)
        ? { ico: [newValue] }
        : { obchodniJmeno: newValue };
      searchCompanies({ data });
    }, debounceMs);
  };

  useEffect(() => {
    if (status === 'success') {
      setSuggestions(data?.data?.ekonomickeSubjekty);
    } else if (status === 'error') {
      console.log(error);
      setSuggestions([]);
    }
    setLoading(false);
  }, [status, error]);

  const handleSelect = (data: EkonomickySubjektDto) => {
    setInputValue('');
    setSuggestions([]);
    setOpen(false);

    if (typeof data === 'object' && data !== null && 'ico' in data) {
      const streetName = data.sidlo.nazevUlice || data.sidlo.nazevCastiObce;
      const baseAddress = streetName + ' ' + data.sidlo.cisloDomovni;
      onChange({
        name: data.obchodniJmeno,
        country: 'CZ',
        ico: data.ico,
        dic: data.dic,
        city: data.sidlo.nazevObce,
        street: data.sidlo.cisloOrientacni
          ? baseAddress + '/' + data.sidlo.cisloOrientacni
          : baseAddress,
        psc: data.sidlo.psc.toString(),
      });
    }
  };

  return (
    <div
      ref={wrapperRef}
      className="grid w-full grid-cols-[200px_minmax(0,1fr)] items-start gap-4"
    >
      <Label className="pt-2 text-right">Vyhledat v ARES</Label>
      <div className="relative min-w-0">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (inputValue.length > 0 && suggestions.length > 0) {
              setOpen(true);
            }
          }}
          placeholder="Zadejte název nebo celé IČO"
          disabled={disabled}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            className,
          )}
        />
        {open && (
          <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground">
            <Command shouldFilter={false} className="rounded-md">
              <CommandList>
                {loading && (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Loading suggestions...
                  </div>
                )}
                {!loading &&
                  suggestions.length === 0 &&
                  inputValue.length > 0 && (
                    <CommandEmpty>No suggestions found.</CommandEmpty>
                  )}
                {!loading && suggestions.length > 0 && (
                  <CommandGroup>
                    {suggestions.map((suggestion, index) => (
                      <CommandItem
                        key={index}
                        value={suggestion.obchodniJmeno}
                        onSelect={() => handleSelect(suggestion)}
                        className="cursor-pointer"
                      >
                        {suggestion.obchodniJmeno}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </div>
        )}
      </div>
    </div>
  );
}
