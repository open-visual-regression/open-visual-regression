import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Button } from "@ovr/ui/components/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@ovr/ui/components/field";
import { Input } from "@ovr/ui/components/input";
import type { SetupFormValues } from "./schema";

type OrganizationStepProps = {
  register: UseFormRegister<SetupFormValues>;
  errors: Pick<FieldErrors<SetupFormValues>, "orgName">;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
};

export const OrganizationStep = ({ register, errors, onSubmit }: OrganizationStepProps) => (
  <form onSubmit={onSubmit} noValidate>
    <FieldGroup>
      <Field data-invalid={!!errors.orgName}>
        <FieldLabel htmlFor="orgName">organization name</FieldLabel>
        <Input
          id="orgName"
          placeholder="enter your organization's name"
          autoFocus
          aria-invalid={!!errors.orgName}
          {...register("orgName")}
        />
        <FieldError errors={[errors.orgName]} />
      </Field>
      <Button type="submit" size="lg" className="w-full justify-center">
        next
      </Button>
    </FieldGroup>
  </form>
);
