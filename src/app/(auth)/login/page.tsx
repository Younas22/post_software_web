"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiClientError } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await login(values.email, values.password);
      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (Object.keys(err.errors).length > 0) {
          Object.entries(err.errors).forEach(([field, messages]) => {
            if (field === "email" || field === "password") {
              setError(field, { message: messages[0] });
            }
          });
        } else {
          setServerError(err.message);
        }
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>Welcome back — enter your details to continue.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          {serverError && <Alert variant="error">{serverError}</Alert>}

          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              error={!!errors.email}
              {...register("email")}
            />
          </Field>

          <Field label="Password" htmlFor="password" error={errors.password?.message}>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              error={!!errors.password}
              {...register("password")}
            />
          </Field>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm font-medium text-brand hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" loading={isSubmitting} className="mt-1 w-full">
            Sign in
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
