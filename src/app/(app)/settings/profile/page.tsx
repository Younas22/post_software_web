"use client";

import { useState } from "react";
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

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Avatar name={user?.name} size="lg" />
            <div>
              <CardTitle>{user?.name}</CardTitle>
              <CardDescription>{user?.roles?.[0]?.replace("-", " ") ?? "—"}</CardDescription>
            </div>
          </div>
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
