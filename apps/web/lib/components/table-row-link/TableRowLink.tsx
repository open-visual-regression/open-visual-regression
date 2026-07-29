import type { CellData, RowData, TableFeatures } from "@tanstack/table-core";
import Link from "next/link";
import { type ComponentProps, type ReactNode } from "react";

import { TableCell, TableRow } from "@ovr/ui/components/table";
import { cn } from "@ovr/ui/lib/utils";

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

type TableRowLinkProps = ComponentProps<typeof TableRow>;

export const TableRowLink = ({ className, ...props }: TableRowLinkProps) => (
  <TableRow className={cn("has-[a:hover,a:focus-visible]:bg-ovr-hover", className)} {...props} />
);

type TableRowLinkCellProps = {
  href: string;
  label?: string;
  className?: string;
  children: ReactNode;
};

export const TableRowLinkCell = ({ href, label, className, children }: TableRowLinkCellProps) => (
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
