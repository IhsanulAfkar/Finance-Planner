'use client';

import {
  Controller,
  RegisterOptions,
  Control,
  FieldValues,
  Path
} from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';

interface Option {
  id: string | number;
  name: string;
}

// Use Generics to link 'name' and 'control' to your specific form structure
interface FormSelectProps<T extends FieldValues> {
  name: Path<T>;                  // Validates that the name exists in T
  control: Control<T>;            // Typed control from useForm
  label?: string;
  options: Option[];
  placeholder?: string;
  rules?: Omit<RegisterOptions<T, Path<T>>, 'valueAsNumber' | 'valueAsDate' | 'setValueAs'>;
  disabled?: boolean;
}

export function SelectForm<T extends FieldValues>({
  name,
  control,
  label,
  options,
  placeholder = 'Select an option',
  rules,
  disabled,
}: FormSelectProps<T>) {
  return (
    <div className="space-y-2">
      {label && (
        <Label required={!!rules?.required}>
          {label}
        </Label>
      )}

      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field, fieldState: { error } }) => (
          <>
            <Select
              onValueChange={field.onChange}
              value={field.value?.toString() || ""} // Ensure value is a string for the UI component
              disabled={disabled}
            >
              <SelectTrigger className={cn("w-full mb-0", error && "border-red-500")}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id.toString()}>
                    {opt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && (
              <p className="mt-1 text-xs text-red-500">{error.message}</p>
            )}
          </>
        )}
      />
    </div>
  );
}