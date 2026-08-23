"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from "@/components/ui/modal";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { ApiClientError } from "@/lib/api/client";
import type { Category, Brand } from "@/types";

type Entity = Category | Brand;
interface Payload {
  name: string;
  status: "active" | "inactive";
}

export function NameStatusManager({
  label,
  pluralLabel,
  items,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
  isMutating,
}: {
  label: string;
  /** e.g. "Categories" for label="Category" — irregular plurals can't be derived by appending "s". */
  pluralLabel: string;
  items: Entity[];
  isLoading: boolean;
  onCreate: (payload: Payload) => Promise<unknown>;
  onUpdate: (id: number, payload: Payload) => Promise<unknown>;
  onDelete: (id: number) => Promise<unknown>;
  isMutating?: boolean;
}) {
  const { toast } = useToast();
  const { confirm, dialog } = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Entity | null>(null);
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setActive(true);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (item: Entity) => {
    setEditing(item);
    setName(item.name);
    setActive(item.status === "active");
    setError(null);
    setModalOpen(true);
  };

  const submit = async () => {
    setError(null);
    const payload: Payload = { name: name.trim(), status: active ? "active" : "inactive" };
    if (!payload.name) {
      setError("Name is required.");
      return;
    }
    try {
      if (editing) {
        await onUpdate(editing.id, payload);
        toast({ title: `${label} updated`, variant: "success" });
      } else {
        await onCreate(payload);
        toast({ title: `${label} created`, variant: "success" });
      }
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Something went wrong.");
    }
  };

  const handleDelete = async (item: Entity) => {
    const ok = await confirm({
      title: `Delete "${item.name}"?`,
      description: "This can't be undone. Products using it will keep their existing assignment.",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await onDelete(item.id);
      toast({ title: `${label} deleted`, variant: "success" });
    } catch (err) {
      toast({
        title: `Couldn't delete ${label.toLowerCase()}`,
        description: err instanceof ApiClientError ? err.message : undefined,
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? label.toLowerCase() : pluralLabel.toLowerCase()}
        </p>
        <Button size="sm" onClick={openCreate}>
          <Plus /> New {label}
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        {isLoading ? (
          <TableSkeleton columns={3} rows={4} />
        ) : items.length === 0 ? (
          <EmptyState title={`No ${pluralLabel.toLowerCase()} yet`} description={`Create your first ${label.toLowerCase()} to start organizing products.`} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === "active" ? "success" : "neutral"}>{item.status === "active" ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <IconButton aria-label={`Edit ${item.name}`} variant="ghost" size="sm" onClick={() => openEdit(item)}>
                        <Pencil />
                      </IconButton>
                      <IconButton aria-label={`Delete ${item.name}`} variant="danger" size="sm" onClick={() => handleDelete(item)}>
                        <Trash2 />
                      </IconButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Modal open={modalOpen} onOpenChange={setModalOpen}>
        <ModalContent size="sm">
          <ModalHeader>
            <ModalTitle>{editing ? `Edit ${label}` : `New ${label}`}</ModalTitle>
          </ModalHeader>
          <div className="flex flex-col gap-4">
            <Field label="Name" required error={error ?? undefined}>
              <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus error={!!error} />
            </Field>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
              <span className="text-sm font-medium text-foreground">Active</span>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} loading={isMutating}>
              {editing ? "Save changes" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      {dialog}
    </div>
  );
}
