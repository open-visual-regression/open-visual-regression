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
import { Badge, BadgeSkeleton } from "@ovr/ui/components/badge";
import { ButtonSkeleton } from "@ovr/ui/components/button";
import { Checkbox } from "@ovr/ui/components/checkbox";
import { ChevronDownIcon, Icon } from "@ovr/ui/components/icon";
import { Skeleton } from "@ovr/ui/components/skeleton";
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
  readOnly?: boolean;
  // Renders each column's skeleton in place of its cells, for the loading state.
  loading?: boolean;
};

export const UsersTable = ({
  data,
  currentUserId,
  search,
  readOnly = false,
  loading = false,
}: UsersTableProps) => {
  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: "select",
          meta: {
            className: "w-px",
            skeleton: <Skeleton className="size-3.5 rounded-lg" />,
          },
          cell: ({ row }) =>
            row.getCanSelect() ? (
              <Checkbox
                aria-label={`select ${row.original.name}`}
                checked={row.getIsSelected()}
                onCheckedChange={(checked) => row.toggleSelected(checked)}
              />
            ) : null,
        }),
        columnHelper.accessor("name", {
          header: "Name",
          meta: { skeleton: <Skeleton className="h-4 w-24" /> },
        }),
        columnHelper.accessor("email", {
          header: "Email",
          meta: { skeleton: <Skeleton className="h-4 w-40" /> },
        }),
        columnHelper.accessor("role", {
          header: "Role",
          meta: {
            skeleton: (
              <ButtonSkeleton size="sm" className="w-full justify-between">
                member
                <Icon icon={ChevronDownIcon} size={12} />
              </ButtonSkeleton>
            ),
          },
          cell: ({ row }) => (
            <RoleActions
              userId={row.original.id}
              name={row.original.name}
              role={toRole(row.original.role)}
              disabled={
                readOnly || row.original.status !== "active" || row.original.id === currentUserId
              }
            />
          ),
        }),
        columnHelper.accessor("status", {
          header: "Status",
          meta: { className: "text-center", skeleton: <BadgeSkeleton className="w-14" /> },
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
    [currentUserId, readOnly],
  );

  const table = useTable({
    key: "users-table",
    columns,
    data,
    features,
    getRowId: (row) => row.id,
    enableRowSelection: (row) => !readOnly && row.original.id !== currentUserId,
  });

  useTanStackTableDevtools(table);

  const selectedUsers = table.getSelectedRowModel().rows.map((row) => row.original);
  const columnCount = table.getAllLeafColumns().length;

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
          {table.getRowModel().rows.length === 0 ? (
            <TableEmpty colSpan={columnCount}>
              {search ? `no users found matching "${search}"` : "no users found"}
            </TableEmpty>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
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

// Only the ids are read while loading; every cell shows its column's skeleton instead.
const SKELETON_ROWS = Array.from({ length: 3 }, (_, index) => ({
  id: `skeleton-${index}`,
})) as UserSchema[];

export const UsersTableSkeleton = () => (
  <UsersTable data={SKELETON_ROWS} currentUserId="" readOnly loading />
);
