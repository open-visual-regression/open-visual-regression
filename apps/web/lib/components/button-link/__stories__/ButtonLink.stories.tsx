import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Icon, PlusIcon } from "@ovr/ui/components/icon";

import { ButtonLink } from "../ButtonLink";

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <p className="text-xs text-muted-foreground font-mono">{label}</p>
    <div className="flex flex-wrap items-end gap-2">{children}</div>
  </div>
);

const meta: Meta<typeof ButtonLink> = {
  title: "Web/ButtonLink",
  component: ButtonLink,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ButtonLink>;

const variants = ["solid", "outline", "ghost", "link"] as const;
const colors = ["accent", "red", "green", "blue", "amber", "neutral"] as const;
const iconSizes = ["icon-xs", "icon-sm", "icon", "icon-lg"] as const;

export const KitchenSink: Story = {
  render: () => (
    <div className="space-y-6 p-4">
      {variants.map((variant) => (
        <Section key={variant} label={`variant="${variant}"`}>
          {colors.map((color) => (
            <ButtonLink key={color} href="#" variant={variant} color={color}>
              {color}
            </ButtonLink>
          ))}
        </Section>
      ))}
      <Section label="sizes">
        <ButtonLink href="#" size="xs">
          xs
        </ButtonLink>
        <ButtonLink href="#" size="sm">
          sm
        </ButtonLink>
        <ButtonLink href="#" size="md">
          md
        </ButtonLink>
        <ButtonLink href="#" size="lg">
          lg
        </ButtonLink>
      </Section>
      <Section label="icon sizes">
        {iconSizes.map((size) => (
          <ButtonLink key={size} href="#" size={size} aria-label={`plus ${size}`}>
            <Icon icon={PlusIcon} />
          </ButtonLink>
        ))}
      </Section>
      <Section label="disabled">
        {variants.map((variant) => (
          <ButtonLink key={variant} href="#" variant={variant} color="accent" disabled>
            {variant}
          </ButtonLink>
        ))}
      </Section>
      <Section label="no href (renders a disabled button)">
        {variants.map((variant) => (
          <ButtonLink key={variant} href={null} variant={variant} color="accent">
            {variant}
          </ButtonLink>
        ))}
      </Section>
    </div>
  ),
};
