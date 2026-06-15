"use client";

import {
  useTable,
  tableFeatures,
  createColumnHelper,
  createCoreRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@ovr/ui/components/table";
import { Badge } from "@ovr/ui/components/badge";
import { StatusIcon } from "@ovr/ui/components/status-icon";
import { useTanStackTableDevtools } from "@tanstack/react-table-devtools";
import { formatDateTime } from "@/lib/utils/date";
import { type UserSchema } from "@ovr/api/contracts/users";
import { CopyInviteButton } from "./CopyInviteButton";

const features = tableFeatures({});
const columnHelper = createColumnHelper<typeof features, UserSchema>();

const columns = columnHelper.columns([
  columnHelper.accessor("name", { header: "Name" }),
  columnHelper.accessor("email", { header: "Email" }),
  columnHelper.accessor("role", {
    header: "Role",
    cell: ({ getValue }) =>
      getValue() === "admin" ? (
        <Badge variant="changed">admin</Badge>
      ) : (
        <Badge variant="neutral">user</Badge>
      ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) =>
      getValue() === "invited" ? (
        <Badge variant="pending">invited</Badge>
      ) : (
        <Badge variant="pass">active</Badge>
      ),
  }),
  columnHelper.accessor("lastLoginAt", {
    header: "Last login",
    cell: ({ getValue }) => {
      const lastLoginAt = getValue();
      if (!lastLoginAt) {
        return (
          <span className="inline-flex items-center gap-1.5">
            <StatusIcon variant="stale" size={12} />
            never
          </span>
        );
      }
      return formatDateTime(lastLoginAt);
    },
  }),
  columnHelper.accessor("createdAt", {
    header: "Created",
    cell: ({ getValue }) => formatDateTime(getValue()),
  }),
  columnHelper.display({
    id: "actions",
    meta: { className: "w-px" },
    cell: ({ row }) =>
      row.original.invitationUrl ? (
        <CopyInviteButton invitationUrl={row.original.invitationUrl} />
      ) : null,
  }),
]);

type UsersTableProps = {
  data: UserSchema[];
};

export const UsersTable = ({ data }: UsersTableProps) => {
  const table = useTable({
    key: "users-table",
    columns,
    data,
    features,
    rowModels: { coreRowModel: createCoreRowModel() },
    getRowId: (row) => row.id,
  });

  useTanStackTableDevtools(table);

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
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getAllCells().map((cell) => (
              <TableCell key={cell.id} className={cell.column.columnDef.meta?.className}>
                <table.FlexRender cell={cell} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
