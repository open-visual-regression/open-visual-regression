import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "../input";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Input>;

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <p className="font-mono text-[11px] text-muted-foreground">{label}</p>
    {children}
  </div>
);

export const KitchenSink: Story = {
  render: () => (
    <div className="space-y-6 p-6 max-w-xs">
      <Section label="default (empty)">
        <Input />
      </Section>

      <Section label="placeholder">
        <Input placeholder="feature/my-branch" />
      </Section>

      <Section label="with value">
        <Input defaultValue="main" />
      </Section>

      <Section label="disabled">
        <Input disabled defaultValue="main" />
      </Section>

      <Section label="invalid">
        <Input aria-invalid="true" defaultValue="invalid-branch--name" />
      </Section>

      <Section label='type="password"'>
        <Input type="password" defaultValue="supersecret" />
      </Section>

      <Section label='type="number"'>
        <Input type="number" placeholder="0.01" />
      </Section>

      <Section label='type="file"'>
        <Input type="file" />
      </Section>
    </div>
  ),
};
