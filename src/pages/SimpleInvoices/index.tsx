import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData } from '@tanstack/react-query';
import {
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Download,
  Search,
  Receipt,
  Trash2,
  Lock,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PageLayout } from '@/components/PageLayout';
import { UploadReceiptButton } from '@/components/UploadReceiptButton';
import { InvoicePdfRenderer } from '@/components/InvoicePdfRenderer';
import {
  DeleteInvoiceDialog,
  type DeletableInvoice,
} from '@/components/invoices/DeleteInvoiceDialog';
import { useInvoiceListByCompany } from '@/api/invoices/invoices';
import {
  InvoiceListByCompanyKind,
  InvoiceListByCompanySortBy,
  InvoiceListByCompanySortOrder,
} from '@/api/model';
import { formatDate, formatMoney } from '@/lib/formatters';
import { isInvoiceLocked } from '@/lib/invoiceLock';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 15;
const SEARCH_DEBOUNCE_MS = 350;
const CREATE_PATH = '/invoices/simple/create';

const SimpleInvoices = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language;

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<InvoiceListByCompanySortBy>(
    InvoiceListByCompanySortBy.createdDate,
  );
  const [sortOrder, setSortOrder] = useState<InvoiceListByCompanySortOrder>(
    InvoiceListByCompanySortOrder.DESC,
  );
  const [page, setPage] = useState(1);
  const [pdfInvoiceId, setPdfInvoiceId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeletableInvoice | null>(
    null,
  );

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
      kind: InvoiceListByCompanyKind.SIMPLE,
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
  const hasFilters = search.length > 0;

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
          <Icon
            className={cn('h-3 w-3', active ? 'opacity-100' : 'opacity-40')}
          />
        </button>
      </TableHead>
    );
  };

  const renderTable = () => {
    if (isError) {
      return (
        <div className="px-6 py-16 text-center text-sm text-destructive">
          {t('simpleInvoices.error')}
        </div>
      );
    }
    if (isLoading) {
      return (
        <div className="px-6 py-16 text-center text-sm text-muted-foreground">
          {t('simpleInvoices.loading')}
        </div>
      );
    }
    if (rows.length === 0) {
      if (hasFilters) {
        return (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">
            {t('simpleInvoices.noMatches')}
          </div>
        );
      }
      return (
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Receipt className="h-5 w-5" />
          </span>
          <div className="text-sm font-semibold text-foreground">
            {t('simpleInvoices.empty')}
          </div>
          <Button className="mt-1 gap-2" onClick={() => navigate(CREATE_PATH)}>
            <Plus className="h-4 w-4" />
            {t('simpleInvoices.actions.create')}
          </Button>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            {sortHead(
              t('simpleInvoices.columns.number'),
              InvoiceListByCompanySortBy.number,
            )}
            <TableHead className="h-10 w-[24%]">
              {t('simpleInvoices.columns.company')}
            </TableHead>
            {sortHead(
              t('simpleInvoices.columns.createdDate'),
              InvoiceListByCompanySortBy.createdDate,
            )}
            {sortHead(
              t('simpleInvoices.columns.duzpDate'),
              InvoiceListByCompanySortBy.duzpDate,
            )}
            {sortHead(
              t('simpleInvoices.columns.totalWithVat'),
              InvoiceListByCompanySortBy.totalWithTax,
              'right',
            )}
            <TableHead className="h-10 text-right">
              {t('invoices.list.columns.actions')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((invoice) => {
            const locked = isInvoiceLocked(invoice);
            return (
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
                <TableCell className="py-3 font-mono text-xs text-muted-foreground">
                  {formatDate(invoice.createdDate, lang)}
                </TableCell>
                <TableCell className="py-3 font-mono text-xs text-muted-foreground">
                  {formatDate(invoice.duzpDate, lang)}
                </TableCell>
                <TableCell className="py-3 text-right font-mono text-sm font-semibold tabular-nums">
                  {formatMoney(
                    invoice.totalWithTax,
                    invoice.currency || 'CZK',
                    lang,
                  )}
                </TableCell>
                <TableCell className="py-2 text-right">
                  <div
                    className="flex items-center justify-end gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {locked && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex h-7 w-7 items-center justify-center text-muted-foreground">
                            <Lock className="h-3.5 w-3.5" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t('simpleInvoices.locked.badge')}
                        </TooltipContent>
                      </Tooltip>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      disabled={locked}
                      onClick={() =>
                        navigate(`/invoices/simple/${invoice.id}/edit`)
                      }
                      aria-label={t('invoices.actions.edit')}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          aria-label={t('invoices.actions.moreAriaLabel', {
                            number: invoice.number,
                          })}
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => navigate(`/invoices/${invoice.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          {t('invoices.actions.detail')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setPdfInvoiceId(invoice.id)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          {t('invoices.actions.downloadPdf')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={locked}
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(invoice)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('simpleInvoices.actions.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
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
              {t('nav.simpleInvoices')}
            </div>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">
              {t('simpleInvoices.title')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('simpleInvoices.description')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:shrink-0">
            <UploadReceiptButton />
            <Button className="gap-2" onClick={() => navigate(CREATE_PATH)}>
              <Plus className="h-4 w-4" />
              {t('simpleInvoices.actions.create')}
            </Button>
          </div>
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
                {t('common.pagination.pageOf', {
                  page: result?.page ?? page,
                  totalPages,
                })}
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

      {pdfInvoiceId && (
        <InvoicePdfRenderer
          invoiceId={pdfInvoiceId}
          onDone={() => setPdfInvoiceId(null)}
        />
      )}

      <DeleteInvoiceDialog
        invoice={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </PageLayout>
  );
};

export default SimpleInvoices;
