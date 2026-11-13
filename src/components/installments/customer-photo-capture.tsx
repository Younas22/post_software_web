"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImageUp, RotateCcw, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from "@/components/ui/modal";
import { Alert } from "@/components/ui/alert";

const MAX_BYTES = 3 * 1024 * 1024;
const TYPES = /^image\/(jpeg|png|webp)$/;
/** Passport-style 3:4 crop, the same proportion the receipt prints it at. */
const OUT_W = 480;
const OUT_H = 640;

/** Center-crops any image/video frame to 3:4 and returns a JPEG blob. */
function cropToBlob(source: CanvasImageSource, width: number, height: number): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = OUT_W;
  canvas.height = OUT_H;
  const target = OUT_W / OUT_H;
  let sw = width;
  let sh = height;
  if (width / height > target) sw = height * target;
  else sh = width / target;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(source, (width - sw) / 2, (height - sh) / 2, sw, sh, 0, 0, OUT_W, OUT_H);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not encode photo."))), "image/jpeg", 0.88));
}

/**
 * Customer photograph for installment onboarding: take it with a webcam
 * (USB or laptop) or pick an existing image. The result is held locally
 * (preview) until the parent saves it — see NewPlanForm.
 */
export function CustomerPhotoCapture({
  savedUrl,
  value,
  onChange,
  disabled,
}: {
  /** Object URL of the photo already on file (or null). */
  savedUrl: string | null;
  /** The newly captured/picked photo, not yet uploaded. */
  value: Blob | null;
  onChange: (blob: Blob | null) => void;
  disabled?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const pickFile = async (file: File | undefined) => {
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    setError(null);
    if (!TYPES.test(file.type)) return setError("Please choose a JPG, PNG or WebP image.");
    if (file.size > MAX_BYTES * 3) return setError("That image is too large (max 9 MB before cropping).");
    try {
      const bitmap = await createImageBitmap(file);
      onChange(await cropToBlob(bitmap, bitmap.width, bitmap.height));
      bitmap.close();
    } catch {
      setError("That image couldn't be read.");
    }
  };

  const shown = previewUrl ?? savedUrl;

  return (
    <div className="flex items-start gap-4">
      <div className="flex h-32 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element -- local preview / private object URL
          <img src={shown} alt="Customer" className="size-full object-cover" />
        ) : (
          <UserRound className="size-10 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-sm font-medium text-foreground">Customer photo</p>
        <p className="text-xs text-muted-foreground">Printed on every recovery receipt. Take it with the webcam or upload a JPG, PNG or WebP.</p>
        {value && <p className="text-xs font-medium text-warning">New photo — saved when you create the plan.</p>}
        {error && <p className="text-xs text-error">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => setCameraOpen(true)}>
            <Camera /> Take photo
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => fileRef.current?.click()}>
            <ImageUp /> Upload
          </Button>
          {value && (
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)}>
              <Trash2 /> Discard
            </Button>
          )}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => void pickFile(e.target.files?.[0])} />
        </div>
      </div>

      <WebcamModal
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        onCapture={(blob) => {
          onChange(blob);
          setCameraOpen(false);
        }}
      />
    </div>
  );
}

function WebcamModal({ open, onOpenChange, onCapture }: { open: boolean; onOpenChange: (o: boolean) => void; onCapture: (b: Blob) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [shot, setShot] = useState<{ blob: Blob; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active: MediaStream | null = null;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(null);
    setShot(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser can't access a camera. Use Upload instead.");
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        active = s;
        setStream(s);
      })
      .catch((err: Error) => setError(err.name === "NotAllowedError" ? "Camera permission was denied. Allow it in the browser, or use Upload." : "No camera found. Connect a webcam, or use Upload."));
    return () => {
      cancelled = true;
      active?.getTracks().forEach((t) => t.stop());
      setStream(null);
    };
  }, [open]);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream, shot]);

  useEffect(() => () => {
    if (shot) URL.revokeObjectURL(shot.url);
  }, [shot]);

  const capture = async () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const blob = await cropToBlob(v, v.videoWidth, v.videoHeight);
    setShot({ blob, url: URL.createObjectURL(blob) });
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="lg">
        <ModalHeader>
          <ModalTitle>Take customer photo</ModalTitle>
          <ModalDescription>Ask the customer to face the camera; the photo is cropped to passport size.</ModalDescription>
        </ModalHeader>
        {error ? (
          <Alert variant="error">{error}</Alert>
        ) : (
          <div className="flex justify-center">
            <div className="relative aspect-[3/4] h-[52vh] overflow-hidden rounded-xl bg-black">
              {shot ? (
                // eslint-disable-next-line @next/next/no-img-element -- local capture preview
                <img src={shot.url} alt="Captured" className="size-full object-cover" />
              ) : (
                <video ref={videoRef} autoPlay playsInline muted className="size-full -scale-x-100 object-cover" />
              )}
            </div>
          </div>
        )}
        <ModalFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {shot ? (
            <>
              <Button variant="outline" onClick={() => setShot(null)}>
                <RotateCcw /> Retake
              </Button>
              <Button onClick={() => onCapture(shot.blob)}>Use this photo</Button>
            </>
          ) : (
            <Button onClick={() => void capture()} disabled={!stream}>
              <Camera /> Capture
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
