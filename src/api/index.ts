export * from './types';
export * from './client';
export * from './accounts';
export * from './categories';
export * from './operations';
export * from './health';

import { accountsApi } from './accounts';
import { categoriesApi } from './categories';
import { operationsApi } from './operations';
import { healthApi } from './health';

import { mockAccountsApi } from './mock/accounts';
import { mockCategoriesApi } from './mock/categories';
import { mockOperationsApi } from './mock/operations';
import { mockHealthApi } from './mock/health';

export const isMockMode = String(import.meta.env.VITE_USE_MOCK).toLowerCase() === 'true';

export const api = isMockMode
  ? {
      accounts: mockAccountsApi,
      categories: mockCategoriesApi,
      operations: mockOperationsApi,
      health: mockHealthApi,
    }
  : {
      accounts: accountsApi,
      categories: categoriesApi,
      operations: operationsApi,
      health: healthApi,
    };

export default api;

