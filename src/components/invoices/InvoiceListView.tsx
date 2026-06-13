import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData } from '@tanstack/react-query';
import {
  Plus,
  Pencil,
  MoreHorizontal,
  Eye,
  Download,
  Landmark,
  Search,
  Send,
  Inbox,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageLayout } from '@/components/PageLayout';
import { InvoiceStatusDot } from '@/components/InvoiceStatusDot';
import { RecordPaymentDialog } from '@/components/RecordPaymentDialog';
import { InvoicePdfRenderer } from '@/components/InvoicePdfRenderer';
import { useInvoiceListByCompany } from '@/api/invoices/invoices';
import type { InvoiceResponseDto } from '@/api/model';
import {
  InvoiceListByCompanyType,
  InvoiceListByCompanyStatus,
  InvoiceListByCompanySortBy,
  InvoiceListByCompanySortOrder,
} from '@/api/model';
import { getInvoiceDisplayStatus } from '@/lib/invoiceStatus';
import { formatDate, formatMoney } from '@/lib/formatters';
import { cn } from '@/lib/utils';

type Variant = 'issued' | 'received';
type Tab = 'all' | 'pending' | 'overdue' | 'paid';

const PAGE_SIZE = 15;
const SEARCH_DEBOUNCE_MS = 350;

const TAB_STATUS: Record<Exclude<Tab, 'all'>, InvoiceListByCompanyStatus> = {
  pending: InvoiceListByCompanyStatus.ISSUED,
  overdue: InvoiceListByCompanyStatus.OVERDUE,
  paid: InvoiceListByCompanyStatus.PAID,
};

const TABS: Tab[] = ['all', 'pending', 'overdue', 'paid'];

const variantConfig = {
  issued: {
    type: InvoiceListByCompanyType.ISSUED,
    annotationKey: 'invoices.list.annotationIssued',
    titleKey: 'nav.invoicesIssued',
    descriptionKey: 'invoices.list.descriptionIssued',
    contactColumnKey: 'invoices.list.columns.contact',
    createPath: '/invoices/create',
    emptyKey: 'invoices.list.emptyIssued',
    EmptyIcon: Send,
  },
  received: {
    type: InvoiceListByCompanyType.RECEIVED,
    annotationKey: 'invoices.list.annotationReceived',
    titleKey: 'nav.invoicesReceived',
    descriptionKey: 'invoices.list.descriptionReceived',
    contactColumnKey: 'invoices.list.columns.supplier',
    createPath: '/invoices/create?type=received',
    emptyKey: 'invoices.list.emptyReceived',
    EmptyIcon: Inbox,
  },
} as const;

const FilterTab = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'rounded-md border px-2.5 py-1 text-xs transition-colors',
      active
        ? 'border-border bg-muted font-semibold text-foreground'
        : 'border-transparent text-muted-foreground hover:text-foreground',
    )}
  >
    {label}
  </button>
);

interface InvoiceListViewProps {
  variant: Variant;
}

