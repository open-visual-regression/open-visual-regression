import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "../input";
import { Label } from "../label";

const meta: Meta<typeof Label> = {
  title: "UI/Label",
  component: Label,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Label>;

const Section = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1">
    <p className="font-mono text-[11px] text-muted-foreground">{label}</p>
    <div>{children}</div>
  </div>
);

export const KitchenSink: Story = {
  render: () => (
    <div className="space-y-6 p-6 max-w-xs">
      <Section label="standalone">
        <Label>Branch name</Label>
      </Section>

      <Section label="with htmlFor">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="branch">Branch name</Label>
          <Input id="branch" placeholder="main" />
        </div>
      </Section>

      <Section label="disabled via group-data-[disabled=true]">
        <div className="group/field" data-disabled="true">
          <div className="flex flex-col gap-1.5">
            <Label>Threshold</Label>
            <Input disabled placeholder="0.01" />
          </div>
        </div>
      </Section>
    </div>
  ),
};
