import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../card";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Card>;

const Section = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-2 w-72">
    <p className="font-mono text-[11px] text-muted-foreground">{label}</p>
    {children}
  </div>
);

export const KitchenSink: Story = {
  render: () => (
    <div className="flex flex-wrap gap-8 p-6">
      <Section label='size="default" — full card'>
        <Card>
          <CardHeader>
            <CardTitle>Run #42</CardTitle>
            <CardDescription>branch main · 2 minutes ago</CardDescription>
            <CardAction>
              <Button size="xs" variant="ghost">
                View
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              142 snapshots captured. No regressions detected.
            </p>
          </CardContent>
          <CardFooter className="gap-2">
            <Button size="xs" variant="secondary">
              Approve all
            </Button>
            <Button size="xs" variant="ghost">
              Download
            </Button>
          </CardFooter>
        </Card>
      </Section>

      <Section label='size="default" — header + content only'>
        <Card>
          <CardHeader>
            <CardTitle>Baseline snapshot</CardTitle>
            <CardDescription>hero-banner · 1920×1080</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-24 w-full bg-muted flex items-center justify-center font-mono text-[11px] text-muted-foreground">
              screenshot preview
            </div>
          </CardContent>
        </Card>
      </Section>

      <Section label='size="sm"'>
        <Card size="sm">
          <CardHeader>
            <CardTitle>feature/navbar</CardTitle>
            <CardDescription>4 diffs · pending review</CardDescription>
            <CardAction>
              <Button size="xs" variant="ghost">
                Review
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Threshold exceeded on 4 of 38 snapshots.
            </p>
          </CardContent>
          <CardFooter>
            <Button size="xs" variant="destructive">
              Reject
            </Button>
          </CardFooter>
        </Card>
      </Section>

      <Section label='size="default" — title only'>
        <Card>
          <CardHeader>
            <CardTitle>All runs passed</CardTitle>
          </CardHeader>
        </Card>
      </Section>
    </div>
  ),
};
