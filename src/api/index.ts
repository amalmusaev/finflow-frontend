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

export const api = {
  accounts: accountsApi,
  categories: categoriesApi,
  operations: operationsApi,
  health: healthApi,
};

export default api;
