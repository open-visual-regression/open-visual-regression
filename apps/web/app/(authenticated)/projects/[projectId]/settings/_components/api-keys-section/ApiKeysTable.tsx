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
import { useTanStackTableDevtools } from "@tanstack/react-table-devtools";

type ApiKeyTableRow = {
  id: string;
  name: string | null;
  ownerName: string;
  createdAt: Date;
};

const features = tableFeatures({});
const columnHelper = createColumnHelper<typeof features, ApiKeyTableRow>();

const columns = columnHelper.columns([
  columnHelper.accessor("id", {}),
  columnHelper.accessor("name", { header: "Name" }),
  columnHelper.accessor("ownerName", { header: "Owner" }),
  columnHelper.accessor("createdAt", { header: "Created" }),
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
    initialState: {
      columnVisibility: {
        id: false,
      },
    },
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
