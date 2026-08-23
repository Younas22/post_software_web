"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
}: {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("justify-start gap-2 font-normal", !value && "text-muted-foreground", className)}
        >
          <CalendarIcon className="size-4" />
          {value ? formatDate(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <DayPicker
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
          className="pos-daypicker"
        />
      </PopoverContent>
    </Popover>
  );
}

export interface DateRange {
  from?: Date;
  to?: Date;
}

export function DateRangePicker({
  value,
  onChange,
  className,
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const label =
    value.from && value.to
      ? `${formatDate(value.from)} – ${formatDate(value.to)}`
      : value.from
        ? formatDate(value.from)
        : "Custom range";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("justify-start gap-2 font-normal", !value.from && "text-muted-foreground", className)}
        >
          <CalendarIcon className="size-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <DayPicker
          mode="range"
          selected={value.from ? { from: value.from, to: value.to } : undefined}
          onSelect={(range) => onChange({ from: range?.from, to: range?.to })}
          className="pos-daypicker"
        />
      </PopoverContent>
    </Popover>
  );
}
