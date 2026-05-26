import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Button } from "@ovr/ui/components/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@ovr/ui/components/field";
import { Input } from "@ovr/ui/components/input";
import type { SetupFormValues } from "./schema";

type AdminStepProps = {
  register: UseFormRegister<SetupFormValues>;
  errors: Pick<FieldErrors<SetupFormValues>, "name" | "email" | "password" | "confirmPassword">;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  onBack: () => void;
  isPending: boolean;
  rootError?: string;
};

export const AdminStep = ({
  register,
  errors,
  onSubmit,
  onBack,
  isPending,
  rootError,
}: AdminStepProps) => (
  <form onSubmit={onSubmit} noValidate>
    <FieldGroup>
      <Field data-invalid={!!errors.name}>
        <FieldLabel htmlFor="name">name</FieldLabel>
        <Input
          id="name"
          placeholder="enter your name"
          autoFocus
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        <FieldError errors={[errors.name]} />
      </Field>
      <Field data-invalid={!!errors.email}>
        <FieldLabel htmlFor="email">email</FieldLabel>
        <Input
          id="email"
          type="email"
          placeholder="enter your email"
          autoComplete="email"
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
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          placeholder="enter your password"
          {...register("password")}
        />
        <FieldError errors={[errors.password]} />
      </Field>
      <Field data-invalid={!!errors.confirmPassword}>
        <FieldLabel htmlFor="confirmPassword">confirm password</FieldLabel>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.confirmPassword}
          placeholder="confirm your password"
          {...register("confirmPassword")}
        />
        <FieldError errors={[errors.confirmPassword]} />
      </Field>
      {rootError && (
        <p role="alert" className="text-label text-destructive">
          {rootError}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <Button type="submit" size="lg" className="w-full" disabled={isPending}>
          {isPending ? "creating…" : "create"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="w-full"
          disabled={isPending}
          onClick={onBack}
        >
          back
        </Button>
      </div>
    </FieldGroup>
  </form>
);
