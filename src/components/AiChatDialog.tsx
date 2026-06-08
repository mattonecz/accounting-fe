// AI chat is temporarily disabled: the backend `/ai-chat` endpoint was removed
// from the API spec, so the generated client (`@/api/ai-chat/ai-chat` and
// `ChatResponseDto`) no longer exists. This stub keeps the build green.
// To restore: re-enable the endpoint on the backend, run `npx orval`, then
// uncomment the original implementation below.
export const AiChatDialog = () => null;

/* --- ORIGINAL IMPLEMENTATION (disabled until AI chat is re-enabled) ---
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  FileText,
  ImageUp,
  MessageSquare,
  SendHorizonal,
} from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { useAiChatChat } from '@/api/ai-chat/ai-chat';
import { useDocumentParseReceipt } from '@/api/documents/documents';
import type {
  ChatResponseDto,
  ReceiptParseDataDto,
} from '@/api/model';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { formatDate, formatMoney } from '@/lib/formatters';

const getLastAssistantIndex = (history: ChatResponseDto['history']) =>
  history.reduce<number>((foundIndex, item, index) => {
    if (item.role === 'assistant') return index;
    return foundIndex;
  }, -1);

const formatUsd = (value: number) => `$${value.toFixed(6)}`;

type TextClientMessage = {
  kind: 'text';
  role: 'user' | 'assistant';
  content: string;
};

type ReceiptClientMessage = {
  kind: 'receipt';
  role: 'assistant';
  data: ReceiptParseDataDto;
};

type ClientChatMessage = TextClientMessage | ReceiptClientMessage;

interface ReceiptResultCardProps {
  data: ReceiptParseDataDto;
  onCreate: (data: ReceiptParseDataDto) => void;
}

const ReceiptResultCard = ({ data, onCreate }: ReceiptResultCardProps) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const currency = data.currency ?? 'CZK';
  const fmtMoney = (value: number) => formatMoney(value, currency, lang);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-foreground">
          {data.vendor || t('aiChat.receiptResult.unknownVendor')}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          {data.documentNumber ? (
            <span className="font-mono">{data.documentNumber}</span>
          ) : null}
          {data.date ? <span>{formatDate(data.date, lang)}</span> : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-lg border bg-background/60 p-3 text-xs">
        <div>
          <span className="block font-medium text-muted-foreground">
            {t('aiChat.receiptResult.total')}
          </span>
          <span className="text-sm font-semibold text-foreground tabular-nums">
            {data.total != null ? fmtMoney(data.total) : '-'}
          </span>
        </div>
        <div>
          <span className="block font-medium text-muted-foreground">
            {t('aiChat.receiptResult.vat')}
          </span>
          <span className="text-sm font-semibold text-foreground tabular-nums">
            {data.vat != null ? fmtMoney(data.vat) : '-'}
          </span>
        </div>
      </div>

      {data.vatBreakdown && data.vatBreakdown.length > 0 ? (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium">
                  {t('aiChat.receiptResult.rate')}
                </th>
                <th className="px-2 py-1.5 text-right font-medium">
                  {t('aiChat.receiptResult.base')}
                </th>
                <th className="px-2 py-1.5 text-right font-medium">
                  {t('aiChat.receiptResult.vatAmount')}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.vatBreakdown.map((row, index) => (
                <tr key={`${row.rate}-${index}`} className="border-t">
                  <td className="px-2 py-1.5 font-medium">{row.rate}%</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {row.base != null ? fmtMoney(row.base) : '-'}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {row.amount != null ? fmtMoney(row.amount) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <Button
        type="button"
        size="sm"
        className="w-full gap-2"
        onClick={() => onCreate(data)}
      >
        <FileText className="h-4 w-4" />
        {t('aiChat.receiptResult.createSimpleInvoice')}
      </Button>
    </div>
  );
};

export const AiChatDialog = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [chat, setChat] = useState<ChatResponseDto | null>(null);
  const [clientMessages, setClientMessages] = useState<ClientChatMessage[]>([]);
  const [pendingUserMessage, setPendingUserMessage] = useState('');
  const { enqueueSnackbar } = useSnackbar();
  const { mutateAsync: sendMessage, isPending } = useAiChatChat();
  const { mutateAsync: parseReceipt, isPending: isParsingReceipt } =
    useDocumentParseReceipt();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const history = chat?.history ?? [];
  const lastAssistantIndex = getLastAssistantIndex(history);

  const allMessages = [
    ...history.map((message, index) => ({
      kind: 'text' as const,
      role: message.role,
      content: message.content,
      source: 'server' as const,
      serverIndex: index,
    })),
    ...clientMessages.map((message, index) => ({
      ...message,
      source: 'client' as const,
      clientIndex: index,
    })),
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages, pendingUserMessage, open, isPending, isParsingReceipt]);

  const handleSubmit = async () => {
    const userInput = input.trim();
    if (!userInput || isPending) return;

    setPendingUserMessage(userInput);
    setInput('');

    try {
      const response = await sendMessage({ data: { userInput } });
      setChat(response.data);
      setPendingUserMessage('');
    } catch {
      setPendingUserMessage('');
      setInput(userInput);
      enqueueSnackbar(t('aiChat.messages.chatFailed'), { variant: 'error' });
    }
  };

  const handleReceiptSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || isParsingReceipt) return;

    setClientMessages((msgs) => [
      ...msgs,
      {
        kind: 'text',
        role: 'user',
        content: t('aiChat.uploading', { name: file.name }),
      },
    ]);

    try {
      const response = await parseReceipt({ data: { file } });
      setClientMessages((msgs) => [
        ...msgs,
        { kind: 'receipt', role: 'assistant', data: response.data.data },
      ]);
      enqueueSnackbar(t('aiChat.messages.receiptSuccess'), {
        variant: 'success',
      });
    } catch {
      enqueueSnackbar(t('aiChat.messages.receiptFailed'), { variant: 'error' });
      setClientMessages((msgs) => [
        ...msgs,
        {
          kind: 'text',
          role: 'assistant',
          content: t('aiChat.receiptFailedMessage'),
        },
      ]);
    } finally {
      event.target.value = '';
    }
  };

  const handleCreateFromReceipt = (data: ReceiptParseDataDto) => {
    setOpen(false);
    navigate('/invoices/simple/create', { state: { receipt: data } });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg"
        >
          <MessageSquare className="h-5 w-5" />
          <span className="sr-only">{t('aiChat.openLabel')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[min(80vh,720px)] max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {t('aiChat.title')}
          </DialogTitle>
          <DialogDescription>{t('aiChat.description')}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 bg-muted/20 px-6 py-4">
          <div className="flex min-h-full flex-col gap-4">
            {allMessages.length === 0 && !pendingUserMessage ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="max-w-sm rounded-xl border border-dashed bg-background/80 px-5 py-6 text-center text-sm text-muted-foreground">
                  {t('aiChat.emptyState')}
                </div>
              </div>
            ) : (
              allMessages.map((message) => (
                <div
                  key={
                    message.source === 'server'
                      ? `${message.role}-${message.serverIndex}`
                      : `${message.role}-client-${message.clientIndex}`
                  }
                  className={cn(
                    'flex',
                    message.role === 'user' ? 'justify-end' : 'justify-start',
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'border bg-background text-foreground',
                    )}
                  >
                    {message.kind === 'receipt' ? (
                      <ReceiptResultCard
                        data={message.data}
                        onCreate={handleCreateFromReceipt}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                    {message.source === 'server' &&
                    message.role === 'assistant' &&
                    message.serverIndex === lastAssistantIndex &&
                    chat ? (
                      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground sm:grid-cols-3">
                        <div>
                          <span className="block font-medium text-foreground">
                            Model
                          </span>
                          {chat.metrics.model}
                        </div>
                        <div>
                          <span className="block font-medium text-foreground">
                            {t('aiChat.metrics.duration')}
                          </span>
                          {chat.metrics.durationMs} ms
                        </div>
                        <div>
                          <span className="block font-medium text-foreground">
                            {t('aiChat.metrics.promptTokens')}
                          </span>
                          {chat.metrics.tokens.promptTokens}
                        </div>
                        <div>
                          <span className="block font-medium text-foreground">
                            {t('aiChat.metrics.completionTokens')}
                          </span>
                          {chat.metrics.tokens.completionTokens}
                        </div>
                        <div>
                          <span className="block font-medium text-foreground">
                            {t('aiChat.metrics.totalTokens')}
                          </span>
                          {chat.metrics.tokens.totalTokens}
                        </div>
                        <div>
                          <span className="block font-medium text-foreground">
                            {t('aiChat.metrics.cost')}
                          </span>
                          {formatUsd(chat.metrics.estimatedCostUsd)}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            )}

            {pendingUserMessage ? (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground shadow-sm">
                  <p>{pendingUserMessage}</p>
                </div>
              </div>
            ) : null}

            {isPending ? (
              <div className="flex justify-start">
                <div className="rounded-2xl border bg-background px-4 py-3 text-sm text-muted-foreground shadow-sm">
                  {t('aiChat.typing')}
                </div>
              </div>
            ) : null}

            {isParsingReceipt ? (
              <div className="flex justify-start">
                <div className="rounded-2xl border bg-background px-4 py-3 text-sm text-muted-foreground shadow-sm">
                  {t('aiChat.processing')}
                </div>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t bg-background p-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleReceiptSelect}
          />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmit();
            }}
          >
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void handleSubmit();
                }
              }}
              placeholder={t('aiChat.placeholder')}
              className="min-h-[96px] resize-none"
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">{t('aiChat.hint')}</p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={isParsingReceipt}
                  onClick={() => fileInputRef.current?.click()}
                  aria-label={t('aiChat.uploadReceipt')}
                  title={t('aiChat.uploadReceipt')}
                >
                  <ImageUp className="h-4 w-4" />
                </Button>
                <Button
                  type="submit"
                  className="gap-2"
                  disabled={isPending || !input.trim()}
                >
                  <SendHorizonal className="h-4 w-4" />
                  {t('aiChat.send')}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
--- END ORIGINAL IMPLEMENTATION --- */
