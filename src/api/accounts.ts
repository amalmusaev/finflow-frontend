import { apiRequest } from './client';
import type {
  Account,
  AccountCreate,
  AccountFilters,
  AccountListResponse,
  AccountUpdate,
} from './types';

export const accountsApi = {
  async getAccounts(filters: AccountFilters = {}): Promise<AccountListResponse> {
    return apiRequest<AccountListResponse>('/api/v1/accounts', {
      method: 'GET',
      params: filters as Record<string, string | number | boolean | null | undefined>,
    });
  },

  async getAccountById(accountId: string): Promise<Account> {
    return apiRequest<Account>(`/api/v1/accounts/${accountId}`, {
      method: 'GET',
    });
  },

  async createAccount(data: AccountCreate): Promise<Account> {
    return apiRequest<Account>('/api/v1/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateAccount(accountId: string, data: AccountUpdate): Promise<Account> {
    return apiRequest<Account>(`/api/v1/accounts/${accountId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteAccount(accountId: string): Promise<void> {
    await apiRequest<void>(`/api/v1/accounts/${accountId}`, {
      method: 'DELETE',
    });
  },
};
