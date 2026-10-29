import { Controller, type Control } from "react-hook-form";

import type { GitCredentialTypeSchema } from "@ovr/api/contracts/gitIntegrations";
import type { GitProviderSummarySchema } from "@ovr/api/contracts/gitProviders";
import { Field, FieldLabel } from "@ovr/ui/components/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ovr/ui/components/select";

import type { GitIntegrationFormValues } from "./schema";

type CredentialTypeFieldProps = {
  control: Control<GitIntegrationFormValues>;
  provider: GitProviderSummarySchema;
  credentialTypes: GitCredentialTypeSchema[];
};

export const credentialTypeLabel = (
  provider: GitProviderSummarySchema,
  credentialType: GitCredentialTypeSchema,
): string =>
  credentialType === "connection" ? (provider.connections?.label ?? "connection") : "access token";

export const CredentialTypeField = ({
  control,
  provider,
  credentialTypes,
}: CredentialTypeFieldProps) => (
  <Field>
    <FieldLabel htmlFor="credentialType">authentication</FieldLabel>
    <Controller
      control={control}
      name="credentialType"
      render={({ field }) => (
        <Select
          value={field.value}
          onValueChange={field.onChange}
          items={Object.fromEntries(
            credentialTypes.map((type) => [type, credentialTypeLabel(provider, type)]),
          )}
        >
          <SelectTrigger id="credentialType" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {credentialTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {credentialTypeLabel(provider, type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  </Field>
);
