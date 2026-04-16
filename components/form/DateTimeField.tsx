'use client'

import {
  Controller,
  Control,
  FieldValues,
  Path,
  RegisterOptions,
} from 'react-hook-form'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'

interface Props<T extends FieldValues> {
  name: Path<T>
  label: string
  control: Control<T>
  registerConfig?: RegisterOptions<T, Path<T>>
  mode?: 'date' | 'datetime'
  /** 🔥 New: Determines if the form state stores a Date object or an ISO string */
  valueType?: 'date' | 'string'
}

export function DateTimeField<T extends FieldValues>({
  name,
  label,
  control,
  registerConfig,
  mode = 'datetime',
  valueType = 'date', // Default to Date object
}: Props<T>) {
  const isDateOnly = mode === 'date'

  return (
    <div className="space-y-2">
      <Label required={!!registerConfig?.required}>{label}</Label>

      <Controller
        name={name}
        control={control}
        rules={registerConfig}
        render={({ field, fieldState }) => {
          // Ensure the internal value is always a Date object for the UI components
          const dateValue = field.value ? new Date(field.value) : null

          /** * 🔥 Helper to handle value transformation 
           * Based on valueType, we send either a Date or String back to React Hook Form
           */
          const emitValue = (date: Date) => {
            if (valueType === 'string') {
              field.onChange(date.toISOString())
            } else {
              field.onChange(date)
            }
          }

          const handleDateChange = (date: Date | undefined) => {
            if (!date) return

            const newDate = dateValue ? new Date(dateValue) : new Date()

            newDate.setFullYear(date.getFullYear())
            newDate.setMonth(date.getMonth())
            newDate.setDate(date.getDate())

            if (isDateOnly) {
              newDate.setHours(0, 0, 0, 0)
            }

            emitValue(newDate)
          }

          const handleTimeChange = (time: string) => {
            const [hours, minutes] = time.split(':').map(Number)
            const newDate = dateValue ? new Date(dateValue) : new Date()

            newDate.setHours(hours)
            newDate.setMinutes(minutes)

            emitValue(newDate)
          }

          return (
            <div className="flex flex-col gap-1">
              <div className="flex gap-2">
                {/* Date Picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`flex-1 justify-start text-left font-normal ${fieldState.error ? 'border-red-500' : ''
                        }`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateValue
                        ? format(
                          dateValue,
                          isDateOnly ? 'PPP' : 'PPP HH:mm'
                        )
                        : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateValue ?? undefined}
                      onSelect={handleDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {/* Time Picker */}
                {!isDateOnly && (
                  <input
                    type="time"
                    className={`border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none ${fieldState.error ? 'border-red-500' : 'border-gray-300'
                      }`}
                    value={
                      dateValue
                        ? `${String(dateValue.getHours()).padStart(2, '0')}:${String(
                          dateValue.getMinutes()
                        ).padStart(2, '0')}`
                        : ''
                    }
                    onChange={(e) => handleTimeChange(e.target.value)}
                  />
                )}
              </div>

              {/* Error Message */}
              {fieldState.error && (
                <p className="text-xs text-red-500 mt-1">
                  {fieldState.error.message || 'This field is required'}
                </p>
              )}
            </div>
          )
        }}
      />
    </div>
  )
}