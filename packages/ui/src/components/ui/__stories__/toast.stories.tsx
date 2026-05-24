import type { Meta, StoryObj } from "@storybook/react-vite";
import { CheckCircle2Icon, CircleDotIcon, InfoIcon, OctagonXIcon, ZapIcon } from "lucide-react";

import { Toast, ToastContainer } from "../toast";

const meta: Meta<typeof Toast> = {
  title: "UI/Toast",
  component: Toast,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const KitchenSink: Story = {
  render: () => (
    <div className="p-6 space-y-8 max-w-md">
      <div className="space-y-2">
        <p className="font-mono text-[11px] text-muted-foreground">variant="default" — blue/pending</p>
        <Toast
          variant="default"
          icon={<CircleDotIcon className="size-3.5" />}
          title="Run pending"
        />
        <Toast
          variant="default"
          icon={<InfoIcon className="size-3.5" />}
          title="Run queued"
          description="Waiting for previous run to finish."
        />
        <Toast
          variant="default"
          icon={<InfoIcon className="size-3.5" />}
          title="Stale baseline"
          description="Baseline is 14 days old. Consider re-capturing."
          actionLabel="Update"
          onAction={() => {}}
          onDismiss={() => {}}
        />
      </div>

      <div className="space-y-2">
        <p className="font-mono text-[11px] text-muted-foreground">variant="success" — green</p>
        <Toast
          variant="success"
          icon={<CheckCircle2Icon className="size-3.5" />}
          title="Run approved"
        />
        <Toast
          variant="success"
          icon={<CheckCircle2Icon className="size-3.5" />}
          title="Snapshots accepted"
          description="All 38 diffs marked as approved."
          actionLabel="Undo"
          onAction={() => {}}
          onDismiss={() => {}}
        />
      </div>

      <div className="space-y-2">
        <p className="font-mono text-[11px] text-muted-foreground">variant="warning" — amber/accent</p>
        <Toast
          variant="warning"
          icon={<ZapIcon className="size-3.5" />}
          title="Run started"
        />
        <Toast
          variant="warning"
          icon={<InfoIcon className="size-3.5" />}
          title="New baseline captured"
          description="142 snapshots saved for branch main."
          actionLabel="View"
          onAction={() => {}}
          onDismiss={() => {}}
        />
      </div>

      <div className="space-y-2">
        <p className="font-mono text-[11px] text-muted-foreground">variant="destructive" — red</p>
        <Toast
          variant="destructive"
          icon={<OctagonXIcon className="size-3.5" />}
          title="Regression detected"
        />
        <Toast
          variant="destructive"
          icon={<OctagonXIcon className="size-3.5" />}
          title="14 regressions found"
          description="Visual diffs exceed threshold on feature/navbar."
          actionLabel="Review"
          onAction={() => {}}
          onDismiss={() => {}}
        />
      </div>

      <div className="space-y-2">
        <p className="font-mono text-[11px] text-muted-foreground">variant="muted" — grey</p>
        <Toast
          variant="muted"
          title="Auto-saved"
        />
        <Toast
          variant="muted"
          title="Settings updated"
          description="Threshold changed to 0.5%."
          onDismiss={() => {}}
        />
      </div>
    </div>
  ),
};

export const Stack: Story = {
  name: "ToastContainer (stacked)",
  render: () => (
    <div className="relative h-64 w-full border border-dashed border-ovr-border-subtle rounded-[4px]">
      <p className="p-4 font-mono text-[11px] text-muted-foreground">Fixed bottom-right stack</p>
      <ToastContainer className="absolute">
        <Toast
          variant="success"
          icon={<CheckCircle2Icon className="size-3.5" />}
          title="Run approved"
          description="All snapshots accepted."
          onDismiss={() => {}}
        />
        <Toast
          variant="default"
          icon={<InfoIcon className="size-3.5" />}
          title="New run started"
          description="Branch: feature/my-branch"
          actionLabel="View"
          onAction={() => {}}
          onDismiss={() => {}}
        />
        <Toast
          variant="muted"
          title="Auto-saved"
          onDismiss={() => {}}
        />
      </ToastContainer>
    </div>
  ),
};
