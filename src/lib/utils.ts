import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Currency, AccountType, Account } from "../api/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  BYN: 'Br',
  KZT: '₸',
  CNY: '¥',
};

export const CURRENCY_LABELS: Record<Currency, string> = {
  RUB: 'Российский рубль (₽)',
  USD: 'Доллар США ($)',
  EUR: 'Евро (€)',
  BYN: 'Белорусский рубль (Br)',
  KZT: 'Казахстанский тенге (₸)',
  CNY: 'Китайский юань (¥)',
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  card: 'Банковская карта',
  bank: 'Банковский счет',
  cash: 'Наличные',
  deposit: 'Вклад / Депозит',
};

export function formatCurrency(amount: number | string, currency: Currency = 'RUB'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  return `${num.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export const ACCOUNTS_ORDER_KEY = 'finflow_accounts_order_v1';

export function getSavedAccountsOrder(): string[] {
  try {
    const saved = localStorage.getItem(ACCOUNTS_ORDER_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function sortAccountsByOrder(accounts: Account[]): Account[] {
  const order = getSavedAccountsOrder();
  if (order.length === 0) return accounts;
  const orderMap = new Map(order.map((id, index) => [id, index]));
  return [...accounts].sort((a, b) => {
    const indexA = orderMap.has(a.id) ? orderMap.get(a.id)! : 9999;
    const indexB = orderMap.has(b.id) ? orderMap.get(b.id)! : 9999;
    return indexA - indexB;
  });
}

export function saveAccountsOrder(accountIds: string[]): void {
  try {
    localStorage.setItem(ACCOUNTS_ORDER_KEY, JSON.stringify(accountIds));
  } catch (e) {
    console.error('Failed to save accounts order:', e);
  }
}

export function resetAccountsOrder(): void {
  try {
    localStorage.removeItem(ACCOUNTS_ORDER_KEY);
  } catch (e) {
    console.error('Failed to reset accounts order:', e);
  }
}
