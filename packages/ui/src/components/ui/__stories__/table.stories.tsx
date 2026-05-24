import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "../table";

const meta: Meta<typeof Table> = {
  title: "UI/Table",
  component: Table,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Table>;

const runs = [
  { id: "#42", branch: "main", snapshots: 142, diffs: 0, status: "passed", date: "2m ago" },
  {
    id: "#41",
    branch: "feature/navbar",
    snapshots: 38,
    diffs: 4,
    status: "failed",
    date: "1h ago",
  },
  { id: "#40", branch: "develop", snapshots: 142, diffs: 0, status: "passed", date: "3h ago" },
  {
    id: "#39",
    branch: "fix/button-padding",
    snapshots: 12,
    diffs: 1,
    status: "failed",
    date: "5h ago",
  },
  { id: "#38", branch: "main", snapshots: 142, diffs: 0, status: "passed", date: "1d ago" },
];

const StatusPill = ({ status }: { status: string }) => (
  <span
    className={
      status === "passed"
        ? "font-mono text-[10px] text-green-400"
        : "font-mono text-[10px] text-destructive"
    }
  >
    {status}
  </span>
);

export const KitchenSink: Story = {
  render: () => (
    <div className="p-6 max-w-2xl">
      <Table>
        <TableCaption>Recent runs across all branches</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Run</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead className="text-right">Snapshots</TableHead>
            <TableHead className="text-right">Diffs</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>When</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.map((run) => (
            <TableRow key={run.id}>
              <TableCell className="font-mono">{run.id}</TableCell>
              <TableCell className="font-mono text-muted-foreground">{run.branch}</TableCell>
              <TableCell className="text-right">{run.snapshots}</TableCell>
              <TableCell className="text-right">{run.diffs}</TableCell>
              <TableCell>
                <StatusPill status={run.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">{run.date}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>Total</TableCell>
            <TableCell className="text-right">476</TableCell>
            <TableCell className="text-right">5</TableCell>
            <TableCell colSpan={2} />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  ),
};
