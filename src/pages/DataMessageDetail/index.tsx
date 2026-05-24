import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import {
  useDataMessagesGetStatus,
  useDataMessagesList,
} from '@/api/data-messages/data-messages';
import { MessageStatusResponseDtoState } from '@/api/model';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { FormCard } from '@/components/FormCard';
import { DataMessageStatusBadge } from '@/components/DataMessageStatusBadge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatDate } from '@/lib/formatters';

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between border-b border-border/60 py-2 last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium">{value}</span>
  </div>
);

const NON_TERMINAL_STATES: MessageStatusResponseDtoState[] = [
  MessageStatusResponseDtoState.SENT,
  MessageStatusResponseDtoState.DELIVERED,
];

const DataMessageDetail = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();

  const { data, isLoading, isError } = useDataMessagesGetStatus(id || '', {
    query: {
      refetchInterval: (query) =>
        query.state.data?.data.state &&
        NON_TERMINAL_STATES.includes(query.state.data.data.state)
          ? 5000
          : false,
    },
  });

  const { data: listData } = useDataMessagesList();

  const fmtDate = (value: unknown) =>
    value ? formatDate(value as string, i18n.language) : '–';
  const fmtText = (value: unknown) => (value ? String(value) : '–');

  if (!id) {
    return (
      <PageLayout>
        <p className="text-muted-foreground">{t('dataMessages.detail.invalidId')}</p>
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout>
        <p className="text-muted-foreground">{t('dataMessages.detail.loading')}</p>
      </PageLayout>
    );
  }

  const status = data?.data;

  if (isError || !status) {
    return (
      <PageLayout>
        <p className="text-destructive">{t('dataMessages.detail.error')}</p>
      </PageLayout>
    );
  }

  const record = listData?.data.find((message) => message.id === id);
  const subject = record?.subject ?? id;
  const events = status.events ?? [];
  const hasError =
    status.state === MessageStatusResponseDtoState.FAILED &&
    Boolean(status.statusMessage);

  return (
    <PageLayout className="space-y-4">
      <PageHeader
        title={subject}
        description={t('dataMessages.title')}
        backButton
        actions={<DataMessageStatusBadge state={status.state} />}
      />

      {hasError && (
        <Alert variant="destructive">
          <AlertTitle>{t('dataMessages.detail.errorTitle')}</AlertTitle>
          <AlertDescription>{String(status.statusMessage)}</AlertDescription>
        </Alert>
      )}

      <FormCard title={t('dataMessages.detail.infoSection')}>
        <div className="space-y-1">
          <InfoRow
            label={t('dataMessages.detail.messageId')}
            value={fmtText(status.messageId)}
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
            value={<DataMessageStatusBadge state={status.state} />}
          />
          <InfoRow
            label={t('dataMessages.detail.statusCode')}
            value={fmtText(status.statusCode)}
          />
          <InfoRow
            label={t('dataMessages.detail.statusMessage')}
            value={fmtText(status.statusMessage)}
          />
          <InfoRow
            label={t('dataMessages.detail.sentAt')}
            value={fmtDate(status.sentAt)}
          />
          <InfoRow
            label={t('dataMessages.detail.deliveredAt')}
            value={fmtDate(status.deliveredAt)}
          />
          <InfoRow
            label={t('dataMessages.detail.readAt')}
            value={fmtDate(status.readAt)}
          />
          <InfoRow
            label={t('dataMessages.detail.rawStateCode')}
            value={fmtText(status.rawStateCode)}
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
                  {fmtDate(event.time)}
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
