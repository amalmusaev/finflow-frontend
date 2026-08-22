import type {
  Account,
  AccountCreate,
  AccountFilters,
  AccountListResponse,
  AccountUpdate,
} from '../types';
import { getMockAccounts, saveMockAccounts, delay } from './storage';

export const mockAccountsApi = {
  async getAccounts(filters: AccountFilters = {}): Promise<AccountListResponse> {
    await delay();
    let accounts = getMockAccounts();

    if (filters.is_active !== undefined && filters.is_active !== null) {
      accounts = accounts.filter(a => a.is_active === filters.is_active);
    }
    if (filters.type) {
      accounts = accounts.filter(a => a.type === filters.type);
    }
    if (filters.currency) {
      accounts = accounts.filter(a => a.currency === filters.currency);
    }

    return { accounts };
  },

  async getAccountById(accountId: string): Promise<Account> {
    await delay();
    const accounts = getMockAccounts();
    const account = accounts.find(a => a.id === accountId);
    if (!account) {
      throw new Error(`Счет с ID ${accountId} не найден`);
    }
    return account;
  },

  async createAccount(data: AccountCreate): Promise<Account> {
    await delay();
    const accounts = getMockAccounts();
    const newAccount: Account = {
      id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: data.name,
      type: data.type,
      currency: data.currency || 'RUB',
      balance: String(data.balance || '0'),
      is_active: true,
    };

    const updated = [newAccount, ...accounts];
    saveMockAccounts(updated);
    return newAccount;
  },

  async updateAccount(accountId: string, data: AccountUpdate): Promise<Account> {
    await delay();
    const accounts = getMockAccounts();
    const index = accounts.findIndex(a => a.id === accountId);
    if (index === -1) {
      throw new Error(`Счет с ID ${accountId} не найден`);
    }

    const current = accounts[index];
    const updatedAccount: Account = {
      ...current,
      name: data.name !== undefined && data.name !== null ? data.name : current.name,
      type: data.type !== undefined && data.type !== null ? data.type : current.type,
      currency: data.currency !== undefined && data.currency !== null ? data.currency : current.currency,
      is_active: data.is_active !== undefined && data.is_active !== null ? data.is_active : current.is_active,
    };

    accounts[index] = updatedAccount;
    saveMockAccounts(accounts);
    return updatedAccount;
  },

  async deleteAccount(accountId: string): Promise<void> {
    await delay();
    const accounts = getMockAccounts();
    const filtered = accounts.filter(a => a.id !== accountId);
    saveMockAccounts(filtered);
  },
};
