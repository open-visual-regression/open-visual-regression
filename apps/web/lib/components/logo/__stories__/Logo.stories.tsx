import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Logo, LogoFull } from "../Logo";

const meta: Meta<typeof Logo> = {
  title: "Web/Logo",
  component: Logo,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Logo>;

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <p className="text-label tracking-label uppercase text-ovr-fg-tertiary">{label}</p>
    {children}
  </div>
);

export const KitchenSink: Story = {
  render: () => (
    <div className="space-y-8 p-6 bg-background">
      <Section label="Logo — sm / lg">
        <div className="flex items-end gap-8">
          <Logo size="sm" />
          <Logo size="lg" />
        </div>
      </Section>

      <Section label="LogoFull">
        <LogoFull />
      </Section>
    </div>
  ),
};
