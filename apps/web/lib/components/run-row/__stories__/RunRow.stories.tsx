import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Badge } from "@ovr/ui/components/badge";

import { RunRow } from "../RunRow";

const meta: Meta<typeof RunRow> = {
  title: "Web/RunRow",
  component: RunRow,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof RunRow>;

export const KitchenSink: Story = {
  render: () => (
    <div className="w-[700px]">
      <RunRow
        status="changed"
        runId={1284}
        commit="a3f8c12"
        message="checkout-flow"
        branch="feature/checkout"
        author="tgfischer"
        age="2m ago"
        changedCount={3}
      />
      <RunRow
        status="passed"
        runId={1283}
        commit="b9e1d44"
        message="checkout-flow"
        branch="feature/checkout"
        author="tgfischer"
        age="14m ago"
      >
        <span className="shrink-0">
          <Badge variant="pass">✓ approved</Badge>
        </span>
      </RunRow>
      <RunRow
        status="failed"
        runId={1282}
        commit="c2d7a91"
        message="marketing rebrand"
        branch="feature/rebrand"
        author="jsmith"
        age="1h ago"
      >
        <span className="text-[11px] text-ovr-remove shrink-0">· capture timeout</span>
      </RunRow>
      <RunRow
        status="pending"
        runId={1281}
        commit="d5b3e08"
        message="fix nav overflow"
        branch="main"
        author="tgfischer"
        age="just now"
      />
      <RunRow
        status="stale"
        runId={1280}
        commit="e8a2f55"
        message="update deps"
        branch="feature/nav"
        author="jsmith"
        age="3d ago"
      />
    </div>
  ),
};
