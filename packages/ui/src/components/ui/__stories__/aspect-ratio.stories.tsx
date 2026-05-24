import type { Meta, StoryObj } from "@storybook/react-vite";

import { AspectRatio } from "../aspect-ratio";

const meta: Meta<typeof AspectRatio> = {
  title: "UI/AspectRatio",
  component: AspectRatio,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AspectRatio>;

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <p className="font-mono text-[11px] text-muted-foreground">{label}</p>
    {children}
  </div>
);

const Placeholder = ({ label }: { label: string }) => (
  <div className="flex h-full w-full items-center justify-center bg-muted font-mono text-[11px] text-muted-foreground">
    {label}
  </div>
);

export const KitchenSink: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6 p-6 max-w-xl">
      <Section label="ratio={16 / 9}">
        <AspectRatio ratio={16 / 9}>
          <Placeholder label="16 / 9" />
        </AspectRatio>
      </Section>

      <Section label="ratio={4 / 3}">
        <AspectRatio ratio={4 / 3}>
          <Placeholder label="4 / 3" />
        </AspectRatio>
      </Section>

      <Section label="ratio={1}">
        <AspectRatio ratio={1}>
          <Placeholder label="1 / 1" />
        </AspectRatio>
      </Section>

      <Section label="ratio={21 / 9}">
        <AspectRatio ratio={21 / 9}>
          <Placeholder label="21 / 9" />
        </AspectRatio>
      </Section>
    </div>
  ),
};
