"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@ovr/ui/components/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@ovr/ui/components/field";
import { Input } from "@ovr/ui/components/input";

import { authClient } from "@/lib/auth/client";

const loginSchema = z.object({
  email: z.email("invalid email address"),
  password: z.string().min(1, "you must enter your password"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type LoginFormProps = {
  redirectTo: string;
};

export const LoginForm = ({ redirectTo }: LoginFormProps) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    const result = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });

    if (result.error) {
      setError("root", {
        message: result.error.message ?? "invalid email or password",
      });

      return;
    }

    window.location.href = redirectTo;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="enter your email"
            autoFocus
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">password</FieldLabel>
          <Input
            id="password"
            type="password"
            placeholder="enter your password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>
        <FieldError errors={[errors.root]} />
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting || isSubmitSuccessful}
        >
          sign in
        </Button>
      </FieldGroup>
    </form>
  );
};
