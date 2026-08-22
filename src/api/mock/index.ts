export * from './storage';
export * from './accounts';
export * from './categories';
export * from './operations';
export * from './health';
export * from './chat';

import { mockAccountsApi } from './accounts';
import { mockCategoriesApi } from './categories';
import { mockOperationsApi } from './operations';
import { mockHealthApi } from './health';
import { mockChatApi } from './chat';

export const mockApi = {
  accounts: mockAccountsApi,
  categories: mockCategoriesApi,
  operations: mockOperationsApi,
  health: mockHealthApi,
  chat: mockChatApi,
};

export default mockApi;
