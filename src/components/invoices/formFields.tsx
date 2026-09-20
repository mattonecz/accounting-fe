import type { ChangeEvent } from 'react';
import type {
  Control,
  FieldPath,
  FieldValues,
  UseControllerProps,
} from 'react-hook-form';

import {
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

/**
 * Field primitives shared by the invoice forms (issued, received and
 * simplified documents, create and edit alike), so a tweak to the label or
 * spacing lands on every one of them at once.
 */
export const labelClass = 'text-[11px] font-semibold text-foreground/80';
export const sectionLabelClass =
  'text-[10px] font-semibold uppercase tracking-wider text-muted-foreground';

export const RequiredMark = () => (
  <span className="ml-0.5 text-destructive">*</span>
);

interface TextFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  required?: boolean;
  rules?: UseControllerProps<T, FieldPath<T>>['rules'];
  type?: string;
  step?: string;
  placeholder?: string;
  className?: string;
  hint?: string;
  onChangeOverride?: (
    e: ChangeEvent<HTMLInputElement>,
    onChange: (...event: unknown[]) => void,
  ) => void;
}

export const TextField = <T extends FieldValues>({
  control,
  name,
  label,
  required,
  rules,
  type,
  step,
  placeholder,
  className,
  hint,
  onChangeOverride,
}: TextFieldProps<T>) => (
  <FormField
    control={control}
    name={name}
    rules={rules}
    render={({ field }) => (
      <FormItem className="space-y-1.5">
        <FormLabel className={labelClass}>
          {label}
          {required && <RequiredMark />}
        </FormLabel>
        <FormControl>
          <Input
            name={field.name}
            ref={field.ref}
            onBlur={field.onBlur}
            value={(field.value as string | number | undefined) ?? ''}
            type={type}
            step={step}
            placeholder={placeholder}
            className={className}
            onChange={
              onChangeOverride
                ? (e) => onChangeOverride(e, field.onChange)
                : field.onChange
            }
          />
        </FormControl>
        {hint && <p className="text-[11px] text-muted-foreground/80">{hint}</p>}
        <FormMessage />
      </FormItem>
    )}
  />
);

interface SelectFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  required?: boolean;
  rules?: UseControllerProps<T, FieldPath<T>>['rules'];
  placeholder?: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
}

export const SelectField = <T extends FieldValues>({
  control,
  name,
  label,
  required,
  rules,
  placeholder,
  options,
  disabled,
}: SelectFieldProps<T>) => (
  <FormField
    control={control}
    name={name}
    rules={rules}
    render={({ field }) => (
      <FormItem className="space-y-1.5">
        <FormLabel className={labelClass}>
          {label}
          {required && <RequiredMark />}
        </FormLabel>
        <Select
          value={(field.value as string) ?? ''}
          onValueChange={field.onChange}
          disabled={disabled}
        >
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {options.map((option) => (
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
);
