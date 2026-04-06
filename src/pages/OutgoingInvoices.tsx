import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Eye } from 'lucide-react';

import { useInvoiceListByUser } from '@/api/invoices/invoices';
import { useNavigate } from 'react-router-dom';

export default function OutgoingInvoices() {
  const navigate = useNavigate();
  const invoices = useInvoiceListByUser({ type: 'OUTGOING' });

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Faktury vydané
          </h1>
          <p className="mt-2 text-muted-foreground">Sledujte faktury vydané</p>
        </div>
        <Button className="gap-2" onClick={() => navigate('/invoices/create')}>
          <Plus className="h-4 w-4" />
          Vytvořit fakturu
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Všechny faktury</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Číslo faktury</TableHead>
                <TableHead>Odběratel</TableHead>
                <TableHead>Částka</TableHead>
                <TableHead>Datum vystavení</TableHead>
                <TableHead>Datum zdanitelného plnění</TableHead>
                <TableHead className="text-right">Akce</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.data?.data?.data?.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  className="hover:bg-secondary/50"
                >
                  <TableCell className="font-mono font-medium">
                    {invoice.number}
                  </TableCell>
                  <TableCell>{invoice.company?.name || invoice.supplier?.name || '-'}</TableCell>
                  <TableCell className="font-semibold text-warning">
                    {invoice.total}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {invoice.createdDate}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {invoice.taxDate}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/invoices/${invoice.id}`)}
                      aria-label={`Zobrazit fakturu ${invoice.number}`}
                      title="Zobrazit"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
