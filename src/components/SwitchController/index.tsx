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
import { Switch } from '../ui/switch';
import { cn } from '@/lib/utils';

export interface SwitchControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName;
  control: Control<TFieldValues>;
  rules?: UseControllerProps<TFieldValues, TName>['rules'];
  label: string;
  disabled?: boolean;
  /** Extra classes appended to the FormItem wrapper (e.g. 'md:col-span-2'). */
  containerClassName?: string;
}

export const SwitchController = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  rules,
  label,
  disabled,
  containerClassName,
}: SwitchControllerProps<TFieldValues, TName>) => {
  return (
    <FormField
      control={control}
      rules={rules}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('space-y-2', containerClassName)}>
          <FormLabel>{label}</FormLabel>
          <div className="flex h-10 items-center">
            <FormControl>
              <Switch
                checked={!!field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
            </FormControl>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
