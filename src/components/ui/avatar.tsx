"use client";

import { useState } from "react";
import { getInitials, cn } from "@/lib/utils";

const SIZE = { sm: "size-7 text-xs", md: "size-9 text-sm", lg: "size-12 text-base", xl: "size-24 text-2xl" };

/** Profile photo / logo, falling back to initials when there's no image or it fails to load. */
export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name?: string | null;
  src?: string | null;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const [failed, setFailed] = useState<string | null>(null);

  if (src && failed !== src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote/user-uploaded business logos & profile photos, not a static optimizable asset
      <img
        src={src}
        alt={name ?? ""}
        onError={() => setFailed(src)}
        className={cn("shrink-0 rounded-full bg-muted object-cover", SIZE[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-brand-soft font-semibold text-brand",
        SIZE[size],
        className
      )}
      aria-hidden={!name}
    >
      {getInitials(name)}
    </div>
  );
}
