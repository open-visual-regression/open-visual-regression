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
import { formatRelativeDateTime } from "@/lib/utils/date";
import { type BuildSchema } from "@ovr/api/contracts/builds";
import { BuildStatusIcon, BuildStatusBadge, BuildStatusStripe } from "./BuildStatus";
import { Typography } from "@ovr/ui/components/typography";

const features = tableFeatures({});
const columnHelper = createColumnHelper<typeof features, BuildSchema>();

const columns = columnHelper.columns([
  columnHelper.display({
    id: "statusStripe",
    meta: { className: "w-1 min-w-1 p-0 relative" },
    cell: ({ row }) => <BuildStatusStripe status={row.original.status} />,
  }),
  columnHelper.display({
    id: "statusIcon",
    meta: { className: "w-px" },
    cell: ({ row }) => <BuildStatusIcon status={row.original.status} />,
  }),
  columnHelper.accessor("name", {
    header: "Commit",
    cell: ({ row }) => (
      <div className="flex flex-row gap-2">
        <Typography variant="body-muted">{row.original.commitSha.slice(0, 7)}</Typography>
        {row.original.name ? <Typography>{row.original.name}</Typography> : null}
      </div>
    ),
  }),
  columnHelper.accessor("branch", { header: "Branch" }),
  columnHelper.accessor("author", {
    header: "Author",
    cell: ({ getValue }) => getValue() ?? "—",
  }),
  columnHelper.display({
    id: "status",
    header: "Status",
    cell: ({ row }) => <BuildStatusBadge status={row.original.status} />,
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
                {!header.isPlaceholder ? <table.FlexRender header={header} /> : null}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
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
