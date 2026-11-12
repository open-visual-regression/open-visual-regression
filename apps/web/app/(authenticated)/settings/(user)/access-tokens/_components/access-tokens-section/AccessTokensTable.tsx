"use client";

import { useTable, tableFeatures, createColumnHelper } from "@tanstack/react-table";
import { useTanStackTableDevtools } from "@tanstack/react-table-devtools";

import type { TokenPermissions } from "@ovr/api/contracts/accessTokens";
import { ButtonSkeleton } from "@ovr/ui/components/button";
import { Icon, XIcon } from "@ovr/ui/components/icon";
import { Skeleton } from "@ovr/ui/components/skeleton";
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
  permissions: TokenPermissions;
  createdAt: Date;
  lastRequest: Date | null;
};

const features = tableFeatures({});
const columnHelper = createColumnHelper<typeof features, AccessTokenTableRow>();

const columns = columnHelper.columns([
  columnHelper.accessor("name", {
    header: "Name",
    meta: { skeleton: <Skeleton className="h-4 w-20" /> },
  }),
  columnHelper.accessor("permissions", {
    header: "Permissions",
    meta: { skeleton: <Skeleton className="h-4 w-24" /> },
    cell: ({ getValue }) =>
      Object.entries(getValue())
        .flatMap(([resource, actions]) => actions.map((action) => `${resource}:${action}`))
        .join(", "),
  }),
  columnHelper.accessor("createdAt", {
    header: "Created at",
    meta: { skeleton: <Skeleton className="h-4 w-34" /> },
    cell: ({ getValue }) => formatDateTime(getValue()),
  }),
  columnHelper.accessor("lastRequest", {
    header: "Last used",
    // Sized for a date: "never" only shows until a token's first use.
    meta: { skeleton: <Skeleton className="h-4 w-34" /> },
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
    meta: {
      className: "text-right",
      skeleton: (
        <ButtonSkeleton size="sm" className="ml-auto">
          <Icon icon={XIcon} />
          revoke
        </ButtonSkeleton>
      ),
    },
    cell: ({ row }) => (
      <RevokeAccessTokenButton tokenId={row.original.id} tokenName={row.original.name} />
    ),
  }),
]);

type AccessTokensTableProps = {
  data: AccessTokenTableRow[];
  // Renders each column's skeleton in place of its cells, for the loading state.
  loading?: boolean;
};

export const AccessTokensTable = ({ data, loading = false }: AccessTokensTableProps) => {
  const table = useTable({
    key: "access-tokens-table",
    columns,
    data,
    features,
    getRowId: (row) => row.id,
  });

  useTanStackTableDevtools(table);

  return (
    <TableContainer aria-hidden={loading || undefined}>
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
                  {loading ? (
                    cell.column.columnDef.meta?.skeleton
                  ) : (
                    <table.FlexRender cell={cell} />
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const SKELETON_ROWS: AccessTokenTableRow[] = Array.from({ length: 3 }, (_, index) => ({
  id: `skeleton-${index}`,
  name: "",
  permissions: {},
  createdAt: new Date(0),
  lastRequest: null,
}));

export const AccessTokensTableSkeleton = () => <AccessTokensTable data={SKELETON_ROWS} loading />;
