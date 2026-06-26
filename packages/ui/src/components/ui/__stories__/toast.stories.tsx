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
        <p className="font-mono text-[11px] text-muted-foreground">color="blue" (default)</p>
        <Toast color="blue" icon={<CircleDotIcon className="size-3.5" />} title="Run pending" />
        <Toast
          color="blue"
          icon={<InfoIcon className="size-3.5" />}
          title="Run queued"
          description="Waiting for previous run to finish."
        />
        <Toast
          color="blue"
          icon={<InfoIcon className="size-3.5" />}
          title="Stale baseline"
          description="Baseline is 14 days old. Consider re-capturing."
          actionLabel="Update"
          onAction={() => {}}
          onDismiss={() => {}}
        />
      </div>

      <div className="space-y-2">
        <p className="font-mono text-[11px] text-muted-foreground">color="green"</p>
        <Toast
          color="green"
          icon={<CheckCircle2Icon className="size-3.5" />}
          title="Run approved"
        />
        <Toast
          color="green"
          icon={<CheckCircle2Icon className="size-3.5" />}
          title="Snapshots accepted"
          description="All 38 diffs marked as approved."
          actionLabel="Undo"
          onAction={() => {}}
          onDismiss={() => {}}
        />
      </div>

      <div className="space-y-2">
        <p className="font-mono text-[11px] text-muted-foreground">color="amber"</p>
        <Toast color="amber" icon={<ZapIcon className="size-3.5" />} title="Run started" />
        <Toast
          color="amber"
          icon={<InfoIcon className="size-3.5" />}
          title="New baseline captured"
          description="142 snapshots saved for branch main."
          actionLabel="View"
          onAction={() => {}}
          onDismiss={() => {}}
        />
      </div>

      <div className="space-y-2">
        <p className="font-mono text-[11px] text-muted-foreground">color="red"</p>
        <Toast
          color="red"
          icon={<OctagonXIcon className="size-3.5" />}
          title="Regression detected"
        />
        <Toast
          color="red"
          icon={<OctagonXIcon className="size-3.5" />}
          title="14 regressions found"
          description="Visual diffs exceed threshold on feature/navbar."
          actionLabel="Review"
          onAction={() => {}}
          onDismiss={() => {}}
        />
      </div>

      <div className="space-y-2">
        <p className="font-mono text-[11px] text-muted-foreground">color="neutral"</p>
        <Toast color="neutral" title="Auto-saved" />
        <Toast
          color="neutral"
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
          color="green"
          icon={<CheckCircle2Icon className="size-3.5" />}
          title="Run approved"
          description="All snapshots accepted."
          onDismiss={() => {}}
        />
        <Toast
          color="blue"
          icon={<InfoIcon className="size-3.5" />}
          title="New run started"
          description="Branch: feature/my-branch"
          actionLabel="View"
          onAction={() => {}}
          onDismiss={() => {}}
        />
        <Toast color="neutral" title="Auto-saved" onDismiss={() => {}} />
      </ToastContainer>
    </div>
  ),
};
