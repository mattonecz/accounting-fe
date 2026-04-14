import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History } from 'lucide-react';
import type { InvoiceStatusHistoryItemDto } from '@/api/model';
import { formatDate, getStatusHistoryLabel, formatHistoryValue } from './utils';

interface StatusHistoryCardProps {
  statusHistory?: InvoiceStatusHistoryItemDto[];
}

export const StatusHistoryCard = ({
  statusHistory,
}: StatusHistoryCardProps) => (
  <Card>
    <CardHeader>
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardTitle>Historie stavů</CardTitle>
        </div>
        <div className="rounded-xl bg-muted/60 p-3 text-muted-foreground">
          <History className="h-5 w-5" />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      {!statusHistory?.length ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          K této faktuře zatím není k dispozici historie stavů.
        </div>
      ) : (
        <div className="space-y-4">
          {[...statusHistory]
            .sort(
              (first, second) =>
                new Date(second.datetime).getTime() -
                new Date(first.datetime).getTime(),
            )
            .map((entry, index) => (
              <div
                key={`${entry.status}-${entry.datetime}-${index}`}
                className="rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      {getStatusHistoryLabel(entry.status)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(entry.datetime)}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {entry.updated?.length
                      ? `${entry.updated.length} změn`
                      : 'Změna stavu'}
                  </span>
                </div>

                {entry.updated?.length ? (
                  <div className="mt-4 space-y-2">
                    {entry.updated.map((change, changeIndex) => (
                      <div
                        key={`${change.item}-${changeIndex}`}
                        className="rounded-lg bg-muted/40 p-3 text-sm"
                      >
                        <div className="font-medium text-foreground">
                          {change.item}
                        </div>
                        <div className="mt-1 text-muted-foreground">
                          {formatHistoryValue(change.originalValue)} →{' '}
                          {formatHistoryValue(change.newValue)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
        </div>
      )}
    </CardContent>
  </Card>
);
