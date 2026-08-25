"use client";

import { useEffect, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert } from "@/components/ui/alert";
import { useBranchMutations } from "@/hooks/use-branches";
import { useToast } from "@/components/ui/toast";
import { ApiClientError } from "@/lib/api/client";
import type { Branch } from "@/types";

export function BranchModal({ open, onOpenChange, branch }: { open: boolean; onOpenChange: (open: boolean) => void; branch?: Branch | null }) {
  const { toast } = useToast();
  const { create, update } = useBranchMutations();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Resets the form to the target branch's values (or blank, for create)
  // each time the modal opens.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) {
      setName(branch?.name ?? "");
      setCode(branch?.code ?? "");
      setPhone(branch?.phone ?? "");
      setAddress(branch?.address ?? "");
      setActive(branch ? branch.status === "active" : true);
      setError(null);
      setFieldErrors({});
    }
  }, [open, branch]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const submit = async () => {
    setError(null);
    setFieldErrors({});
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    const payload = { name: name.trim(), code: code || null, phone: phone || null, address: address || null, status: active ? ("active" as const) : ("inactive" as const) };
    try {
      if (branch) {
        await update.mutateAsync({ id: branch.id, payload });
        toast({ title: "Branch updated", variant: "success" });
      } else {
        await create.mutateAsync(payload);
        toast({ title: "Branch created", variant: "success" });
      }
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiClientError) {
        // Surface the REAL per-field reason (e.g. "business_id: A business
        // could not be determined for this request") instead of only the
        // generic "The given data was invalid." — that message alone gives
        // the user nothing to act on.
        setFieldErrors(err.errors);
        const flat = Object.values(err.errors).flat();
        setError(flat.length > 0 ? flat.join(" ") : err.message);
      } else {
        setError("Something went wrong.");
      }
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="md">
        <ModalHeader>
          <ModalTitle>{branch ? "Edit Branch" : "New Branch"}</ModalTitle>
        </ModalHeader>
        <div className="flex flex-col gap-4">
          {error && <Alert variant="error">{error}</Alert>}
          <Field label="Name" required error={fieldErrors.name?.[0]}>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus error={!!fieldErrors.name} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Code" hint={fieldErrors.code ? undefined : "Optional short identifier"} error={fieldErrors.code?.[0]}>
              <Input value={code} onChange={(e) => setCode(e.target.value)} error={!!fieldErrors.code} />
            </Field>
            <Field label="Phone" error={fieldErrors.phone?.[0]}>
              <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} error={!!fieldErrors.phone} />
            </Field>
          </div>
          <Field label="Address" error={fieldErrors.address?.[0]}>
            <Textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} error={!!fieldErrors.address} />
          </Field>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <span className="text-sm font-medium text-foreground">Active</span>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} loading={create.isPending || update.isPending}>
            {branch ? "Save changes" : "Create branch"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
