"use client";

import {
  useTable,
  tableFeatures,
  createColumnHelper,
  createCoreRowModel,
  type Column,
} from "@tanstack/react-table";
import { useTanStackTableDevtools } from "@tanstack/react-table-devtools";
import type { CellData, RowData, TableFeatures } from "@tanstack/table-core";
import Link from "next/link";
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
import { cn } from "@ovr/ui/lib/utils";

import { BuildStatusBadge, BuildStatusStripe } from "@/lib/components/BuildStatus";
import { formatRelativeDateTime } from "@/lib/utils/date";

declare module "@tanstack/table-core" {
  // oxlint-disable-next-line typescript/consistent-type-definitions -- module augmentation requires `interface`
  interface ColumnMeta<
    TFeatures extends TableFeatures,
    TData extends RowData,
    TValue extends CellData = CellData,
  > {
    disableRowLink?: boolean;
  }
}

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

type RowLinkCellProps = {
  href: string;
  label?: string;
  className?: string;
  children: React.ReactNode;
};

// Every cell in a row gets its own link scoped to that cell so tapping anywhere in the
// row navigates to the row's build. Only one link per row keeps its accessible name and
// tab stop; the rest are hidden from keyboard/screen-reader users to avoid duplicate
// announcements of the same destination.
const RowLinkCell = ({ href, label, className, children }: RowLinkCellProps) => (
  <TableCell className={cn("relative", className)}>
    <Link
      href={href}
      tabIndex={label ? undefined : -1}
      aria-hidden={label ? undefined : true}
      className="absolute inset-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ovr-accent"
    >
      {label ? <span className="sr-only">{label}</span> : null}
    </Link>
    {children}
  </TableCell>
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
                <TableRow key={row.id} className="has-[a:hover,a:focus-visible]:bg-ovr-hover">
                  {row.getAllCells().map((cell) =>
                    cell.column.columnDef.meta?.disableRowLink ? (
                      <TableCell key={cell.id} className={cell.column.columnDef.meta?.className}>
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ) : (
                      <RowLinkCell
                        key={cell.id}
                        href={href}
                        label={cell.column.id === "name" ? label : undefined}
                        className={cell.column.columnDef.meta?.className}
                      >
                        <table.FlexRender cell={cell} />
                      </RowLinkCell>
                    ),
                  )}
                </TableRow>
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
