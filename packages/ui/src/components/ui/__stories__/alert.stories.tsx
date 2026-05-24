import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  CircleCheckIcon,
  CircleDotIcon,
  InfoIcon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { Button } from "../button";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "../alert";

const meta: Meta<typeof Alert> = {
  title: "UI/Alert",
  component: Alert,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Alert>;

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <p className="font-mono text-[11px] text-muted-foreground">{label}</p>
    <div className="flex flex-col gap-2">{children}</div>
  </div>
);

export const KitchenSink: Story = {
  render: () => (
    <div className="space-y-8 p-6 max-w-lg">
      <Section label='variant="default" — amber/accent'>
        <Alert>
          <AlertTitle>Run complete</AlertTitle>
        </Alert>
        <Alert>
          <AlertTitle>Baseline updated</AlertTitle>
          <AlertDescription>New baseline set for 3 components on branch main.</AlertDescription>
        </Alert>
        <Alert>
          <InfoIcon />
          <AlertTitle>Run queued</AlertTitle>
          <AlertDescription>
            Snapshot capture will begin once the previous run finishes.
          </AlertDescription>
        </Alert>
        <Alert>
          <InfoIcon />
          <AlertTitle>Threshold warning</AlertTitle>
          <AlertDescription>4 snapshots are within 0.1% of the diff threshold.</AlertDescription>
          <AlertAction>
            <Button size="xs" variant="secondary">
              Review
            </Button>
          </AlertAction>
        </Alert>
      </Section>

      <Section label='variant="success" — green'>
        <Alert variant="success">
          <AlertTitle>Run approved</AlertTitle>
        </Alert>
        <Alert variant="success">
          <CircleCheckIcon />
          <AlertTitle>No regressions detected</AlertTitle>
          <AlertDescription>All 142 snapshots match baseline within threshold.</AlertDescription>
        </Alert>
        <Alert variant="success">
          <CircleCheckIcon />
          <AlertTitle>Snapshots accepted</AlertTitle>
          <AlertDescription>
            38 diffs were approved and the baseline has been updated.
          </AlertDescription>
          <AlertAction>
            <Button size="xs" variant="secondary">
              View report
            </Button>
          </AlertAction>
        </Alert>
      </Section>

      <Section label='variant="warning" — blue/pending'>
        <Alert variant="warning">
          <AlertTitle>Run pending</AlertTitle>
        </Alert>
        <Alert variant="warning">
          <CircleDotIcon />
          <AlertTitle>Stale baseline</AlertTitle>
          <AlertDescription>
            Baseline is 14 days old. Consider re-capturing before next run.
          </AlertDescription>
        </Alert>
        <Alert variant="warning">
          <TriangleAlertIcon />
          <AlertTitle>Queued behind 3 runs</AlertTitle>
          <AlertDescription>Snapshot capture will start once the queue clears.</AlertDescription>
          <AlertAction>
            <Button size="xs" variant="secondary">
              Prioritise
            </Button>
          </AlertAction>
        </Alert>
      </Section>

      <Section label='variant="destructive" — red'>
        <Alert variant="destructive">
          <AlertTitle>Build failed</AlertTitle>
        </Alert>
        <Alert variant="destructive">
          <AlertTitle>Connection error</AlertTitle>
          <AlertDescription>
            Could not connect to screenshot service. Retry in 30s.
          </AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <OctagonXIcon />
          <AlertTitle>14 regressions detected</AlertTitle>
          <AlertDescription>
            Visual diffs exceed threshold on branch feature/navbar.
          </AlertDescription>
          <AlertAction>
            <Button size="xs" variant="destructive">
              View diffs
            </Button>
          </AlertAction>
        </Alert>
      </Section>
    </div>
  ),
};
