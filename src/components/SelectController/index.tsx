import React from 'react';
import {
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
} from '../ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { cn } from '@/lib/utils';

const CLEAR_SELECT_VALUE = '__none__';

interface SelectOption {
  value: string;
  label: string;
}

export interface SelectControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName;
  control: Control<TFieldValues>;
  rules?: UseControllerProps<TFieldValues, TName>['rules'];
  label: string;
  placeholder?: string;
  options: SelectOption[];
  triggerClassName?: string;
  /** 'horizontal' (default) – inline label left. 'vertical' – label above, full-width trigger. */
  variant?: 'horizontal' | 'vertical';
  /** Extra classes appended to the FormItem wrapper (e.g. 'md:col-span-2'). */
  containerClassName?: string;
  disabled?: boolean;
  /** When provided, prepends a "none" option that stores '' in the form. */
  clearLabel?: string;
  /** Optional hint text rendered below the select. */
  description?: React.ReactNode;
}

export const SelectController = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  rules,
  label,
  placeholder,
  options,
  triggerClassName,
  variant = 'horizontal',
  containerClassName,
  disabled,
  clearLabel,
  description,
}: SelectControllerProps<TFieldValues, TName>) => {
  const effectiveTriggerClass =
    triggerClassName ?? (variant === 'vertical' ? 'w-full' : 'w-[350px]');

  return (
    <FormField
      control={control}
      rules={rules}
      name={name}
      render={({ field }) => {
        const selectValue =
          clearLabel && !field.value ? CLEAR_SELECT_VALUE : (field.value ?? '');
        const handleChange = (value: string) => {
          field.onChange(
            clearLabel && value === CLEAR_SELECT_VALUE ? '' : value,
          );
        };

        const selectContent = (
          <SelectContent>
            {clearLabel && (
              <SelectItem value={CLEAR_SELECT_VALUE}>{clearLabel}</SelectItem>
            )}
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        );

        if (variant === 'vertical') {
          return (
            <FormItem className={cn('space-y-2', containerClassName)}>
              <FormLabel>{label}</FormLabel>
              <Select
                disabled={disabled}
                onValueChange={handleChange}
                value={selectValue}
              >
                <FormControl>
                  <SelectTrigger className={effectiveTriggerClass}>
                    <SelectValue placeholder={placeholder} />
                  </SelectTrigger>
                </FormControl>
                {selectContent}
              </Select>
              {description != null && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
              <FormMessage />
            </FormItem>
          );
        }

        return (
          <FormItem
            className={cn('flex items-center gap-4', containerClassName)}
          >
            <FormLabel className="w-[200px] text-right">{label}</FormLabel>
            <div className="flex flex-col">
              <Select
                disabled={disabled}
                onValueChange={handleChange}
                value={selectValue}
              >
                <FormControl>
                  <SelectTrigger className={effectiveTriggerClass}>
                    <SelectValue placeholder={placeholder} />
                  </SelectTrigger>
                </FormControl>
                {selectContent}
              </Select>
              {description != null && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
              <FormMessage />
            </div>
          </FormItem>
        );
      }}
    />
  );
};
