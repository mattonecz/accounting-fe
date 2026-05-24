import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useDataMessagesList } from '@/api/data-messages/data-messages';
import type { DataMessageDto } from '@/api/model';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { DataTableCard } from '@/components/DataTableCard';
import { DataMessageStatusBadge } from '@/components/DataMessageStatusBadge';
import { formatDate } from '@/lib/formatters';

const DataMessages = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useDataMessagesList();

  const fmtDate = (value: unknown) =>
    value ? formatDate(value as string, i18n.language) : '–';

  const columns = [
    {
      header: t('dataMessages.list.columns.direction'),
      cell: (message: DataMessageDto) =>
        t(`dataMessages.directions.${message.direction}`, message.direction),
    },
    {
      header: t('dataMessages.list.columns.recipient'),
      cell: (message: DataMessageDto) => message.recipient,
      cellClassName: 'font-medium',
    },
    {
      header: t('dataMessages.list.columns.subject'),
      cell: (message: DataMessageDto) => message.subject,
    },
    {
      header: t('dataMessages.list.columns.state'),
      cell: (message: DataMessageDto) => (
        <DataMessageStatusBadge state={message.state} />
      ),
    },
    {
      header: t('dataMessages.list.columns.sentAt'),
      cell: (message: DataMessageDto) => fmtDate(message.sentAt),
      cellClassName: 'text-muted-foreground',
    },
    {
      header: t('dataMessages.list.columns.deliveredAt'),
      cell: (message: DataMessageDto) => fmtDate(message.deliveredAt),
      cellClassName: 'text-muted-foreground',
    },
  ];

  return (
    <PageLayout>
      <PageHeader
        title={t('dataMessages.title')}
        description={t('dataMessages.description')}
        actions={
          <Button
            className="gap-2"
            onClick={() => navigate('/data-messages/create')}
          >
            <Plus className="h-4 w-4" />
            {t('dataMessages.actions.create')}
          </Button>
        }
      />

      <DataTableCard
        title={t('dataMessages.list.card')}
        columns={columns}
        data={data?.data}
        isLoading={isLoading}
        isError={isError}
        emptyMessage={t('dataMessages.list.empty')}
        onRowClick={(message) => navigate(`/data-messages/${message.id}`)}
      />
    </PageLayout>
  );
};

export default DataMessages;
