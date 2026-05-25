import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Logo } from "../Logo";
import type { LogoSurface } from "../Logo";

const meta: Meta<typeof Logo> = {
  title: "Web/Logo",
  component: Logo,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Logo>;

const SURFACES: { surface: LogoSurface; bg: string; label: string }[] = [
  { surface: "default", bg: "bg-background", label: "on base" },
  { surface: "default", bg: "bg-ovr-elevated", label: "on elevated" },
  { surface: "light", bg: "bg-white", label: "on light" },
  { surface: "accent", bg: "bg-ovr-accent", label: "on accent" },
];

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <p className="text-label tracking-label uppercase text-ovr-fg-tertiary">{label}</p>
    {children}
  </div>
);

export const KitchenSink: Story = {
  render: () => (
    <div className="space-y-8 p-6 bg-background">
      <Section label="default — sm / lg">
        <div className="flex items-end gap-8">
          <Logo variant="default" size="sm" />
          <Logo variant="default" size="lg" />
        </div>
      </Section>

      <Section label="full">
        <Logo variant="full" />
      </Section>

      <Section label="surfaces">
        <div className="flex">
          {SURFACES.map(({ surface, bg, label }) => (
            <div key={label} className="flex flex-col items-center gap-3">
              <div
                className={`flex w-40 h-20 items-center justify-center border border-ovr-border-subtle ${bg}`}
              >
                <Logo variant="default" size="lg" surface={surface} />
              </div>
              <span className="text-label tracking-label uppercase text-ovr-fg-tertiary">
                {label}
              </span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  ),
};
