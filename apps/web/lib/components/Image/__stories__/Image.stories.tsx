import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Typography } from "@ovr/ui/components/typography";
import { Image } from "../Image";

const meta: Meta<typeof Image> = {
  title: "Web/Image",
  component: Image,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Image>;

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <p className="text-label tracking-label uppercase text-ovr-fg-tertiary">{label}</p>
    {children}
  </div>
);

const NoPreview = ({ text }: { text: string }) => (
  <div className="absolute inset-0 flex items-center justify-center">
    <Typography variant="caption">{text}</Typography>
  </div>
);

const SAMPLE_IMAGE =
  "data:image/svg+xml;base64," +
  btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160"><rect width="100%" height="100%" fill="#3b82f6"/></svg>',
  );

export const KitchenSink: Story = {
  render: () => (
    <div className="space-y-8 bg-background p-6">
      <Section label="loaded">
        <div className="relative h-40 w-60 overflow-hidden rounded-card border border-ovr-border bg-ovr-inset bg-pixel-grid">
          <Image
            src={SAMPLE_IMAGE}
            alt="sample snapshot"
            className="absolute inset-0 h-full w-full object-cover"
            errorFallback={<NoPreview text="failed to load snapshot" />}
          />
        </div>
      </Section>

      <Section label="failed to load">
        <div className="relative h-40 w-60 overflow-hidden rounded-card border border-ovr-border bg-ovr-inset bg-pixel-grid">
          <Image
            src="/this-image-does-not-exist.png"
            alt="sample snapshot"
            className="absolute inset-0 h-full w-full object-cover"
            errorFallback={<NoPreview text="failed to load snapshot" />}
          />
        </div>
      </Section>
    </div>
  ),
};
