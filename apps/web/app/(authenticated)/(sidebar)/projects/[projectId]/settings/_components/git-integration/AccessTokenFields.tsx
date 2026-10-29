import type { FieldErrors, UseFormRegister } from "react-hook-form";

import type { GitProviderSummarySchema } from "@ovr/api/contracts/gitProviders";
import { Field, FieldError, FieldGroup, FieldLabel } from "@ovr/ui/components/field";
import { Input } from "@ovr/ui/components/input";

import type { GitIntegrationFormValues } from "./schema";

type AccessTokenFieldsProps = {
  register: UseFormRegister<GitIntegrationFormValues>;
  errors: FieldErrors<GitIntegrationFormValues>;
  provider: GitProviderSummarySchema;
  hasStoredToken: boolean;
};

export const AccessTokenFields = ({
  register,
  errors,
  provider,
  hasStoredToken,
}: AccessTokenFieldsProps) => (
  <>
    <FieldGroup>
      <Field data-invalid={!!errors.repoIdentifier}>
        <FieldLabel htmlFor="repoIdentifier">repository</FieldLabel>
        <Input
          id="repoIdentifier"
          placeholder={provider.repository.placeholder}
          aria-invalid={!!errors.repoIdentifier}
          {...register("repoIdentifier")}
        />
        <FieldError errors={[errors.repoIdentifier]} />
      </Field>
    </FieldGroup>
    <FieldGroup>
      <Field data-invalid={!!errors.token}>
        <FieldLabel htmlFor="token">access token</FieldLabel>
        <Input
          id="token"
          type="password"
          autoComplete="off"
          placeholder={hasStoredToken ? "re-enter to update the stored token" : "paste a token"}
          aria-invalid={!!errors.token}
          {...register("token")}
        />
        <FieldError errors={[errors.token]} />
      </Field>
    </FieldGroup>
  </>
);
