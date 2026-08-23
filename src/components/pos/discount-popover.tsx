"use client";

import { useState } from "react";
import { Percent } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

/** Cart-wide discount quick-apply — Fixed amount or Percentage, applied to every line at once. */
export function DiscountPopover({ onApply }: { onApply: (type: "fixed" | "percent", value: number) => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"fixed" | "percent">("percent");
  const [value, setValue] = useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <IconButton aria-label="Apply discount" variant="default" size="sm">
          <Percent />
        </IconButton>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <p className="mb-2 text-sm font-semibold text-foreground">Apply discount</p>
        <div className="mb-3 flex gap-1 rounded-lg bg-muted p-0.5">
          {(["percent", "fixed"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "flex-1 rounded-md py-1.5 text-xs font-medium transition-colors",
                type === t ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
              )}
            >
              {t === "percent" ? "Percentage" : "Fixed amount"}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            type="number"
            min="0"
            step="0.01"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={type === "percent" ? "e.g. 10" : "e.g. 5.00"}
          />
          <Button
            size="sm"
            onClick={() => {
              const num = Number(value);
              if (num > 0) onApply(type, num);
              setOpen(false);
              setValue("");
            }}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
