import type { Meta, StoryObj } from "@storybook/react-vite";

import { Textarea } from "../textarea";

const meta: Meta<typeof Textarea> = {
  title: "UI/Textarea",
  component: Textarea,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Textarea>;

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
        <FormField label="approval note">
          <Textarea defaultValue="redesigned checkout CTA per design spec.&#10;checked across all viewports — looks correct." />
        </FormField>
      </Section>

      <Section label="placeholder">
        <FormField label="description">
          <Textarea placeholder="describe what changed and why…" />
        </FormField>
      </Section>

      <Section label="with helpers">
        <FormField label="approval note">
          <Textarea defaultValue="redesigned checkout CTA per design spec." />
          <div className="flex font-mono text-[10px] text-ovr-fg-muted">
            <span>markdown supported</span>
            <span className="ml-auto">38 / 500</span>
          </div>
        </FormField>
      </Section>

      <Section label="disabled">
        <FormField label="merged commit message">
          <Textarea
            value="feat(checkout): redesign CTA button per design spec&#10;&#10;Updated button variant from secondary to default across all checkout&#10;flow screens. Verified on mobile, tablet, and desktop viewports."
            disabled
            readOnly
          />
        </FormField>
      </Section>

      <Section label="validation · error">
        <FormField
          label="rejection reason"
          helper={
            <Helper variant="error">
              reason must be at least 20 characters
            </Helper>
          }
        >
          <Textarea defaultValue="looks wrong" aria-invalid="true" />
        </FormField>
      </Section>

      <Section label="validation · warning">
        <FormField
          label="baseline snapshot note"
          helper={
            <Helper variant="warning">
              snapshot is older than 7 days · re-run recommended
            </Helper>
          }
        >
          <Textarea
            defaultValue="captured before the rebrand."
            className="border-ovr-pending ring-2 ring-ovr-pending/20"
          />
        </FormField>
      </Section>

      <Section label="validation · success">
        <FormField
          label="approval note"
          helper={
            <Helper variant="success">note saved · diff approved</Helper>
          }
        >
          <Textarea
            defaultValue="all diffs reviewed and approved. ready to merge."
            className="border-ovr-add ring-2 ring-ovr-add/20"
          />
        </FormField>
      </Section>
    </div>
  ),
};
