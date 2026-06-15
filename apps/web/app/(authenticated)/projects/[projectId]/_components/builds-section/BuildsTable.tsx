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
import { BuildStatusIcon, BuildStatusBadge, BuildStatusTableRow } from "./BuildStatus";

const features = tableFeatures({});
const columnHelper = createColumnHelper<typeof features, BuildSchema>();

const columns = columnHelper.columns([
  columnHelper.display({
    id: "statusIcon",
    meta: { className: "w-px" },
    cell: ({ row }) => <BuildStatusIcon status={row.original.status} />,
  }),
  columnHelper.accessor("name", {
    header: "Build",
    cell: ({ row }) => row.original.name ?? row.original.commitSha.slice(0, 7),
  }),
  columnHelper.accessor("branch", { header: "Branch" }),
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
          <BuildStatusTableRow key={row.id} status={row.original.status}>
            {row.getAllCells().map((cell) => (
              <TableCell key={cell.id} className={cell.column.columnDef.meta?.className}>
                <table.FlexRender cell={cell} />
              </TableCell>
            ))}
          </BuildStatusTableRow>
        ))}
      </TableBody>
    </Table>
  );
};
