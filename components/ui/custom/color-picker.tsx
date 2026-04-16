"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"

import { cn } from "@/lib/utils"

const colorOptions = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#64748b", // slate
]

interface Props {
  value: string
  onChange: (value: string) => void
}

export default function ColorPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* Trigger */}
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[120px] justify-between"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-md border"
              style={{ backgroundColor: value }}
            />
            <span className="text-sm">Color</span>
          </div>

          <ChevronsUpDown size={16} className="opacity-50" />
        </Button>
      </PopoverTrigger>

      {/* Content */}
      <PopoverContent className="w-[260px] p-0">
        <Command>
          <CommandInput placeholder="Search color..." />
          <CommandEmpty>No color found.</CommandEmpty>

          <CommandGroup>
            <div className="grid grid-cols-6 gap-2 p-2">
              {colorOptions.map((color) => (
                <CommandItem
                  key={color}
                  value={color}
                  onSelect={() => {
                    onChange(color)
                    setOpen(false)
                  }}
                  className="p-1 cursor-pointer"
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-md border flex items-center justify-center",
                      value === color && "ring-2 ring-black"
                    )}
                    style={{ backgroundColor: color }}
                  >
                    {value === color && (
                      <Check size={14} className="text-white" />
                    )}
                  </div>
                </CommandItem>
              ))}
            </div>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}