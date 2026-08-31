export * from './storage';
export * from './accounts';
export * from './categories';
export * from './operations';
export * from './health';

import { mockAccountsApi } from './accounts';
import { mockCategoriesApi } from './categories';
import { mockOperationsApi } from './operations';
import { mockHealthApi } from './health';

export const mockApi = {
  accounts: mockAccountsApi,
  categories: mockCategoriesApi,
  operations: mockOperationsApi,
  health: mockHealthApi,
};

export default mockApi;
