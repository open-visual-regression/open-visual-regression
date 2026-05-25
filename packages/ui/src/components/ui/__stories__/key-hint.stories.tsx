import type { Meta, StoryObj } from "@storybook/react-vite";

import { KeyHint } from "../key-hint";

const meta: Meta<typeof KeyHint> = {
  title: "UI/KeyHint",
  component: KeyHint,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof KeyHint>;

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <p className="font-mono text-[11px] text-muted-foreground">{label}</p>
    <div className="flex flex-wrap items-center gap-2">{children}</div>
  </div>
);

export const KitchenSink: Story = {
  render: () => (
    <div className="space-y-6 p-4">
      <Section label="navigation">
        <KeyHint>J</KeyHint>
        <KeyHint>K</KeyHint>
      </Section>
      <Section label="actions">
        <KeyHint>A</KeyHint>
        <KeyHint>R</KeyHint>
      </Section>
      <Section label="chords">
        <KeyHint>⌘K</KeyHint>
        <KeyHint>⇧Tab</KeyHint>
      </Section>
    </div>
  ),
};
