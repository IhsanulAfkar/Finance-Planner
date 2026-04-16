'use client';

import { Label } from '../ui/label';
import { Input } from '../ui/input';
import {
  FieldError,
  RegisterOptions,
  UseFormRegister,
  FieldValues,
  Path,
} from 'react-hook-form';
import { cn } from '@/lib/utils';

interface InputFormProps<T extends FieldValues> {
  register: UseFormRegister<T>;
  config: {
    title?: string;
    name: Path<T>; // 🔥 key fix (typed field name)
    type: React.HTMLInputTypeAttribute;
    placeholder?: string;
    error?: FieldError;
    registerConfig?: RegisterOptions<T, Path<T>>; // 🔥 typed validation
  };
  className?: string;
}

export default function InputForm<T extends FieldValues>({
  config,
  register,
  className,
}: InputFormProps<T>) {
  return (
    <div>
      <div className="grid gap-2">
        {config.title && (
          <Label htmlFor={config.name} required={!!config.registerConfig?.required}>{config.title}</Label>
        )}

        <Input
          id={config.name}
          type={config.type}
          placeholder={config.placeholder}
          className={cn(
            config.error
              ? 'border-red-500/50 hover:border-red-500 focus:border-red-500'
              : 'focus:border-primary-50 border-[#B0B4C5]/50 hover:border-blue-50',
            className,
          )}
          {...register(config.name, config.registerConfig)}
        />
      </div>

      {config.error && (
        <p className="text-xs text-red-700">
          {config.error.message}
        </p>
      )}
    </div>
  );
}