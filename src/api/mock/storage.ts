import type { Account, Category, Operation } from '../types';
import { accounts as initialAccounts, categories as initialCategories, transactions as initialTransactions } from '../../lib/mockData';

const MOCK_ACCOUNTS_KEY = 'finflow_mock_accounts_v2';
const MOCK_CATEGORIES_KEY = 'finflow_mock_categories_v2';
const MOCK_OPERATIONS_KEY = 'finflow_mock_operations_v2';

export function getMockAccounts(): Account[] {
  try {
    const data = localStorage.getItem(MOCK_ACCOUNTS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }

  // Initial seed from mockData
  const seeded: Account[] = initialAccounts.map(a => ({
    id: a.id,
    name: a.name,
    type: a.type as Account['type'],
    currency: a.currency as Account['currency'],
    balance: String(a.balance),
    is_active: true,
  }));
  saveMockAccounts(seeded);
  return seeded;
}

export function saveMockAccounts(accounts: Account[]): void {
  localStorage.setItem(MOCK_ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function getMockCategories(): Category[] {
  try {
    const data = localStorage.getItem(MOCK_CATEGORIES_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }

  const seeded: Category[] = initialCategories.map(c => ({
    id: c.id,
    name: c.name,
    type: c.type as Category['type'],
  }));
  saveMockCategories(seeded);
  return seeded;
}

export function saveMockCategories(categories: Category[]): void {
  localStorage.setItem(MOCK_CATEGORIES_KEY, JSON.stringify(categories));
}

export function getMockOperations(): Operation[] {
  try {
    const data = localStorage.getItem(MOCK_OPERATIONS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }

  const seeded: Operation[] = initialTransactions.map(t => ({
    id: t.id,
    description: t.description,
    amount: String(Math.abs(t.amount)),
    type: t.amount < 0 ? 'expense' : 'income',
    date: t.date.split('T')[0],
    category_id: t.categoryId,
    account_id: t.accountId,
  }));
  saveMockOperations(seeded);
  return seeded;
}

export function saveMockOperations(operations: Operation[]): void {
  localStorage.setItem(MOCK_OPERATIONS_KEY, JSON.stringify(operations));
}

export const delay = (ms = 60) => new Promise((resolve) => setTimeout(resolve, ms));
