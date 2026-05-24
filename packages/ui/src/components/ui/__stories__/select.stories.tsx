import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../select";

const meta: Meta<typeof SelectTrigger> = {
  title: "UI/Select",
  component: SelectTrigger,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SelectTrigger>;

const Section = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1">
    <p className="font-mono text-[11px] text-muted-foreground">{label}</p>
    {children}
  </div>
);

const BranchSelect = (
  props: React.ComponentProps<typeof Select> & {
    triggerSize?: "default" | "sm";
    triggerProps?: React.ComponentProps<typeof SelectTrigger>;
  }
) => {
  const { triggerSize, triggerProps, ...selectProps } = props;
  return (
    <Select {...selectProps}>
      <SelectTrigger size={triggerSize} className="w-48" {...triggerProps}>
        <SelectValue placeholder="Select branch…" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Active branches</SelectLabel>
          <SelectItem value="main">main</SelectItem>
          <SelectItem value="develop">develop</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Feature branches</SelectLabel>
          <SelectItem value="feature/navbar">feature/navbar</SelectItem>
          <SelectItem value="feature/dark-mode">feature/dark-mode</SelectItem>
          <SelectItem value="fix/button-padding">fix/button-padding</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export const KitchenSink: Story = {
  render: () => (
    <div className="space-y-6 p-6">
      <Section label='size="default" — placeholder'>
        <BranchSelect />
      </Section>

      <Section label='size="default" — with value'>
        <BranchSelect defaultValue="main" />
      </Section>

      <Section label='size="sm"'>
        <BranchSelect triggerSize="sm" defaultValue="develop" />
      </Section>

      <Section label="disabled">
        <BranchSelect
          defaultValue="main"
          triggerProps={{ disabled: true } as React.ComponentProps<typeof SelectTrigger>}
        />
      </Section>

      <Section label="invalid">
        <Select>
          <SelectTrigger className="w-48" aria-invalid="true">
            <SelectValue placeholder="Select branch…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="main">main</SelectItem>
          </SelectContent>
        </Select>
      </Section>
    </div>
  ),
};
