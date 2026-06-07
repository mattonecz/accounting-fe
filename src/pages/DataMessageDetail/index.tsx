import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import {
  useDataMessagesGetById,
  useDataMessagesGetStatus,
} from '@/api/data-messages/data-messages';
import { MessageStatusResponseDtoState } from '@/api/model';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { FormCard } from '@/components/FormCard';
import { DataMessageStatusBadge } from '@/components/DataMessageStatusBadge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatDate, formatDateTime } from '@/lib/formatters';

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between border-b border-border/60 py-2 last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium">{value}</span>
  </div>
);

// States where the message is still in flight and the live ISDS status
// endpoint is worth calling. Final states render from the stored record.
const NON_TERMINAL_STATES: MessageStatusResponseDtoState[] = [
  MessageStatusResponseDtoState.SENT,
  MessageStatusResponseDtoState.SERVED,
];

const DataMessageDetail = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();

  const {
    data: recordData,
    isLoading: recordLoading,
    isError: recordError,
  } = useDataMessagesGetById(id || '');
  const record = recordData?.data;

  // Only hit the live ISDS status endpoint while the message is still in
  // flight; final states render straight from the stored record.
  const shouldFetchStatus = record
    ? NON_TERMINAL_STATES.includes(record.state)
    : false;

  const { data } = useDataMessagesGetStatus(id || '', {
    query: {
      enabled: Boolean(id) && shouldFetchStatus,
      // Refresh only while the message is still SENT; stop once it advances.
      refetchInterval: (query) =>
        query.state.data?.data.state === MessageStatusResponseDtoState.SENT
          ? 5000
          : false,
    },
  });

  const fmtDate = (value: unknown) =>
    value ? formatDate(value as string, i18n.language) : '–';
  const fmtDateTime = (value: unknown) =>
    value ? formatDateTime(value as string, i18n.language) : '–';
  const fmtText = (value: unknown) => (value ? String(value) : '–');

  if (!id) {
    return (
      <PageLayout>
        <p className="text-muted-foreground">{t('dataMessages.detail.invalidId')}</p>
      </PageLayout>
    );
  }

  if (recordLoading) {
    return (
      <PageLayout>
        <p className="text-muted-foreground">{t('dataMessages.detail.loading')}</p>
      </PageLayout>
    );
  }

  if (recordError || !record) {
    return (
      <PageLayout>
        <p className="text-destructive">{t('dataMessages.detail.error')}</p>
      </PageLayout>
    );
  }

  const status = data?.data;
  // Prefer the live status response while polling; otherwise use the stored
  // record (final messages, where the live endpoint isn't called).
  const source = status ?? record;
  const subject = record.subject;
  const events = source.events;
  const hasError =
    source.state === MessageStatusResponseDtoState.FAILED &&
    Boolean(source.statusMessage);

  return (
    <PageLayout className="space-y-4">
      <PageHeader
        title={subject}
        description={t('dataMessages.title')}
        backButton
        actions={<DataMessageStatusBadge state={source.state} />}
      />

      {hasError && (
        <Alert variant="destructive">
          <AlertTitle>{t('dataMessages.detail.errorTitle')}</AlertTitle>
          <AlertDescription>{String(source.statusMessage)}</AlertDescription>
        </Alert>
      )}

      <FormCard title={t('dataMessages.detail.infoSection')}>
        <div className="space-y-1">
          <InfoRow
            label={t('dataMessages.detail.messageId')}
            value={fmtText(source.messageId)}
          />
          <InfoRow
            label={t('dataMessages.detail.direction')}
            value={
              record
                ? t(`dataMessages.directions.${record.direction}`, record.direction)
                : '–'
            }
          />
          <InfoRow
            label={t('dataMessages.detail.recipient')}
            value={record?.recipient ?? '–'}
          />
          <InfoRow
            label={t('dataMessages.detail.subject')}
            value={record?.subject ?? '–'}
          />
          <InfoRow
            label={t('dataMessages.detail.state')}
            value={<DataMessageStatusBadge state={source.state} />}
          />
          <InfoRow
            label={t('dataMessages.detail.statusCode')}
            value={fmtText(source.statusCode)}
          />
          <InfoRow
            label={t('dataMessages.detail.statusMessage')}
            value={fmtText(source.statusMessage)}
          />
          <InfoRow
            label={t('dataMessages.detail.sentAt')}
            value={fmtDate(source.sentAt)}
          />
          <InfoRow
            label={t('dataMessages.detail.servedAt')}
            value={fmtDate(source.servedAt)}
          />
          <InfoRow
            label={t('dataMessages.detail.deliveredAt')}
            value={fmtDate(source.deliveredAt)}
          />
          <InfoRow
            label={t('dataMessages.detail.rawStateCode')}
            value={fmtText(source.rawStateCode)}
          />
        </div>
      </FormCard>

      <FormCard title={t('dataMessages.detail.eventsSection')}>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('dataMessages.detail.noEvents')}
          </p>
        ) : (
          <ol className="space-y-3">
            {events.map((event, index) => (
              <li
                key={index}
                className="flex flex-col gap-0.5 border-l-2 border-border pl-3"
              >
                <span className="text-xs text-muted-foreground">
                  {fmtDateTime(event.time)}
                </span>
                <span className="text-sm">
                  {event.description ? String(event.description) : '–'}
                </span>
              </li>
            ))}
          </ol>
        )}
      </FormCard>
    </PageLayout>
  );
};

export default DataMessageDetail;
