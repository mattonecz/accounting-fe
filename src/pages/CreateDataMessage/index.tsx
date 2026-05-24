import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useDataMessagesSend } from '@/api/data-messages/data-messages';
import { PageLayout } from '@/components/PageLayout';
import { PageHeader } from '@/components/PageHeader';
import { FormCard } from '@/components/FormCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const CreateDataMessage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [recipientId, setRecipientId] = useState('');
  const [subject, setSubject] = useState('');
  const [filename, setFilename] = useState('podani.xml');
  const [xmlContent, setXmlContent] = useState('');

  const sendMessage = useDataMessagesSend();

  const isValid =
    recipientId.length === 7 &&
    subject.trim().length > 0 &&
    filename.trim().length > 0 &&
    xmlContent.trim().length > 0;

  const handleSubmit = () => {
    if (!isValid) return;
    sendMessage.mutate(
      {
        data: {
          recipientId,
          subject,
          attachments: [{ filename, content: xmlContent }],
        },
      },
      {
        onSuccess: () => {
          enqueueSnackbar(t('dataMessages.create.success'), { variant: 'success' });
          navigate('/data-messages');
        },
        onError: () => {
          enqueueSnackbar(t('dataMessages.create.error'), { variant: 'error' });
        },
      },
    );
  };

  return (
    <PageLayout className="space-y-4">
      <PageHeader
        title={t('dataMessages.create.title')}
        description={t('dataMessages.create.description')}
        backButton
      />

      <FormCard title={t('dataMessages.create.section')}>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="recipientId">
                {t('dataMessages.create.recipientId')}
              </label>
              <Input
                id="recipientId"
                value={recipientId}
                maxLength={7}
                placeholder="abc1234"
                onChange={(event) => setRecipientId(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="filename">
                {t('dataMessages.create.filename')}
              </label>
              <Input
                id="filename"
                value={filename}
                onChange={(event) => setFilename(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="subject">
              {t('dataMessages.create.subject')}
            </label>
            <Input
              id="subject"
              value={subject}
              maxLength={255}
              onChange={(event) => setSubject(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="xmlContent">
              {t('dataMessages.create.xmlContent')}
            </label>
            <Textarea
              id="xmlContent"
              className="min-h-[220px] font-mono"
              value={xmlContent}
              placeholder="<?xml version=&quot;1.0&quot;?>"
              onChange={(event) => setXmlContent(event.target.value)}
            />
          </div>
        </div>
      </FormCard>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={!isValid || sendMessage.isPending}>
          {sendMessage.isPending
            ? t('dataMessages.create.submitting')
            : t('dataMessages.create.submit')}
        </Button>
      </div>
    </PageLayout>
  );
};

export default CreateDataMessage;
