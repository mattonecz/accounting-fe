import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';

import type { ReceiptLlmCallDto } from '@/api/model';
import { Card } from '@/components/ui/card';

const formatUsd = (value: number) => `$${value.toFixed(5)}`;

interface ParsedDocumentStatsProps {
  llmCalls: ReceiptLlmCallDto[];
}

/**
 * Token usage of the AI extraction behind a prefilled form, summed over the
 * attempts (a failed arithmetic check triggers one retry). A development aid
 * for judging what a document costs to read.
 */
export const ParsedDocumentStats = ({ llmCalls }: ParsedDocumentStatsProps) => {
  const { t } = useTranslation();
  if (llmCalls.length === 0) return null;

  const sum = (pick: (call: ReceiptLlmCallDto) => number) =>
    llmCalls.reduce((acc, call) => acc + (pick(call) || 0), 0);
  const validationErrors = llmCalls.at(-1)?.validationErrors ?? [];

  const stats = [
    { label: t('aiParse.stats.model'), value: llmCalls[0].model },
    { label: t('aiParse.stats.attempts'), value: llmCalls.length },
    {
      label: t('aiParse.stats.duration'),
      value: `${sum((c) => c.durationMs)} ms`,
    },
    {
      label: t('aiParse.stats.inputTokens'),
      value: sum((c) => c.inputTokens),
    },
    {
      label: t('aiParse.stats.outputTokens'),
      value: sum((c) => c.outputTokens),
    },
    {
      label: t('aiParse.stats.totalTokens'),
      value: sum((c) => c.totalTokens),
    },
    {
      label: t('aiParse.stats.cost'),
      value: formatUsd(sum((c) => c.estimatedCostUsd)),
    },
  ];

  return (
    <Card className="border-dashed border-border/80 bg-muted/30 p-4 shadow-none">
      <div className="mb-3 flex items-center gap-2 text-xs font-medium text-foreground">
        <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
        {t('aiParse.stats.title')}
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4 lg:grid-cols-7">
        {stats.map(({ label, value }) => (
          <div key={label} className="min-w-0">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="truncate font-medium tabular-nums text-foreground">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {validationErrors.length > 0 && (
        <p className="mt-3 text-[11px] text-warning">
          {t('aiParse.stats.validationErrors', {
            errors: validationErrors.join('; '),
          })}
        </p>
      )}
    </Card>
  );
};