export function InvoiceListView({ variant }: InvoiceListViewProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const config = variantConfig[variant];
  const lang = i18n.language;

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [sortBy, setSortBy] = useState<InvoiceListByCompanySortBy>(
    InvoiceListByCompanySortBy.createdDate,
  );
  const [sortOrder, setSortOrder] = useState<InvoiceListByCompanySortOrder>(
    InvoiceListByCompanySortOrder.DESC,
  );
  const [page, setPage] = useState(1);
  const [paymentInvoice, setPaymentInvoice] = useState<InvoiceResponseDto | null>(null);
  const [pdfInvoiceId, setPdfInvoiceId] = useState<string | null>(null);

  // Debounce the search box, resetting to the first page on each new term.
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [searchInput]);

  const { data, isLoading, isError, isFetching } = useInvoiceListByCompany(
    {
      type: config.type,
      status: activeTab === 'all' ? undefined : TAB_STATUS[activeTab],
      search: search || undefined,
      sortBy,
      sortOrder,
      page,
      pageSize: PAGE_SIZE,
    },
    { query: { placeholderData: keepPreviousData } },
  );

  const result = data?.data;
  const rows = result?.data ?? [];
  const total = result?.total ?? 0;
  const totalPages = result?.totalPages ?? 0;
  const hasFilters = activeTab !== 'all' || search.length > 0;

  const handleTab = (tab: Tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleSort = (column: InvoiceListByCompanySortBy) => {
    setPage(1);
    if (sortBy === column) {
      setSortOrder((order) =>
        order === InvoiceListByCompanySortOrder.ASC
          ? InvoiceListByCompanySortOrder.DESC
          : InvoiceListByCompanySortOrder.ASC,
      );
    } else {
      setSortBy(column);
      setSortOrder(InvoiceListByCompanySortOrder.ASC);
    }
  };

  const sortHead = (
    label: string,
    column: InvoiceListByCompanySortBy,
    align: 'left' | 'right' = 'left',
  ) => {
    const active = sortBy === column;
    const Icon = !active
      ? ChevronsUpDown
      : sortOrder === InvoiceListByCompanySortOrder.ASC
        ? ChevronUp
        : ChevronDown;
    return (
      <TableHead className={cn('h-10', align === 'right' && 'text-right')}>
        <button
          type="button"
          onClick={() => handleSort(column)}
          className={cn(
            'inline-flex items-center gap-1 transition-colors hover:text-foreground',
            align === 'right' && 'w-full justify-end',
            active && 'text-foreground',
          )}
        >
          {label}
          <Icon className={cn('h-3 w-3', active ? 'opacity-100' : 'opacity-40')} />
        </button>
      </TableHead>
    );
  };

  const renderTable = () => {
    if (isError) {
      return (
        <div className="px-6 py-16 text-center text-sm text-destructive">
          {t('invoices.list.error')}
        </div>
      );
    }
    if (isLoading) {
      return (
        <div className="px-6 py-16 text-center text-sm text-muted-foreground">
          {t('invoices.list.loading')}
        </div>
      );
    }
    if (rows.length === 0) {
      if (hasFilters) {
        return (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">
            {t('invoices.list.noMatches')}
          </div>
        );
      }
      const { EmptyIcon } = config;
      return (
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <EmptyIcon className="h-5 w-5" />
          </span>
          <div className="text-sm font-semibold text-foreground">{t(config.emptyKey)}</div>
          <Button className="mt-1 gap-2" onClick={() => navigate(config.createPath)}>
            <Plus className="h-4 w-4" />
            {t('invoices.actions.create')}
          </Button>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            {sortHead(t('invoices.list.columns.number'), InvoiceListByCompanySortBy.number)}
            <TableHead className="h-10 w-[30%]">{t(config.contactColumnKey)}</TableHead>
            {sortHead(
              t('invoices.list.columns.amount'),
              InvoiceListByCompanySortBy.totalWithTax,
              'right',
            )}
            {sortHead(t('invoices.list.columns.status'), InvoiceListByCompanySortBy.status)}
            {sortHead(
              t('invoices.list.columns.createdDate'),
              InvoiceListByCompanySortBy.createdDate,
            )}
            <TableHead className="h-10 text-right">{t('invoices.list.columns.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((invoice) => (
            <TableRow
              key={invoice.id}
              className="cursor-pointer"
              onClick={() => navigate(`/invoices/${invoice.id}`)}
            >
              <TableCell className="py-3 font-mono text-sm font-semibold">
                {invoice.number || '-'}
              </TableCell>
              <TableCell className="py-3 text-sm">
                {invoice.contactSnapshot?.name || '-'}
              </TableCell>
              <TableCell className="py-3 text-right font-mono text-sm font-semibold tabular-nums">
                {formatMoney(invoice.totalWithTax, invoice.currency || 'CZK', lang)}
              </TableCell>
              <TableCell className="py-3">
                <InvoiceStatusDot status={getInvoiceDisplayStatus(invoice)} />
              </TableCell>
              <TableCell className="py-3 font-mono text-xs text-muted-foreground">
                {formatDate(invoice.createdDate, lang)}
              </TableCell>
              <TableCell className="py-2 text-right">
                <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
                    aria-label={t('invoices.actions.editAriaLabel', { number: invoice.number })}
                    title={t('invoices.actions.edit')}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        aria-label={t('invoices.actions.moreAriaLabel', { number: invoice.number })}
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setPaymentInvoice(invoice)}>
                        <Landmark className="mr-2 h-4 w-4" />
                        {t('payments.actions.record')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        {t('invoices.actions.detail')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPdfInvoiceId(invoice.id)}>
                        <Download className="mr-2 h-4 w-4" />
                        {t('invoices.actions.downloadPdf')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <PageLayout>
      {/* Quiet header */}
      <header className="border-b border-border pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t(config.annotationKey)}
            </div>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">
              {t(config.titleKey)}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{t(config.descriptionKey)}</p>
          </div>
          <Button className="gap-2 sm:shrink-0" onClick={() => navigate(config.createPath)}>
            <Plus className="h-4 w-4" />
            {t('invoices.actions.create')}
          </Button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('invoices.list.searchPlaceholder')}
            className="h-9 pl-9 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 sm:ml-auto">
          {TABS.map((tab) => (
            <FilterTab
              key={tab}
              label={t(`invoices.list.tabs.${tab}`)}
              active={activeTab === tab}
              onClick={() => handleTab(tab)}
            />
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden p-0">{renderTable()}</Card>

      {!isLoading && !isError && rows.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-muted-foreground">
            {t('invoices.list.showing', { count: rows.length, total })}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {t('common.pagination.pageOf', { page: result?.page ?? page, totalPages })}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t('common.pagination.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={page >= totalPages || isFetching}
                  onClick={() => setPage((current) => current + 1)}
                >
                  {t('common.pagination.next')}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {paymentInvoice && (
        <RecordPaymentDialog
          invoice={paymentInvoice}
          open
          onOpenChange={(open) => {
            if (!open) setPaymentInvoice(null);
          }}
          hideTrigger
        />
      )}

      {pdfInvoiceId && (
        <InvoicePdfRenderer invoiceId={pdfInvoiceId} onDone={() => setPdfInvoiceId(null)} />
      )}
    </PageLayout>
  );
}
