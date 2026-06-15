"use client";

import {
  useTable,
  tableFeatures,
  createColumnHelper,
  createCoreRowModel,
} from "@tanstack/react-table";
import { useTanStackTableDevtools } from "@tanstack/react-table-devtools";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@ovr/ui/components/table";
import { Badge, type BadgeVariant } from "@ovr/ui/components/badge";
import { StatusIcon, type StatusVariant } from "@ovr/ui/components/status-icon";
import { cn } from "@ovr/ui/lib/utils";
import { formatRelativeDateTime } from "@/lib/utils/date";
import { type BuildSchema, type BuildStatus } from "@ovr/api/contracts/builds";

const STATUS_ICON_VARIANT: Record<BuildStatus, StatusVariant> = {
  pending: "pending",
  needs_review: "changed",
  passed: "passed",
  error: "rejected",
};

const STATUS_BADGE_VARIANT: Record<BuildStatus, BadgeVariant> = {
  pending: "pending",
  needs_review: "changed",
  passed: "pass",
  error: "fail",
};

const STATUS_LABEL: Record<BuildStatus, string> = {
  pending: "pending",
  needs_review: "needs review",
  passed: "passed",
  error: "error",
};

const STATUS_BORDER: Record<BuildStatus, string> = {
  pending: "border-l-ovr-status-pending",
  needs_review: "border-l-ovr-accent",
  passed: "border-l-ovr-diff-add",
  error: "border-l-ovr-remove",
};

const features = tableFeatures({});
const columnHelper = createColumnHelper<typeof features, BuildSchema>();

const columns = columnHelper.columns([
  columnHelper.display({
    id: "statusIcon",
    meta: { className: "w-px" },
    cell: ({ row }) => <StatusIcon variant={STATUS_ICON_VARIANT[row.original.status]} />,
  }),
  columnHelper.accessor("name", {
    header: "Build",
    cell: ({ row }) => row.original.name ?? row.original.commitSha.slice(0, 7),
  }),
  columnHelper.accessor("branch", { header: "Branch" }),
  columnHelper.display({
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={STATUS_BADGE_VARIANT[row.original.status]}>
        {STATUS_LABEL[row.original.status]}
      </Badge>
    ),
  }),
  columnHelper.accessor("createdAt", {
    header: "Created",
    meta: { className: "text-right" },
    cell: ({ getValue }) => formatRelativeDateTime(new Date(getValue())),
  }),
]);

type BuildsTableProps = {
  data: BuildSchema[];
};

export const BuildsTable = ({ data }: BuildsTableProps) => {
  const table = useTable({
    key: "builds-table",
    columns,
    data,
    features,
    rowModels: { coreRowModel: createCoreRowModel() },
    getRowId: (row) => row.id,
  });

  useTanStackTableDevtools(table);

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                colSpan={header.colSpan}
                className={header.column.columnDef.meta?.className}
              >
                {!header.isPlaceholder && <table.FlexRender header={header} />}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id} className={cn("border-l-4", STATUS_BORDER[row.original.status])}>
            {row.getAllCells().map((cell) => (
              <TableCell key={cell.id} className={cell.column.columnDef.meta?.className}>
                <table.FlexRender cell={cell} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
