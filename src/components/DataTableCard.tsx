import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Column<T> {
  header: string;
  headerClassName?: string;
  cell: (row: T) => React.ReactNode;
  cellClassName?: string;
}

interface DataTableCardProps<T> {
  title: string;
  columns: Column<T>[];
  data: T[] | undefined;
  isLoading?: boolean;
  isError?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
  errorMessage?: string;
  onRowClick?: (row: T) => void;
  rowClassName?: string;
}

export function DataTableCard<T>({
  title,
  columns,
  data,
  isLoading,
  isError,
  emptyMessage = 'Žádné záznamy.',
  loadingMessage = 'Načítání...',
  errorMessage = 'Nepodařilo se načíst data.',
  onRowClick,
  rowClassName,
}: DataTableCardProps<T>) {
  const colSpan = columns.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col, i) => (
                <TableHead key={i} className={col.headerClassName}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((row, rowIndex) => (
              <TableRow
                key={rowIndex}
                className={
                  onRowClick
                    ? `cursor-pointer hover:bg-secondary/50 ${rowClassName ?? ''}`
                    : rowClassName
                }
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col, colIndex) => (
                  <TableCell key={colIndex} className={col.cellClassName}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {!isLoading && !isError && !data?.length && (
              <TableRow>
                <TableCell
                  colSpan={colSpan}
                  className="text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
            {isLoading && (
              <TableRow>
                <TableCell
                  colSpan={colSpan}
                  className="text-center text-muted-foreground"
                >
                  {loadingMessage}
                </TableCell>
              </TableRow>
            )}
            {isError && (
              <TableRow>
                <TableCell
                  colSpan={colSpan}
                  className="text-center text-destructive"
                >
                  {errorMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
