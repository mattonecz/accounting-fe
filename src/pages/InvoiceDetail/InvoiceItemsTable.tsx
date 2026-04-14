import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { InvoiceResponseDto } from '@/api/model';
import { formatMoney } from './utils';

interface InvoiceItemsTableProps {
  invoice: InvoiceResponseDto;
  currency: string;
}

export const InvoiceItemsTable = ({
  invoice,
  currency,
}: InvoiceItemsTableProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Položky faktury</CardTitle>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Položka</TableHead>
            <TableHead className="text-right">Množství</TableHead>
            <TableHead className="text-right">Cena za jednotku</TableHead>
            <TableHead className="text-right">DPH</TableHead>
            <TableHead className="text-right">Celkem</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoice.items.map((item, index) => {
            const quantity = item.amount || 0;
            const total =
              quantity *
              (item.pricePerUnit || 0) *
              (1 + (item.vat || 0) / 100);

            return (
              <TableRow key={`${item.name}-${index}`}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-right">{quantity}</TableCell>
                <TableCell className="text-right">
                  {formatMoney(item.pricePerUnit || 0, currency)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline">{item.vat}%</Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatMoney(total, currency)}
                </TableCell>
              </TableRow>
            );
          })}
          <TableRow>
            <TableCell colSpan={4} className="text-lg font-semibold">
              Celkem
            </TableCell>
            <TableCell className="text-right text-lg font-semibold">
              {formatMoney(invoice.totalWithTax, currency)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);
