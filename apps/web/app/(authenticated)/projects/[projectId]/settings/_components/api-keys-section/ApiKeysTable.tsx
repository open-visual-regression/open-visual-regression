"use client";

import {
  useTable,
  tableFeatures,
  createColumnHelper,
  createCoreRowModel,
} from "@tanstack/react-table";
import { useTanStackTableDevtools } from "@tanstack/react-table-devtools";

import { Skeleton } from "@ovr/ui/components/skeleton";
import { StatusIcon } from "@ovr/ui/components/status-icon";
import {
  Table,
  TableContainer,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@ovr/ui/components/table";

import { formatDateTime } from "@/lib/utils/date";

import { RevokeApiKeyButton } from "./RevokeApiKeyButton";

type ApiKeyTableRow = {
  id: string;
  name: string;
  ownerName: string;
  createdAt: Date;
  lastRequest: Date | null;
};

const features = tableFeatures({});
const columnHelper = createColumnHelper<typeof features, ApiKeyTableRow>();

const columns = columnHelper.columns([
  columnHelper.accessor("name", { header: "Name" }),
  columnHelper.accessor("ownerName", { header: "Owner" }),
  columnHelper.accessor("createdAt", {
    header: "Created at",
    cell: ({ getValue }) => formatDateTime(getValue()),
  }),
  columnHelper.accessor("lastRequest", {
    header: "Last used",
    cell: ({ getValue }) => {
      const lastRequest = getValue();
      if (!lastRequest) {
        return (
          <span className="inline-flex items-center gap-1.5">
            <StatusIcon variant="stale" size={12} />
            never
          </span>
        );
      }
      return formatDateTime(lastRequest);
    },
  }),
  columnHelper.display({
    id: "actions",
    meta: { className: "text-right" },
    cell: ({ row }) => <RevokeApiKeyButton keyId={row.original.id} keyName={row.original.name} />,
  }),
]);

type ApiKeysTableProps = {
  data: ApiKeyTableRow[];
};

export const ApiKeysTable = ({ data }: ApiKeysTableProps) => {
  const table = useTable({
    key: "api-keys-table",
    columns,
    data,
    features,
    rowModels: { coreRowModel: createCoreRowModel() },
    getRowId: (row) => row.id,
  });

  useTanStackTableDevtools(table);

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
    </TableContainer>
  );
};

type ApiKeysTableSkeletonColumn = {
  header: string | null;
  className?: string;
};

const API_KEYS_TABLE_SKELETON_COLUMNS: ApiKeysTableSkeletonColumn[] = [
  { header: "Name" },
  { header: "Owner" },
  { header: "Created at" },
  { header: "Last used" },
  { header: null, className: "text-right" },
];

const API_KEYS_SKELETON_ROW_COUNT = 3;

export const ApiKeysTableSkeleton = () => (
  <TableContainer aria-hidden>
    <Table>
      <TableHeader>
        <TableRow>
          {API_KEYS_TABLE_SKELETON_COLUMNS.map((column, index) => (
            <TableHead key={index} className={column.className}>
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: API_KEYS_SKELETON_ROW_COUNT }, (_, rowIndex) => (
          <TableRow key={rowIndex}>
            {API_KEYS_TABLE_SKELETON_COLUMNS.map((column, columnIndex) => (
              <TableCell key={columnIndex} className={column.className}>
                <Skeleton className="h-4 w-full" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);
