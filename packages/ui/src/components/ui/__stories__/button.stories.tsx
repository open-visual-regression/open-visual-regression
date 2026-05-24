import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "../button";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Button>;

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const Section = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1">
    <p className="text-xs text-muted-foreground font-mono">{label}</p>
    <div className="flex flex-wrap items-end gap-2">{children}</div>
  </div>
);

export const KitchenSink: Story = {
  render: () => {
    const variants = [
      "default",
      "secondary",
      "ghost",
      "destructive",
      "link",
    ] as const;

    return (
      <div className="space-y-6 p-4">
        {(["xs", "sm", "default", "lg"] as const).map((size) => (
          <Section key={size} label={`size="${size}"`}>
            {variants.map((variant) => (
              <Button key={variant} variant={variant} size={size}>
                {variant}
              </Button>
            ))}
          </Section>
        ))}
        <Section label="icon sizes">
          <Button size="icon-xs" aria-label="plus icon-xs">
            <PlusIcon />
          </Button>
          <Button size="icon-sm" aria-label="plus icon-sm">
            <PlusIcon />
          </Button>
          <Button size="icon" aria-label="plus icon">
            <PlusIcon />
          </Button>
          <Button size="icon-lg" aria-label="plus icon-lg">
            <PlusIcon />
          </Button>
        </Section>
        <Section label="disabled">
          {variants.map((variant) => (
            <Button key={variant} variant={variant} disabled>
              {variant}
            </Button>
          ))}
        </Section>
      </div>
    );
  },
};
