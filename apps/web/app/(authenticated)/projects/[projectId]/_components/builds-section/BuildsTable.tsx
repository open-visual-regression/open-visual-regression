"use client";

import {
  useTable,
  tableFeatures,
  createColumnHelper,
  createCoreRowModel,
  type Column,
} from "@tanstack/react-table";
import { useTanStackTableDevtools } from "@tanstack/react-table-devtools";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

import { type BuildSchema } from "@ovr/api/contracts/builds";
import { Skeleton } from "@ovr/ui/components/skeleton";
import {
  Table,
  TableContainer,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableEmpty,
} from "@ovr/ui/components/table";
import { Typography } from "@ovr/ui/components/typography";

import { BuildStatusBadge, BuildStatusStripe } from "@/lib/components/BuildStatus";
import { TableRowLink } from "@/lib/components/table-row-link/TableRowLink";
import { TableRowLinkCell } from "@/lib/components/table-row-link/TableRowLinkCell";
import { formatRelativeDateTime } from "@/lib/utils/date";

const features = tableFeatures({});
const columnHelper = createColumnHelper<typeof features, BuildSchema>();

const INITIAL_SKELETON_ROW_COUNT = 8;

const columns = columnHelper.columns([
  columnHelper.display({
    id: "statusStripe",
    meta: { className: "w-1 min-w-1 p-0 relative", disableRowLink: true },
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

type SkeletonRowProps = {
  leafColumns: Column<typeof features, BuildSchema>[];
  ref?: React.Ref<HTMLTableRowElement>;
};

const SkeletonRow = ({ leafColumns, ref }: SkeletonRowProps) => (
  <TableRow ref={ref} aria-hidden>
    {leafColumns.map((column) => (
      <TableCell key={column.id} className={column.columnDef.meta?.className}>
        {column.id === "statusStripe" ? null : <Skeleton className="h-4 w-full" />}
      </TableCell>
    ))}
  </TableRow>
);

type BuildsTableProps = {
  data: BuildSchema[];
  search?: string;
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
};

export const BuildsTable = ({
  data,
  search,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: BuildsTableProps) => {
  const table = useTable({
    key: "builds-table",
    columns,
    data,
    features,
    rowModels: { coreRowModel: createCoreRowModel() },
    getRowId: (row) => row.id,
  });

  useTanStackTableDevtools(table);

  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
  const { ref: sentinelRef, inView } = useInView({
    root: scrollElement,
    rootMargin: "200px",
    skip: !hasNextPage,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      onLoadMore();
    }
  }, [inView, hasNextPage, isFetchingNextPage, onLoadMore]);

  const leafColumns = table.getAllLeafColumns();
  const columnCount = leafColumns.length;
  const rows = table.getRowModel().rows;

  return (
    <TableContainer ref={setScrollElement} className="min-h-0 flex-1 overflow-y-auto">
      <Table>
        <TableHeader className="sticky top-0 z-10 [&_th]:bg-ovr-inset">
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
          {isLoading ? (
            Array.from({ length: INITIAL_SKELETON_ROW_COUNT }, (_, index) => (
              <SkeletonRow key={index} leafColumns={leafColumns} />
            ))
          ) : rows.length === 0 ? (
            <TableEmpty colSpan={columnCount}>
              {search ? `no builds found matching "${search}"` : "no builds found"}
            </TableEmpty>
          ) : (
            rows.map((row) => {
              const href = `/projects/${row.original.project.id}/builds/${row.original.id}`;
              const label = `view build ${row.original.commitSha.slice(0, 7)}`;

              return (
                <TableRowLink key={row.id} href={href} label={label} labelColumnId="name">
                  {row.getAllCells().map((cell) => (
                    <TableRowLinkCell key={cell.id} cell={cell}>
                      <table.FlexRender cell={cell} />
                    </TableRowLinkCell>
                  ))}
                </TableRowLink>
              );
            })
          )}
          {!isLoading && hasNextPage ? (
            <SkeletonRow ref={sentinelRef} leafColumns={leafColumns} />
          ) : null}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const BUILDS_TABLE_SKELETON_COLUMNS = [
  { header: null, className: "w-1 min-w-1 p-0 relative" },
  { header: "Status", className: "text-left w-px" },
  { header: "Commit", className: undefined },
  { header: "Branch", className: "w-px" },
  { header: "Author", className: undefined },
  { header: "Created", className: "text-right" },
];

type BuildsTableSkeletonProps = {
  rows?: number;
};

export const BuildsTableSkeleton = ({
  rows = INITIAL_SKELETON_ROW_COUNT,
}: BuildsTableSkeletonProps = {}) => (
  <TableContainer className="min-h-0 flex-1 overflow-y-auto">
    <Table>
      <TableHeader className="sticky top-0 z-10 [&_th]:bg-ovr-inset">
        <TableRow>
          {BUILDS_TABLE_SKELETON_COLUMNS.map((column, index) => (
            <TableHead key={index} className={column.className}>
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }, (_, rowIndex) => (
          <TableRow key={rowIndex} aria-hidden>
            {BUILDS_TABLE_SKELETON_COLUMNS.map((column, columnIndex) => (
              <TableCell key={columnIndex} className={column.className}>
                {columnIndex === 0 ? null : <Skeleton className="h-4 w-full" />}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);
