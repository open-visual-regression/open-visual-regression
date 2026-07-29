"use client";

import type { CellData, Cell, RowData, TableFeatures } from "@tanstack/table-core";
import Link from "next/link";
import { type ReactNode } from "react";

import { TableCell } from "@ovr/ui/components/table";
import { cn } from "@ovr/ui/lib/utils";

import { useTableRowLinkContext } from "./TableRowLinkContext";

declare module "@tanstack/table-core" {
  // oxlint-disable-next-line typescript/consistent-type-definitions -- module augmentation requires `interface`
  interface ColumnMeta<
    TFeatures extends TableFeatures,
    TData extends RowData,
    TValue extends CellData = CellData,
  > {
    // Opt a column out of the row link, e.g. a purely decorative column with no content
    // of its own. Columns default to being part of the row link.
    disableRowLink?: boolean;
  }
}

type TableRowLinkCellProps<TFeatures extends TableFeatures, TData extends RowData> = {
  cell: Cell<TFeatures, TData, unknown>;
  children: ReactNode;
};

// Drop-in replacement for TableCell inside a TableRowLink row: renders the cell's own
// link, scoped to just this <td> (a reliable containing block in every browser, unlike
// relying on the <tr>). Columns marked `disableRowLink` in their meta render as a plain
// TableCell instead.
export const TableRowLinkCell = <TFeatures extends TableFeatures, TData extends RowData>({
  cell,
  children,
}: TableRowLinkCellProps<TFeatures, TData>) => {
  const { href, label, labelColumnId } = useTableRowLinkContext();
  const className = cell.column.columnDef.meta?.className;

  if (cell.column.columnDef.meta?.disableRowLink) {
    return <TableCell className={className}>{children}</TableCell>;
  }

  const isLabelCell = cell.column.id === labelColumnId;

  return (
    <TableCell className={cn("relative", className)}>
      <Link
        href={href}
        tabIndex={isLabelCell ? undefined : -1}
        aria-hidden={isLabelCell ? undefined : true}
        className="absolute inset-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ovr-accent"
      >
        {isLabelCell ? <span className="sr-only">{label}</span> : null}
      </Link>
      {children}
    </TableCell>
  );
};
