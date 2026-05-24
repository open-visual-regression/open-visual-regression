import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "../input";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Input>;

const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="font-mono text-[10px] font-semibold tracking-[0.08em] uppercase text-ovr-fg-secondary">
    {children}
  </span>
);

const Helper = ({
  variant,
  children,
}: {
  variant: "error" | "warning" | "success";
  children: React.ReactNode;
}) => {
  const glyphs = { error: "✗", warning: "△", success: "✓" } as const;
  const colors = {
    error: "text-ovr-remove",
    warning: "text-ovr-pending",
    success: "text-ovr-add",
  } as const;
  return (
    <div
      className={`flex items-center gap-1.5 font-mono text-[11px] ${colors[variant]}`}
    >
      <span>{glyphs[variant]}</span>
      <span>{children}</span>
    </div>
  );
};

const FormField = ({
  label,
  children,
  helper,
}: {
  label: string;
  children: React.ReactNode;
  helper?: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <Label>{label}</Label>
    {children}
    {helper}
  </div>
);

const Section = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1">
    <p className="font-mono text-xs text-muted-foreground">{label}</p>
    <div className="space-y-3">{children}</div>
  </div>
);

export const KitchenSink: Story = {
  render: () => (
    <div className="max-w-sm space-y-6 p-4">
      <Section label="default">
        <FormField label="project name">
          <Input defaultValue="checkout-flow" />
        </FormField>
      </Section>

      <Section label="placeholder">
        <FormField label="baseline branch">
          <Input placeholder="e.g. main" />
        </FormField>
      </Section>

      <Section label="disabled">
        <FormField label="run id">
          <Input value="run_8f3k2m" disabled readOnly />
        </FormField>
      </Section>

      <Section label="validation · error">
        <FormField
          label="project slug"
          helper={
            <Helper variant="error">
              slug must be lowercase, kebab-case · no spaces
            </Helper>
          }
        >
          <Input defaultValue="checkout flow" aria-invalid="true" />
        </FormField>
      </Section>

      <Section label="validation · warning">
        <FormField
          label="baseline branch"
          helper={
            <Helper variant="warning">
              branch exists but has no recent commits · using main instead
            </Helper>
          }
        >
          <Input
            defaultValue="master"
            className="border-ovr-pending ring-2 ring-ovr-pending/20"
          />
        </FormField>
      </Section>

      <Section label="validation · success">
        <FormField
          label="github token"
          helper={
            <Helper variant="success">
              verified · scopes: repo, pull_requests
            </Helper>
          }
        >
          <Input
            defaultValue="ghp_••••••••••••••••"
            className="border-ovr-add ring-2 ring-ovr-add/20"
          />
        </FormField>
      </Section>
    </div>
  ),
};
