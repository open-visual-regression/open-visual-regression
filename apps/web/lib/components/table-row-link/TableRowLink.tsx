"use client";

import { type ComponentProps, type ReactNode } from "react";

import { TableRow } from "@ovr/ui/components/table";
import { cn } from "@ovr/ui/lib/utils";

import { TableRowLinkContext, type TableRowLinkContextValue } from "./TableRowLinkContext";

type TableRowLinkProps = Omit<ComponentProps<typeof TableRow>, "children"> &
  TableRowLinkContextValue & {
    children: ReactNode;
  };

// Renders a <tr> whose cells (via TableRowLinkCell) each link to `href`, so the whole
// row is clickable. `labelColumnId` picks which cell's link carries the accessible name
// and tab stop for keyboard/screen-reader users; the rest are hidden duplicates.
export const TableRowLink = ({
  href,
  label,
  labelColumnId,
  className,
  children,
  ...props
}: TableRowLinkProps) => (
  <TableRowLinkContext.Provider value={{ href, label, labelColumnId }}>
    <TableRow className={cn("has-[a:hover,a:focus-visible]:bg-ovr-hover", className)} {...props}>
      {children}
    </TableRow>
  </TableRowLinkContext.Provider>
);
