import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Currency, AccountType } from "../api/types";

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
