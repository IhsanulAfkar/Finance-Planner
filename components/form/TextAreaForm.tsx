'use client';

import {
  Control,
  FieldValues,
  Path,
  Controller,
  RegisterOptions
} from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface TextAreaFormProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  rules?: Omit<RegisterOptions<T, Path<T>>, 'valueAsNumber' | 'valueAsDate' | 'setValueAs'>;
  className?: string;
}

export function TextAreaForm<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  rows = 4,
  disabled,
  rules,
  className,
}: TextAreaFormProps<T>) {
  return (
    <div className="space-y-2 w-full">
      {label && (
        <Label
          htmlFor={name}
          required={!!rules?.required}
          className="text-sm font-medium"
        >
          {label}
        </Label>
      )}

      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field, fieldState: { error } }) => (
          <div className="relative">
            <Textarea
              {...field}
              id={name}
              rows={rows}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                "resize-none", // Standard practice: prevent manual resizing to keep UI clean
                error
                  ? "border-red-500 focus-visible:ring-red-500"
                  : "border-gray-300 focus-visible:ring-green-500",
                className
              )}
            />

            {error && (
              <p className="mt-1 text-xs text-red-500 animate-in fade-in slide-in-from-top-1">
                {error.message || 'This field is required'}
              </p>
            )}
          </div>
        )}
      />
    </div>
  );
}