// Sample series for the cash-flow chart. The backend has no endpoint for a
// monthly income/expense history yet (`/vat/summary-by-month` returns the
// invoices of a single month), so the chart is rendered from this placeholder
// and is labelled as sample data in the UI. Replace it once such an endpoint
// exists; everything else on the dashboard already runs on real data.

export const MOCK_CURRENCY = 'CZK';

export const MOCK_CASHFLOW: { income: number; expenses: number }[] = [
  { income: 52000, expenses: 21000 },
  { income: 61000, expenses: 24500 },
  { income: 48000, expenses: 19800 },
  { income: 74000, expenses: 28000 },
  { income: 69500, expenses: 26300 },
  { income: 88000, expenses: 31000 },
  { income: 79000, expenses: 27400 },
  { income: 92500, expenses: 30200 },
  { income: 85000, expenses: 29600 },
  { income: 98000, expenses: 33500 },
  { income: 104200, expenses: 35800 },
  { income: 99000, expenses: 34100 },
];
