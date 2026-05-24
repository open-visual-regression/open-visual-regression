import type { Meta, StoryObj } from "@storybook/react-vite";

import { Checkbox } from "../checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "../field";
import { Input } from "../input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../select";
import { Switch } from "../switch";
import { Textarea } from "../textarea";

const meta: Meta<typeof Field> = {
  title: "UI/Field",
  component: Field,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Field>;

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p className="font-mono text-[11px] text-muted-foreground">{children}</p>
);

export const KitchenSink: Story = {
  render: () => (
    <div className="space-y-10 p-6 max-w-sm">
      {/* Vertical (default) */}
      <div className="space-y-2">
        <SectionTitle>orientation="vertical" (default)</SectionTitle>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="branch">Branch</FieldLabel>
            <Input id="branch" placeholder="main" />
          </Field>

          <Field>
            <FieldLabel htmlFor="threshold">Diff threshold</FieldLabel>
            <FieldDescription>
              Maximum allowed pixel difference (0–1).
            </FieldDescription>
            <Input id="threshold" type="number" placeholder="0.01" />
          </Field>

          <Field>
            <FieldLabel htmlFor="notes">Notes</FieldLabel>
            <FieldDescription>
              Optional context for this run.
            </FieldDescription>
            <Textarea id="notes" placeholder="Describe the change…" />
          </Field>

          <Field data-invalid="true">
            <FieldLabel htmlFor="token">API token</FieldLabel>
            <Input id="token" aria-invalid="true" defaultValue="bad-token!" />
            <FieldError>Token must be 32 hex characters.</FieldError>
          </Field>
        </FieldGroup>
      </div>

      {/* Horizontal */}
      <div className="space-y-2">
        <SectionTitle>orientation="horizontal"</SectionTitle>
        <FieldGroup>
          <Field orientation="horizontal">
            <FieldLabel htmlFor="auto-approve">Auto-approve</FieldLabel>
            <Switch id="auto-approve" />
          </Field>

          <Field orientation="horizontal">
            <FieldLabel htmlFor="notify">Email notifications</FieldLabel>
            <Switch id="notify" defaultChecked />
          </Field>

          <Field orientation="horizontal">
            <FieldLabel>Environment</FieldLabel>
            <Select defaultValue="ci">
              <SelectTrigger id="env" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ci">CI</SelectItem>
                <SelectItem value="local">Local</SelectItem>
                <SelectItem value="staging">Staging</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
      </div>

      {/* Separator */}
      <div className="space-y-2">
        <SectionTitle>FieldSeparator</SectionTitle>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="branch2">Branch</FieldLabel>
            <Input id="branch2" placeholder="main" />
          </Field>
          <FieldSeparator>or</FieldSeparator>
          <Field>
            <FieldLabel htmlFor="run-id">Run ID</FieldLabel>
            <Input id="run-id" placeholder="#42" />
          </Field>
        </FieldGroup>
      </div>

      {/* FieldSet with checkboxes */}
      <div className="space-y-2">
        <SectionTitle>FieldSet + FieldLegend</SectionTitle>
        <FieldSet>
          <FieldLegend>Notify me about</FieldLegend>
          <FieldGroup>
            {[
              { id: "notify-complete", label: "Run complete" },
              { id: "notify-regression", label: "Regressions detected" },
              { id: "notify-baseline", label: "Baseline updated" },
              { id: "notify-failure", label: "Build failures" },
            ].map(({ id, label }) => (
              <Field key={id} orientation="horizontal">
                <FieldLabel htmlFor={id}>{label}</FieldLabel>
                <Checkbox id={id} defaultChecked={id !== "notify-baseline"} />
              </Field>
            ))}
          </FieldGroup>
        </FieldSet>
      </div>
    </div>
  ),
};
