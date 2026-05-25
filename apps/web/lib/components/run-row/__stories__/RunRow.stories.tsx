import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RunRow } from "../RunRow";
import type { RunStatus } from "../RunRow";

const meta: Meta<typeof RunRow> = {
  title: "Web/RunRow",
  component: RunRow,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof RunRow>;

const ROWS: Array<{ status: RunStatus } & Partial<React.ComponentProps<typeof RunRow>>> = [
  {
    status: "changed",
    id: 1284,
    commit: "a3f8c12",
    message: "checkout-flow",
    branch: "feature/checkout",
    author: "tgfischer",
    age: "2m ago",
    changedCount: 3,
  },
  {
    status: "passed",
    id: 1283,
    commit: "b9e1d44",
    message: "checkout-flow",
    branch: "feature/checkout",
    author: "tgfischer",
    age: "14m ago",
    approved: true,
  },
  {
    status: "failed",
    id: 1282,
    commit: "c2d7a91",
    message: "marketing rebrand",
    branch: "feature/rebrand",
    author: "jsmith",
    age: "1h ago",
    errorNote: "capture timeout",
  },
  {
    status: "pending",
    id: 1281,
    commit: "d5b3e08",
    message: "fix nav overflow",
    branch: "main",
    author: "tgfischer",
    age: "just now",
  },
  {
    status: "stale",
    id: 1280,
    commit: "e8a2f55",
    message: "update deps",
    branch: "feature/nav",
    author: "jsmith",
    age: "3d ago",
  },
];

export const AllStatuses: Story = {
  render: () => (
    <div className="w-[700px]">
      {ROWS.map((row) => (
        <RunRow
          key={row.id}
          id={row.id!}
          commit={row.commit!}
          message={row.message!}
          branch={row.branch!}
          author={row.author!}
          age={row.age!}
          status={row.status}
          changedCount={row.changedCount}
          approved={row.approved}
          errorNote={row.errorNote}
        />
      ))}
    </div>
  ),
};
