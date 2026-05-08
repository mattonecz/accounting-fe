import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InvoiceStatusBadge } from '@/components/InvoiceStatusBadge';
import { RecordPaymentDialog } from '@/components/RecordPaymentDialog';
import { Download, MoreHorizontal, Pencil, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { InvoiceResponseDto } from '@/api/model';
import { formatMoney } from './utils';

interface InvoiceHeroSectionProps {
  invoice: InvoiceResponseDto;
  currency: string;
  paidAmount: number;
  remainingAmount: number;
  onDownloadPdf: () => void;
}

export const InvoiceHeroSection = ({
  invoice,
  currency,
  paidAmount,
  remainingAmount,
  onDownloadPdf,
}: InvoiceHeroSectionProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const counterparty = invoice.contactSnapshot;

  return (
    <section className="space-y-6 rounded-[28px] border border-slate-200/80 bg-transparent px-5 py-4 md:px-7 md:py-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xl font-medium tracking-[0.08em] text-slate-500 md:text-2xl">
              # {invoice.number}
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
              {counterparty?.name || '-'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4 md:gap-5">
            <InvoiceStatusBadge
              status={invoice.status}
              className="min-h-10 rounded-full px-4 text-base [&_svg]:h-4 [&_svg]:w-4"
            />
            <span className="text-3xl font-semibold text-slate-900 md:text-4xl">
              {formatMoney(invoice.totalWithTax, currency)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <RecordPaymentDialog
            invoice={invoice}
            triggerSize="default"
            triggerClassName="border-0 bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
            aria-label={t('invoices.actions.edit')}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label={t('common.moreActions')}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                {t('invoices.actions.print')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDownloadPdf}>
                <Download className="mr-2 h-4 w-4" />
                {t('invoices.actions.downloadPdf')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-200 pt-4 text-base text-muted-foreground md:text-lg">
        <div>
          {t('invoices.detail.hero.total')}{' '}
          <span className="font-semibold text-slate-900">
            {formatMoney(invoice.totalWithTax, currency)}
          </span>
        </div>
        <div>
          {t('invoices.detail.hero.paid')}{' '}
          <span className="font-semibold text-slate-900">
            {formatMoney(paidAmount, currency)}
          </span>
        </div>
        <div>
          {t('invoices.detail.hero.remaining')}{' '}
          <span className="font-semibold text-slate-900">
            {formatMoney(remainingAmount, currency)}
          </span>
        </div>
      </div>
    </section>
  );
};
