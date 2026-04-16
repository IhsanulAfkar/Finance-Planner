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
import { iconOptions } from "@/components/pages/dashboard/setting/icon-options"

interface Props {
  value: string | null
  onChange: (value: string) => void
}

export default function IconSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)

  const selectedIcon =
    iconOptions.find((i) => i.name === value)?.icon

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* Trigger */}
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className=" justify-between"
        >
          <div className="flex items-center gap-2">
            {selectedIcon && (() => {
              const Icon = selectedIcon
              return <Icon size={18} />
            })()}
            <span className="capitalize">
              {value || "Select icon"}
            </span>
          </div>

          <ChevronsUpDown className="opacity-50" size={16} />
        </Button>
      </PopoverTrigger>

      {/* Content */}
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search icon..." />
          <CommandEmpty>No icon found.</CommandEmpty>

          <CommandGroup>
            <div className="grid grid-cols-6 gap-2 p-2">
              {iconOptions.map(({ name, icon: Icon }) => (
                <CommandItem
                  key={name}
                  value={name}
                  onSelect={() => {
                    onChange(name)
                    setOpen(false)
                  }}
                  className="p-2 flex items-center justify-center cursor-pointer"
                >
                  <div
                    className={cn(
                      "p-2 rounded-lg border flex items-center justify-center w-full",
                      value === name
                        ? "bg-purple-100 border-purple-500"
                        : "border-gray-200"
                    )}
                  >
                    <Icon size={18} />
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