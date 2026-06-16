"use client";

import {
  useTable,
  tableFeatures,
  createColumnHelper,
  createCoreRowModel,
  rowSelectionFeature,
} from "@tanstack/react-table";
import { useTanStackTableDevtools } from "@tanstack/react-table-devtools";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableEmpty,
} from "@ovr/ui/components/table";
import { Badge } from "@ovr/ui/components/badge";
import { Checkbox } from "@ovr/ui/components/checkbox";
import { CopyButton } from "@/lib/components/copy-button/CopyButton";
import { type UserSchema } from "@ovr/api/contracts/users";
import { UsersTableBulkActions } from "./UsersTableBulkActions";

const features = tableFeatures({ rowSelectionFeature });
const columnHelper = createColumnHelper<typeof features, UserSchema>();

const columns = columnHelper.columns([
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
    meta: { className: "text-center" },
    cell: ({ getValue }) =>
      getValue() === "admin" ? (
        <Badge variant="changed">admin</Badge>
      ) : (
        <Badge variant="neutral">user</Badge>
      ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    meta: { className: "text-center" },
    cell: ({ getValue }) =>
      getValue() === "invited" ? (
        <Badge variant="pending">invited</Badge>
      ) : (
        <Badge variant="pass">active</Badge>
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
]);

type UsersTableProps = {
  data: UserSchema[];
  currentUserId: string;
  search?: string;
};

export const UsersTable = ({ data, currentUserId, search }: UsersTableProps) => {
  const table = useTable({
    key: "users-table",
    columns,
    data,
    features,
    rowModels: { coreRowModel: createCoreRowModel() },
    getRowId: (row) => row.id,
    enableRowSelection: (row) => row.original.id !== currentUserId,
  });

  useTanStackTableDevtools(table);

  const selectedUsers = table.getSelectedRowModel().rows.map((row) => row.original);
  const columnCount = table.getAllLeafColumns().length;

  return (
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
  );
};
