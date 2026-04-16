'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  FieldValues,
  Path,
  UseFormRegister,
  RegisterOptions,
  FieldError,
  useWatch,
  Control
} from 'react-hook-form'
import { cn, formatIDR } from '@/lib/utils'

interface Props<T extends FieldValues> {
  name: Path<T>
  label?: string
  register: UseFormRegister<T>
  control: Control<T>
  registerConfig?: RegisterOptions<T, Path<T>>
  error?: FieldError
  placeholder?: string
  className?: string
  min?: number
}

export default function CurrencyForm<T extends FieldValues>({
  name,
  label,
  register,
  control,
  registerConfig,
  error,
  placeholder = 'Rp 0',
  className,
  min
}: Props<T>) {

  const value = useWatch({ control, name })

  const displayValue = value ? formatIDR(value) : ''

  const mergedConfig: RegisterOptions<T, Path<T>> = {
    setValueAs: (val) => {
      if (typeof val === 'number') return val
      if (!val) return 0
      return Number(String(val).replace(/\D/g, ''))
    },
    ...(min && {
      min: {
        value: min,
        message: `Minimum ${formatIDR(min)}`,
      },
    }),
    ...registerConfig,
  }

  const { onChange, ...rest } = register(name, mergedConfig)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    const numberValue = Number(raw)

    onChange({
      target: {
        name,
        value: numberValue,
      },
    })
  }

  return (
    <div className="space-y-2">
      {label && <Label required={!!registerConfig?.required}>{label}</Label>}

      <Input
        {...rest}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          error
            ? 'border-red-500/50 focus:border-red-500'
            : 'border-[#B0B4C5]/50 focus:border-primary-50',
          className,
        )}
      />

      {error && (
        <p className="text-xs text-red-500">
          {error.message}
        </p>
      )}
    </div>
  )
}