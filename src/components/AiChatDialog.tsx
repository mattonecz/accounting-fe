import { useEffect, useRef, useState } from 'react';
import { Bot, MessageSquare, SendHorizonal } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useAiChatChat } from '@/api/ai-chat/ai-chat';
import type { ChatResponseDto } from '@/api/model';
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

const getLastAssistantIndex = (history: ChatResponseDto['history']) =>
  history.reduce<number>((foundIndex, item, index) => {
    if (item.role === 'assistant') {
      return index;
    }
    return foundIndex;
  }, -1);

const formatUsd = (value: number) => `$${value.toFixed(6)}`;

export const AiChatDialog = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [chat, setChat] = useState<ChatResponseDto | null>(null);
  const [pendingUserMessage, setPendingUserMessage] = useState('');
  const { enqueueSnackbar } = useSnackbar();
  const { mutateAsync: sendMessage, isPending } = useAiChatChat();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const history = chat?.history ?? [];
  const lastAssistantIndex = getLastAssistantIndex(history);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, pendingUserMessage, open, isPending]);

  const handleSubmit = async () => {
    const userInput = input.trim();
    if (!userInput || isPending) {
      return;
    }

    setPendingUserMessage(userInput);
    setInput('');

    try {
      const response = await sendMessage({
        data: {
          userInput,
        },
      });

      setChat(response.data);
      setPendingUserMessage('');
    } catch {
      setPendingUserMessage('');
      setInput(userInput);
      enqueueSnackbar('AI chat request failed', { variant: 'error' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg"
        >
          <MessageSquare className="h-5 w-5" />
          <span className="sr-only">Open AI chat</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[min(80vh,720px)] max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Assistant
          </DialogTitle>
          <DialogDescription>
            Ask a question and continue the conversation in this session.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 bg-muted/20 px-6 py-4">
          <div className="flex min-h-full flex-col gap-4">
            {history.length === 0 && !pendingUserMessage ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="max-w-sm rounded-xl border border-dashed bg-background/80 px-5 py-6 text-center text-sm text-muted-foreground">
                  Start with a short question about invoices, contacts, or accounting.
                </div>
              </div>
            ) : (
              history.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
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
                    <p>{message.content}</p>
                    {message.role === 'assistant' && index === lastAssistantIndex && chat ? (
                      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground sm:grid-cols-3">
                        <div>
                          <span className="block font-medium text-foreground">Model</span>
                          {chat.metrics.model}
                        </div>
                        <div>
                          <span className="block font-medium text-foreground">Duration</span>
                          {chat.metrics.durationMs} ms
                        </div>
                        <div>
                          <span className="block font-medium text-foreground">Prompt tokens</span>
                          {chat.metrics.tokens.promptTokens}
                        </div>
                        <div>
                          <span className="block font-medium text-foreground">Completion tokens</span>
                          {chat.metrics.tokens.completionTokens}
                        </div>
                        <div>
                          <span className="block font-medium text-foreground">Total tokens</span>
                          {chat.metrics.tokens.totalTokens}
                        </div>
                        <div>
                          <span className="block font-medium text-foreground">Cost</span>
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
                  AI is typing...
                </div>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t bg-background p-4">
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
              placeholder="Type your message here"
              className="min-h-[96px] resize-none"
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Press Enter to send, Shift+Enter for a new line.
              </p>
              <Button type="submit" className="gap-2" disabled={isPending || !input.trim()}>
                <SendHorizonal className="h-4 w-4" />
                Send
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};