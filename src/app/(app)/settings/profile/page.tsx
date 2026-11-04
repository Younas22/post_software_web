"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth/auth-context";
import { authService } from "@/services/auth.service";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { ApiClientError } from "@/lib/api/client";
import { passwordSchema as newPasswordSchema } from "@/lib/validation";
import { Camera, Trash2 } from "lucide-react";

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

/** Profile photo — shown in the top bar, profile menu and sidebar once saved. */
function ProfilePhotoCard() {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const role = user?.is_super_admin ? "Super Admin" : user?.roles?.[0]?.replace(/-/g, " ");

  const choose = async (file: File | undefined) => {
    if (!inputRef.current) return;
    inputRef.current.value = "";
    if (!file) return;
    setError(null);
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setError("Please choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError("The photo must be 2 MB or smaller.");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    setBusy("upload");
    try {
      await authService.uploadAvatar(file);
      await refresh();
      toast({ title: "Profile photo updated", variant: "success" });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.fieldError("avatar") ?? err.message : "Upload failed. Please try again.");
    } finally {
      setPreview(null);
      URL.revokeObjectURL(url);
      setBusy(null);
    }
  };

  const remove = async () => {
    setError(null);
    setBusy("remove");
    try {
      await authService.removeAvatar();
      await refresh();
      toast({ title: "Profile photo removed", variant: "success" });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="h-20 bg-brand/90" aria-hidden />
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative -mt-12 w-fit shrink-0">
          <Avatar name={user?.name} src={preview ?? user?.avatar_url} size="xl" className="ring-4 ring-card" />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy !== null}
            className="absolute bottom-0.5 right-0.5 flex size-9 items-center justify-center rounded-full border-2 border-card bg-brand text-brand-foreground shadow-sm transition-colors hover:bg-brand-hover disabled:opacity-60"
            aria-label="Change profile photo"
          >
            <Camera className="size-4" />
          </button>
        </div>
        <div className="min-w-0 flex-1 sm:pt-1">
          <p className="truncate text-lg font-semibold text-foreground">{user?.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {user?.email}
            {role && <span className="capitalize"> · {role}</span>}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">JPG, PNG or WebP, up to 2 MB. A square photo looks best.</p>
          {error && <p className="mt-2 text-sm text-error">{error}</p>}
        </div>
        <div className="flex shrink-0 gap-2 sm:pt-1">
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => choose(e.target.files?.[0])} />
          <Button variant="outline" onClick={() => inputRef.current?.click()} loading={busy === "upload"} disabled={busy !== null}>
            <Camera /> {user?.avatar_url ? "Change photo" : "Upload photo"}
          </Button>
          {user?.avatar_url && (
            <Button variant="ghost" onClick={remove} loading={busy === "remove"} disabled={busy !== null} className="text-error hover:text-error">
              <Trash2 /> Remove
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
});
type ProfileValues = z.infer<typeof profileSchema>;

const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    password: newPasswordSchema,
    password_confirmation: z.string(),
  })
  .refine((d) => d.password === d.password_confirmation, { message: "Passwords do not match", path: ["password_confirmation"] });
type PasswordValues = z.infer<typeof changePasswordSchema>;

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: { name: user?.name ?? "", email: user?.email ?? "" },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current_password: "", password: "", password_confirmation: "" },
  });

  const submitProfile = async (values: ProfileValues) => {
    setProfileError(null);
    try {
      await authService.updateProfile(values);
      await refresh();
      toast({ title: "Profile updated", variant: "success" });
    } catch (err) {
      setProfileError(err instanceof ApiClientError ? err.message : "Something went wrong.");
    }
  };

  const submitPassword = async (values: PasswordValues) => {
    setPasswordError(null);
    try {
      await authService.updatePassword(values);
      toast({ title: "Password updated", variant: "success" });
      passwordForm.reset();
    } catch (err) {
      if (err instanceof ApiClientError && err.fieldError("current_password")) {
        passwordForm.setError("current_password", { message: err.fieldError("current_password") });
      } else {
        setPasswordError(err instanceof ApiClientError ? err.message : "Something went wrong.");
      }
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Breadcrumb items={[{ label: "Settings", href: "/settings" }, { label: "Profile" }]} />
        <h1 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">Profile</h1>
      </div>

      <ProfilePhotoCard />

      <Card>
        <CardHeader>
          <CardTitle>Personal details</CardTitle>
          <CardDescription>Your name and the email you sign in with.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(submitProfile)} className="flex flex-col gap-4" noValidate>
            {profileError && <Alert variant="error">{profileError}</Alert>}
            <Field label="Name" required error={profileForm.formState.errors.name?.message}>
              <Input {...profileForm.register("name")} error={!!profileForm.formState.errors.name} />
            </Field>
            <Field label="Email" required error={profileForm.formState.errors.email?.message}>
              <Input type="email" {...profileForm.register("email")} error={!!profileForm.formState.errors.email} />
            </Field>
            <div className="flex justify-end">
              <Button type="submit" loading={profileForm.formState.isSubmitting}>
                Save changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(submitPassword)} className="flex flex-col gap-4" noValidate>
            {passwordError && <Alert variant="error">{passwordError}</Alert>}
            <Field label="Current password" required error={passwordForm.formState.errors.current_password?.message}>
              <Input type="password" {...passwordForm.register("current_password")} error={!!passwordForm.formState.errors.current_password} />
            </Field>
            <Field
              label="New password"
              required
              error={passwordForm.formState.errors.password?.message}
              hint={passwordForm.formState.errors.password ? undefined : "At least 10 characters, with upper/lowercase letters, a number, and a symbol"}
            >
              <Input type="password" {...passwordForm.register("password")} error={!!passwordForm.formState.errors.password} />
            </Field>
            <Field label="Confirm new password" required error={passwordForm.formState.errors.password_confirmation?.message}>
              <Input type="password" {...passwordForm.register("password_confirmation")} error={!!passwordForm.formState.errors.password_confirmation} />
            </Field>
            <div className="flex justify-end">
              <Button type="submit" loading={passwordForm.formState.isSubmitting}>
                Update password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
