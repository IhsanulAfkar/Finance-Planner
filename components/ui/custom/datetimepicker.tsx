'use client';

import * as React from 'react';

import { cn, formatDatetoISO } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { CalendarIcon } from 'lucide-react';

interface Props {
  date: Date | undefined;
  setDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  disableBackDate?: boolean;
  disableFutureDate?: boolean;
}

export function DateTimePicker({
  date,
  setDate,
  disableBackDate = false,
  disableFutureDate = false,
}: Props) {
  const [isOpen, setIsOpen] = React.useState(false);

  // temp state while popover is open
  const [tempDate, setTempDate] = React.useState<Date | undefined>(date);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  // normalize "today" to start-of-day for safe comparisons
  const todayStart = React.useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const isDateDisabled = React.useCallback(
    (d: Date) => {
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      if (disableBackDate && dayStart < todayStart) return true;
      if (disableFutureDate && dayStart > todayStart) return true;
      return false;
    },
    [disableBackDate, disableFutureDate, todayStart],
  );

  const disabledDays = React.useMemo(() => {
    if (!disableBackDate && !disableFutureDate) return undefined;

    return (d: Date) => isDateDisabled(d);
  }, [disableBackDate, disableFutureDate, isDateDisabled]);

  // keep tempDate synced from prop when popover is NOT open
  React.useEffect(() => {
    if (!isOpen) setTempDate(date);
  }, [date, isOpen]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;
    if (isDateDisabled(selectedDate)) return;

    // preserve existing time if any
    const next = new Date(selectedDate);
    if (tempDate) {
      next.setHours(tempDate.getHours(), tempDate.getMinutes(), 0, 0);
    }
    setTempDate(next);
  };

  const handleTimeChange = (type: 'hour' | 'minute', value: string) => {
    if (!tempDate) return;

    const next = new Date(tempDate);
    if (type === 'hour') next.setHours(parseInt(value));
    if (type === 'minute') next.setMinutes(parseInt(value));

    if (isDateDisabled(next)) return;
    setTempDate(next);
  };

  const commit = (next: Date | undefined) => {
    setDate(next);
  };

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        // when closing (lose focus), commit temp value
        if (!open) {
          commit(tempDate);
        } else {
          // when opening, snapshot current prop into temp
          setTempDate(date);
        }
        setIsOpen(open);
      }}

    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? formatDatetoISO(date, true) : <span>MM/DD/YYYY hh:mm</span>}
        </Button>
      </PopoverTrigger>

      <PopoverContent side='bottom' className={cn(
        "w-auto p-0 show-scrollbar",
        // 👇 key part: never exceed available space
        "max-h-[var(--radix-popper-available-height)]",
        // "max-w-[var(--radix-popper-available-width)]",
        "overflow-auto"
      )} align="end"
        avoidCollisions
        collisionPadding={10}
        sticky="partial">
        <div className="sm:flex">
          <Calendar
            mode="single"
            selected={tempDate}
            onSelect={handleDateSelect}
            initialFocus
            disabled={disabledDays}
          />

          <div className="flex flex-col divide-y sm:h-[300px] sm:flex-row sm:divide-x sm:divide-y-0">
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex p-2 sm:flex-col">
                {hours.reverse().map((hour) => (
                  <Button
                    key={hour}
                    size="icon"
                    variant={
                      tempDate && tempDate.getHours() === hour
                        ? 'default'
                        : 'ghost'
                    }
                    className="aspect-square shrink-0 sm:w-full"
                    onClick={() => handleTimeChange('hour', hour.toString())}
                  >
                    {hour}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>

            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex p-2 sm:flex-col">
                {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                  <Button
                    key={minute}
                    size="icon"
                    variant={
                      tempDate && tempDate.getMinutes() === minute
                        ? 'default'
                        : 'ghost'
                    }
                    className="aspect-square shrink-0 sm:w-full"
                    onClick={() =>
                      handleTimeChange('minute', minute.toString())
                    }
                  >
                    {minute.toString().padStart(2, '0')}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
          </div>
        </div>

        {/* bottom actions */}
        <div className="px-4 py-2 grid grid-cols-2 gap-2">
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setTempDate(undefined);
              commit(undefined);
              setIsOpen(false);
            }}
          >
            Reset
          </Button>

          <Button
            className="w-full"
            onClick={() => {
              commit(tempDate);
              setIsOpen(false);
            }}
          >
            Submit
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
