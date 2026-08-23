"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { authService } from "@/services/auth.service";
import { ApiClientError } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

type FormValues = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await authService.resetPassword({ token, email, ...values });
      setDone(true);
      setTimeout(() => router.replace("/login"), 2000);
    } catch (err) {
      setServerError(err instanceof ApiClientError ? err.message : "Something went wrong. Please try again.");
    }
  };

  if (!token || !email) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6">
          <Alert variant="error" title="Invalid or expired link">
            Request a new password reset link and try again.
          </Alert>
          <Link href="/forgot-password" className="mt-4 block text-center text-sm font-medium text-brand hover:underline">
            Request new link
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-success-soft text-success">
            <CheckCircle2 className="size-6" />
          </div>
          <CardTitle className="text-lg">Password updated</CardTitle>
          <CardDescription>Redirecting you to sign in…</CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Reset password</CardTitle>
        <CardDescription>Choose a new password for {email}.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          {serverError && <Alert variant="error">{serverError}</Alert>}
          <Field label="New password" htmlFor="password" error={errors.password?.message}>
            <Input id="password" type="password" autoComplete="new-password" autoFocus error={!!errors.password} {...register("password")} />
          </Field>
          <Field label="Confirm password" htmlFor="password_confirmation" error={errors.password_confirmation?.message}>
            <Input
              id="password_confirmation"
              type="password"
              autoComplete="new-password"
              error={!!errors.password_confirmation}
              {...register("password_confirmation")}
            />
          </Field>
          <Button type="submit" loading={isSubmitting} className="w-full">
            Reset password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
