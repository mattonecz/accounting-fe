import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import type { InvoiceStatusHistoryItemDto } from '@/api/model';
import { cn } from '@/lib/utils';
import { DetailCard, SectionLabel } from './primitives';
import { formatDate, getStatusHistoryLabel, formatHistoryValue } from './utils';

interface StatusHistoryCardProps {
  statusHistory?: InvoiceStatusHistoryItemDto[];
}

export const StatusHistoryCard = ({
  statusHistory,
}: StatusHistoryCardProps) => {
  const { t } = useTranslation();

  const entries = [...(statusHistory ?? [])].sort(
    (first, second) =>
      new Date(second.datetime).getTime() - new Date(first.datetime).getTime(),
  );

  return (
    <DetailCard>
      <div className="mb-4 flex items-center justify-between">
        <SectionLabel>{t('invoices.detail.statusHistory.title')}</SectionLabel>
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      {!entries.length ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {t('invoices.detail.statusHistory.empty')}
        </div>
      ) : (
        <div>
          {entries.map((entry, index) => {
            const last = index === entries.length - 1;
            const isPaid = entry.status === 'PAID';

            return (
              <div
                key={`${entry.status}-${entry.datetime}-${index}`}
                className={cn('flex gap-3.5', !last && 'pb-5')}
              >
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      'mt-1 h-2.5 w-2.5 shrink-0 rounded-full',
                      isPaid ? 'bg-success' : 'bg-muted-foreground/50',
                    )}
                  />
                  {!last && <span className="mt-1 w-px flex-1 bg-border" />}
                </div>

                <div className="flex-1 pb-0.5">
                  <div className="flex items-baseline gap-2.5">
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        isPaid ? 'text-success' : 'text-foreground',
                      )}
                    >
                      {getStatusHistoryLabel(entry.status)}
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {formatDate(entry.datetime)}
                    </span>
                  </div>

                  {entry.updated?.length ? (
                    <div className="mt-2 space-y-1.5">
                      {entry.updated.map((change, changeIndex) => (
                        <div
                          key={`${change.item}-${changeIndex}`}
                          className="rounded-md bg-muted/50 px-3 py-2 text-xs"
                        >
                          <span className="font-medium text-foreground">
                            {change.item}
                          </span>
                          <span className="text-muted-foreground">
                            {': '}
                            {formatHistoryValue(change.originalValue)} →{' '}
                            {formatHistoryValue(change.newValue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {t('invoices.detail.statusHistory.statusChange')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DetailCard>
  );
};
