"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, MailCheck } from "lucide-react";
import { authService } from "@/services/auth.service";
import { ApiClientError } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

const schema = z.object({ email: z.string().min(1, "Email is required").email("Enter a valid email") });
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await authService.forgotPassword(values.email);
      setSent(true);
    } catch (err) {
      setServerError(err instanceof ApiClientError ? err.message : "Something went wrong. Please try again.");
    }
  };

  if (sent) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-success-soft text-success">
            <MailCheck className="size-6" />
          </div>
          <CardTitle className="text-lg">Check your email</CardTitle>
          <CardDescription>
            If an account exists for that address, we&apos;ve sent a link to reset your password.
          </CardDescription>
          <Link href="/login" className="mt-2 text-sm font-medium text-brand hover:underline">
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Forgot password</CardTitle>
        <CardDescription>Enter your email and we&apos;ll send you a reset link.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          {serverError && <Alert variant="error">{serverError}</Alert>}
          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" autoFocus error={!!errors.email} {...register("email")} />
          </Field>
          <Button type="submit" loading={isSubmitting} className="w-full">
            Send reset link
          </Button>
          <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" /> Back to sign in
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}
