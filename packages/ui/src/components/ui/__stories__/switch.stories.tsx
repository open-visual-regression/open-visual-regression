import type { Meta, StoryObj } from "@storybook/react-vite";

import { Label } from "../label";
import { Switch } from "../switch";

const meta: Meta<typeof Switch> = {
  title: "UI/Switch",
  component: Switch,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Switch>;

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <p className="font-mono text-[11px] text-muted-foreground">{label}</p>
    <div className="flex flex-col gap-3">{children}</div>
  </div>
);

const SwitchRow = ({
  label,
  ...props
}: React.ComponentProps<typeof Switch> & { label: string }) => (
  <Label className="flex cursor-pointer items-center gap-2">
    <Switch {...props} />
    {label}
  </Label>
);

export const KitchenSink: Story = {
  render: () => (
    <div className="space-y-8 p-6">
      {(["default", "sm"] as const).map((size) => (
        <Section key={size} label={`size="${size}"`}>
          <SwitchRow label="Off" size={size} />
          <SwitchRow label="On" size={size} defaultChecked />
          <SwitchRow label="Disabled off" size={size} disabled />
          <SwitchRow label="Disabled on" size={size} defaultChecked disabled />
        </Section>
      ))}

      <Section label="invalid">
        <SwitchRow label="Auto-approve runs" aria-invalid="true" />
        <SwitchRow label="Auto-approve runs" defaultChecked aria-invalid="true" />
      </Section>
    </div>
  ),
};
