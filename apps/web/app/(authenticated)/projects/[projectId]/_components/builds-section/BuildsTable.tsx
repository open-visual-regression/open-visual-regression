"use client";

import Link from "next/link";
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
  TableEmpty,
} from "@ovr/ui/components/table";
import { formatRelativeDateTime } from "@/lib/utils/date";
import { type BuildSchema } from "@ovr/api/contracts/builds";
import { BuildStatusBadge, BuildStatusStripe } from "@/lib/components/BuildStatus";
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
    id: "status",
    header: "Status",
    meta: { className: "text-left w-px" },
    cell: ({ row }) => <BuildStatusBadge status={row.original.status} />,
  }),
  columnHelper.accessor("name", {
    header: "Commit",
    cell: ({ row }) => (
      <div className="flex flex-row gap-2">
        <Link
          href={`/projects/${row.original.project.id}/builds/${row.original.id}`}
          className="absolute inset-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ovr-accent"
        >
          <span className="sr-only">view build {row.original.commitSha.slice(0, 7)}</span>
        </Link>
        <Typography variant="body-muted">{row.original.commitSha.slice(0, 7)}</Typography>
        {row.original.name ? <Typography>{row.original.name}</Typography> : null}
      </div>
    ),
  }),
  columnHelper.accessor("branch", { header: "Branch", meta: { className: "w-px" } }),
  columnHelper.accessor("author", {
    header: "Author",
    cell: ({ getValue }) => getValue() ?? "—",
  }),
  columnHelper.accessor("createdAt", {
    header: "Created",
    meta: { className: "text-right" },
    cell: ({ getValue }) => formatRelativeDateTime(new Date(getValue())),
  }),
]);

type BuildsTableProps = {
  data: BuildSchema[];
  search?: string;
};

export const BuildsTable = ({ data, search }: BuildsTableProps) => {
  const table = useTable({
    key: "builds-table",
    columns,
    data,
    features,
    rowModels: { coreRowModel: createCoreRowModel() },
    getRowId: (row) => row.id,
  });

  useTanStackTableDevtools(table);

  const columnCount = table.getAllLeafColumns().length;

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
        {table.getRowModel().rows.length === 0 ? (
          <TableEmpty colSpan={columnCount}>
            {search ? `no builds found matching "${search}"` : "no builds found"}
          </TableEmpty>
        ) : (
          table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="relative has-[a:hover]:bg-ovr-hover">
              {row.getAllCells().map((cell) => (
                <TableCell key={cell.id} className={cell.column.columnDef.meta?.className}>
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};
