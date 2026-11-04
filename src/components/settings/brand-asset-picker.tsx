"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImageIcon, RotateCcw, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, getInitials } from "@/lib/utils";

export interface AssetValue {
  /** A newly chosen file (not yet saved). */
  file: File | null;
  /** The user asked to remove the saved image. */
  remove: boolean;
}

const RULES = {
  logo: { accept: "image/png,image/jpeg,image/webp", types: /^image\/(png|jpeg|webp)$/, maxBytes: 2 * 1024 * 1024, hint: "PNG, JPG or WebP · up to 2 MB · square works best" },
  favicon: {
    accept: ".png,.ico,.jpg,.jpeg,.webp,image/png,image/x-icon,image/vnd.microsoft.icon,image/jpeg,image/webp",
    types: /^image\/(png|x-icon|vnd\.microsoft\.icon|jpeg|webp)$/,
    maxBytes: 1024 * 1024,
    hint: "PNG or ICO · up to 1 MB · 64×64 or 512×512 square",
  },
} as const;

/**
 * Upload tile for the business logo or browser-tab favicon, with a live
 * preview of how it will look (sidebar brand / browser tab) before saving.
 */
export function BrandAssetPicker({
  kind,
  savedUrl,
  value,
  onChange,
  businessName,
  fallbackUrl,
  disabled,
}: {
  kind: "logo" | "favicon";
  savedUrl: string | null | undefined;
  value: AssetValue;
  onChange: (value: AssetValue) => void;
  businessName: string;
  /** Shown in the preview when nothing is set (the favicon falls back to the logo). */
  fallbackUrl?: string | null;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const rules = RULES[kind];

  const objectUrl = useMemo(() => (value.file ? URL.createObjectURL(value.file) : null), [value.file]);
  useEffect(() => () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  const shown = objectUrl ?? (value.remove ? null : savedUrl ?? null);
  const dirty = value.file !== null || value.remove;
  const previewSrc = shown ?? fallbackUrl ?? null;

  const pick = (file: File | undefined) => {
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    // Some browsers report .ico files with an empty type — trust the extension then.
    const okType = rules.types.test(file.type) || (kind === "favicon" && /\.ico$/i.test(file.name));
    if (!okType) {
      setError(kind === "logo" ? "Please choose a PNG, JPG or WebP image." : "Please choose a PNG, ICO, JPG or WebP image.");
      return;
    }
    if (file.size > rules.maxBytes) {
      setError(`The file must be ${rules.maxBytes / (1024 * 1024)} MB or smaller.`);
      return;
    }
    setError(null);
    onChange({ file, remove: false });
  };

  return (
    <div className="flex flex-col rounded-xl border border-border p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{kind === "logo" ? "Logo" : "Favicon"}</p>
          <p className="text-xs text-muted-foreground">{kind === "logo" ? "Shown in the sidebar, menus and login." : "The small icon on the browser tab."}</p>
        </div>
        {dirty && (
          <span className="shrink-0 rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-medium text-warning">Unsaved</span>
        )}
      </div>

      {/* Preview */}
      <div className="mt-4 flex h-[92px] items-center justify-center rounded-lg bg-muted/60 px-3">
        {kind === "logo" ? (
          <div className="flex min-w-0 items-center gap-3 rounded-xl bg-card px-3 py-2.5 shadow-xs ring-1 ring-border">
            {shown ? (
              // eslint-disable-next-line @next/next/no-img-element -- local preview / user-uploaded asset
              <img src={shown} alt="" className="size-10 shrink-0 rounded-xl border border-black/5 bg-white object-contain p-0.5" />
            ) : (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand text-sm font-bold text-brand-foreground">{getInitials(businessName)}</div>
            )}
            <span className="truncate text-sm font-semibold text-foreground">{businessName || "Your business"}</span>
          </div>
        ) : (
          <div className="w-full max-w-[240px]">
            <div className="flex items-center gap-2 rounded-t-lg border border-b-0 border-border bg-card px-3 py-2 shadow-xs">
              {previewSrc ? (
                // eslint-disable-next-line @next/next/no-img-element -- local preview / user-uploaded asset
                <img src={previewSrc} alt="" className="size-4 shrink-0 object-contain" />
              ) : (
                <ImageIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <span className="truncate text-xs text-foreground">{businessName || "Your business"}</span>
              <X className="ml-auto size-3 shrink-0 text-muted-foreground" aria-hidden />
            </div>
            <div className="h-3 rounded-b-sm border border-t-0 border-border bg-card" />
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">{rules.hint}</p>
      {kind === "favicon" && !shown && (
        <p className="mt-1 text-xs text-muted-foreground">{fallbackUrl ? "Not set — your logo is used on the tab (as shown)." : "Not set — the default icon is used."}</p>
      )}
      {error && <p className="mt-1 text-xs text-error">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        <input ref={inputRef} type="file" accept={rules.accept} className="hidden" onChange={(e) => pick(e.target.files?.[0])} disabled={disabled} />
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => inputRef.current?.click()}>
          <Upload /> {shown ? "Replace" : "Upload"}
        </Button>
        {dirty ? (
          <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => onChange({ file: null, remove: false })}>
            <RotateCcw /> Undo
          </Button>
        ) : (
          savedUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              className={cn("text-error hover:text-error")}
              onClick={() => onChange({ file: null, remove: true })}
            >
              <Trash2 /> Remove
            </Button>
          )
        )}
      </div>
    </div>
  );
}
