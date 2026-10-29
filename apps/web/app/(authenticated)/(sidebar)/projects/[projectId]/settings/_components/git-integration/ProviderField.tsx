import { Controller, type Control } from "react-hook-form";

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

type ProviderFieldProps = {
  control: Control<GitIntegrationFormValues>;
  providers: GitProviderSummarySchema[];
  onChange: (provider: GitProviderSummarySchema) => void;
};

export const ProviderField = ({ control, providers, onChange }: ProviderFieldProps) => (
  <Field>
    <FieldLabel htmlFor="provider">provider</FieldLabel>
    <Controller
      control={control}
      name="provider"
      render={({ field }) => (
        <Select
          value={field.value}
          items={Object.fromEntries(providers.map(({ id, name }) => [id, name]))}
          onValueChange={(value) => {
            const provider = providers.find(({ id }) => id === value);
            if (provider) {
              field.onChange(provider.id);
              onChange(provider);
            }
          }}
        >
          <SelectTrigger id="provider" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {providers.map((provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                {provider.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  </Field>
);
