"use client";

import {
  useTable,
  tableFeatures,
  createColumnHelper,
  rowSelectionFeature,
} from "@tanstack/react-table";
import { useTanStackTableDevtools } from "@tanstack/react-table-devtools";
import { useMemo } from "react";

import { type UserSchema } from "@ovr/api/contracts/users";
import { Badge } from "@ovr/ui/components/badge";
import { Checkbox } from "@ovr/ui/components/checkbox";
import {
  Table,
  TableContainer,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableEmpty,
} from "@ovr/ui/components/table";

import { CopyButton } from "@/lib/components/copy-button/CopyButton";

import { toRole } from "./role";
import { RoleActions } from "./RoleActions";
import { UsersTableBulkActions } from "./UsersTableBulkActions";

const features = tableFeatures({ rowSelectionFeature });
const columnHelper = createColumnHelper<typeof features, UserSchema>();

type UsersTableProps = {
  data: UserSchema[];
  currentUserId: string;
  search?: string;
};

export const UsersTable = ({ data, currentUserId, search }: UsersTableProps) => {
  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: "select",
          meta: { className: "w-px" },
          cell: ({ row }) =>
            row.getCanSelect() ? (
              <Checkbox
                aria-label={`select ${row.original.name}`}
                checked={row.getIsSelected()}
                onCheckedChange={(checked) => row.toggleSelected(checked)}
              />
            ) : null,
        }),
        columnHelper.accessor("name", { header: "Name" }),
        columnHelper.accessor("email", { header: "Email" }),
        columnHelper.accessor("role", {
          header: "Role",
          cell: ({ row }) => (
            <RoleActions
              userId={row.original.id}
              name={row.original.name}
              role={toRole(row.original.role)}
              disabled={row.original.status !== "active" || row.original.id === currentUserId}
            />
          ),
        }),
        columnHelper.accessor("status", {
          header: "Status",
          meta: { className: "text-center" },
          cell: ({ getValue }) =>
            getValue() === "invited" ? (
              <Badge color="gray">invited</Badge>
            ) : (
              <Badge color="green">active</Badge>
            ),
        }),
        columnHelper.display({
          id: "actions",
          meta: { className: "w-px text-center" },
          cell: ({ row }) =>
            row.original.status === "invited" ? (
              <CopyButton text={row.original.invitationUrl}>copy invite</CopyButton>
            ) : null,
        }),
      ]),
    [currentUserId],
  );

  const table = useTable({
    key: "users-table",
    columns,
    data,
    features,
    getRowId: (row) => row.id,
    enableRowSelection: (row) => row.original.id !== currentUserId,
  });

  useTanStackTableDevtools(table);

  const selectedUsers = table.getSelectedRowModel().rows.map((row) => row.original);
  const columnCount = table.getAllLeafColumns().length;

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
          {table.getRowModel().rows.length === 0 ? (
            <TableEmpty colSpan={columnCount}>
              {search ? `no users found matching "${search}"` : "no users found"}
            </TableEmpty>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id} className={cell.column.columnDef.meta?.className}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
        {selectedUsers.length > 0 && (
          <TableFooter>
            <TableRow className="h-auto">
              <TableCell colSpan={columnCount} className="py-2">
                <UsersTableBulkActions
                  users={selectedUsers}
                  onRemovedAction={() => table.resetRowSelection()}
                />
              </TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </TableContainer>
  );
};
