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
}: InputControllerProps<TFieldValues, TName>) => {
  return (
    <FormField
      control={control}
      rules={rules}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center gap-4">
          <FormLabel className="w-[200px] text-right">{label}</FormLabel>
          <div className="flex flex-col">
            <FormControl>
              <Input
                {...field}
                placeholder={placeholder}
                type={type}
                className="w-[250px]"
              />
            </FormControl>
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  );
};
