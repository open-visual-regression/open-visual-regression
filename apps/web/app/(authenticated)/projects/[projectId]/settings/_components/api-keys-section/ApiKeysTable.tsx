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
import { StatusIcon } from "@ovr/ui/components/status-icon";
import { useTanStackTableDevtools } from "@tanstack/react-table-devtools";
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
    header: "Created",
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
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id} colSpan={header.colSpan}>
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
              <TableCell key={cell.id}>
                <table.FlexRender cell={cell} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
