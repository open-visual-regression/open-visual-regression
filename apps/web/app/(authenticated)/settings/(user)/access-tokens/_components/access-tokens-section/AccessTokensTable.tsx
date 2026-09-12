"use client";

import { useTable, tableFeatures, createColumnHelper } from "@tanstack/react-table";
import { useTanStackTableDevtools } from "@tanstack/react-table-devtools";

import { StatusIcon } from "@ovr/ui/components/status-icon";
import {
  Table,
  TableContainer,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@ovr/ui/components/table";

import { formatDateTime } from "@/lib/utils/date";

import { RevokeAccessTokenButton } from "./RevokeAccessTokenButton";

type AccessTokenTableRow = {
  id: string;
  name: string;
  createdAt: Date;
  lastRequest: Date | null;
};

const features = tableFeatures({});
const columnHelper = createColumnHelper<typeof features, AccessTokenTableRow>();

const columns = columnHelper.columns([
  columnHelper.accessor("name", { header: "Name" }),
  columnHelper.accessor("createdAt", {
    header: "Created at",
    cell: ({ getValue }) => formatDateTime(getValue()),
  }),
  columnHelper.accessor("lastRequest", {
    header: "Last used",
    cell: ({ getValue }) => {
      const lastRequest = getValue();
      if (!lastRequest) {
        return (
          <span className="inline-flex items-center gap-1.5">
            <StatusIcon variant="stale" size={12} />
            never
          </span>
        );
      }
      return formatDateTime(lastRequest);
    },
  }),
  columnHelper.display({
    id: "actions",
    meta: { className: "text-right" },
    cell: ({ row }) => (
      <RevokeAccessTokenButton tokenId={row.original.id} tokenName={row.original.name} />
    ),
  }),
]);

type AccessTokensTableProps = {
  data: AccessTokenTableRow[];
};

export const AccessTokensTable = ({ data }: AccessTokensTableProps) => {
  const table = useTable({
    key: "access-tokens-table",
    columns,
    data,
    features,
    getRowId: (row) => row.id,
  });

  useTanStackTableDevtools(table);

  return (
    <TableContainer>
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
    </TableContainer>
  );
};
