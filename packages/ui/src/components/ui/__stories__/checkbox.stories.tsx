import type { Meta, StoryObj } from "@storybook/react-vite";

import { Checkbox } from "../checkbox";
import { Label } from "../label";

const meta: Meta<typeof Checkbox> = {
  title: "UI/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <p className="font-mono text-[11px] text-muted-foreground">{label}</p>
    <div className="flex flex-col gap-2">{children}</div>
  </div>
);

const CheckboxRow = ({
  label,
  ...props
}: React.ComponentProps<typeof Checkbox> & { label: string }) => (
  <Label className="flex cursor-pointer items-center gap-2">
    <Checkbox {...props} />
    {label}
  </Label>
);

export const KitchenSink: Story = {
  render: () => (
    <div className="space-y-8 p-6">
      <Section label="states">
        <CheckboxRow label="Unchecked" />
        <CheckboxRow label="Checked" defaultChecked />
        <CheckboxRow label="Disabled unchecked" disabled />
        <CheckboxRow label="Disabled checked" defaultChecked disabled />
      </Section>

      <Section label="invalid">
        <CheckboxRow label="Accept terms and conditions" aria-invalid="true" />
        <CheckboxRow label="Accept terms and conditions" defaultChecked aria-invalid="true" />
      </Section>

      <Section label="in a list">
        <p className="text-xs font-medium mb-1">Notify me about:</p>
        <CheckboxRow label="Run completed" defaultChecked />
        <CheckboxRow label="Regressions detected" defaultChecked />
        <CheckboxRow label="Baseline updated" />
        <CheckboxRow label="Build failures" />
      </Section>
    </div>
  ),
};
