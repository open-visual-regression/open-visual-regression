"use client";

import { type ComponentProps, type ReactNode } from "react";

import { TableRow } from "@ovr/ui/components/table";
import { cn } from "@ovr/ui/lib/utils";

import { TableRowLinkContext, type TableRowLinkContextValue } from "./TableRowLinkContext";

type TableRowLinkProps = Omit<ComponentProps<typeof TableRow>, "children"> &
  TableRowLinkContextValue & {
    children: ReactNode;
  };

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
