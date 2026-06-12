// Mock data for dashboard sections the backend does not provide yet
// (cash position, cash-flow history, action queue). Replace with real
// API data once the corresponding endpoints exist.

export const MOCK_CURRENCY = 'CZK';

export const MOCK_CASH = {
  available: 384200,
  trendPct: 12.4,
  inAccounts: 312400,
  expected30d: 119620,
  obligations: 47820,
};

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

export interface MockOverdueInvoice {
  num: string;
  client: string;
  amount: number;
  days: number;
}

export interface MockDraft {
  client: string;
  amount: number;
  items: number;
}

export interface MockTaxDeadline {
  kindKey: 'vatQ2';
  days: number;
  amount: number;
}

export const MOCK_OVERDUE: MockOverdueInvoice[] = [
  { num: '2026-0040', client: 'Bílek Design', amount: 22000, days: 12 },
  { num: '2026-0036', client: 'Bílek Design', amount: 18000, days: 24 },
];

export const MOCK_DRAFTS: MockDraft[] = [
  { client: 'Acme Studio s.r.o.', amount: 48500, items: 3 },
];

export const MOCK_TAXES: MockTaxDeadline[] = [
  { kindKey: 'vatQ2', days: 43, amount: 47820 },
];
