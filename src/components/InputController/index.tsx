import { ChangeEvent } from 'react';
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
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';

export interface InputControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName;
  control: Control<TFieldValues>;
  rules?: UseControllerProps<TFieldValues, TName>['rules'];
  label: string;
  placeholder?: string;
  type?: string;
  step?: string;
  className?: string;
  /** 'horizontal' (default) – inline label left, fixed-width input. 'vertical' – label above, full-width input. */
  variant?: 'horizontal' | 'vertical';
  /** Extra classes appended to the FormItem wrapper (e.g. 'md:col-span-2'). */
  containerClassName?: string;
  onChangeOverride?: (
    e: ChangeEvent<HTMLInputElement>,
    fieldOnChange: (...event: unknown[]) => void,
  ) => void;
}

export const InputController = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  rules,
  label,
  placeholder,
  type,
  step,
  className,
  variant = 'horizontal',
  containerClassName,
  onChangeOverride,
}: InputControllerProps<TFieldValues, TName>) => {
  return (
    <FormField
      control={control}
      rules={rules}
      name={name}
      render={({ field }) => {
        if (variant === 'vertical') {
          return (
            <FormItem className={cn('space-y-2', containerClassName)}>
              <FormLabel>{label}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={placeholder}
                  type={type}
                  step={step}
                  className={cn('w-full', className)}
                  onChange={
                    onChangeOverride
                      ? (e) => onChangeOverride(e, field.onChange)
                      : field.onChange
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }

        return (
          <FormItem className={cn('flex items-center gap-4', containerClassName)}>
            <FormLabel className="w-[200px] text-right">{label}</FormLabel>
            <div className="flex flex-col">
              <FormControl>
                <Input
                  {...field}
                  placeholder={placeholder}
                  type={type}
                  step={step}
                  className={cn('w-[250px]', className)}
                  onChange={
                    onChangeOverride
                      ? (e) => onChangeOverride(e, field.onChange)
                      : field.onChange
                  }
                />
              </FormControl>
              <FormMessage />
            </div>
          </FormItem>
        );
      }}
    />
  );
};
