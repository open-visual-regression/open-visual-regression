import * as React from "react";
import type { CellData, RowData, TableFeatures } from "@tanstack/table-core";

import { cn } from "../../lib/utils";

declare module "@tanstack/table-core" {
  // oxlint-disable-next-line typescript/consistent-type-definitions -- module augmentation requires `interface`
  interface ColumnMeta<
    TFeatures extends TableFeatures,
    TData extends RowData,
    TValue extends CellData = CellData,
  > {
    className?: string;
  }
}

const TableCaption = ({ className, ...props }: React.ComponentProps<"p">) => (
  <p
    data-slot="table-caption"
    className={cn("mt-3 text-label text-ovr-fg-tertiary", className)}
    {...props}
  />
);

const Table = ({ className, children, ...props }: React.ComponentProps<"table">) => {
  const childArray = React.Children.toArray(children);
  const caption = childArray.filter(
    (child) => React.isValidElement(child) && child.type === TableCaption,
  );
  const tableChildren = childArray.filter(
    (child) => !(React.isValidElement(child) && child.type === TableCaption),
  );
  return (
    <div className="relative w-full">
      <div
        data-slot="table-container"
        className="overflow-x-auto rounded-card border border-ovr-border bg-ovr-elevated"
      >
        <table data-slot="table" className={cn("w-full text-body-sm", className)} {...props}>
          {tableChildren}
        </table>
      </div>
      {caption}
    </div>
  );
};

const TableHeader = ({ className, ...props }: React.ComponentProps<"thead">) => (
  <thead
    data-slot="table-header"
    className={cn("[&_tr]:bg-ovr-inset [&_tr]:border-b [&_tr]:border-ovr-border", className)}
    {...props}
  />
);

const TableBody = ({ className, ...props }: React.ComponentProps<"tbody">) => (
  <tbody
    data-slot="table-body"
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
);

const TableFooter = ({ className, ...props }: React.ComponentProps<"tfoot">) => (
  <tfoot
    data-slot="table-footer"
    className={cn(
      "border-t border-ovr-border bg-ovr-inset font-medium [&>tr]:last:border-b-0",
      className,
    )}
    {...props}
  />
);

const TableRow = ({ className, ...props }: React.ComponentProps<"tr">) => (
  <tr
    data-slot="table-row"
    className={cn(
      "h-8 border-b border-ovr-border-subtle transition-colors has-aria-expanded:bg-ovr-hover data-[state=selected]:bg-ovr-active",
      className,
    )}
    {...props}
  />
);

const TableHead = ({ className, ...props }: React.ComponentProps<"th">) => (
  <th
    data-slot="table-head"
    className={cn(
      "h-8 px-3 text-left align-middle text-badge font-semibold uppercase tracking-[0.08em] whitespace-nowrap text-ovr-fg-tertiary [&:has([role=checkbox])]:pr-0",
      className,
    )}
    {...props}
  />
);

const TableCell = ({ className, ...props }: React.ComponentProps<"td">) => (
  <td
    data-slot="table-cell"
    className={cn(
      "px-3 py-0 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
      className,
    )}
    {...props}
  />
);

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
