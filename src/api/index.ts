export * from './types';
export * from './client';
export * from './accounts';
export * from './categories';
export * from './operations';
export * from './health';
export * from './chat';

import { accountsApi } from './accounts';
import { categoriesApi } from './categories';
import { operationsApi } from './operations';
import { healthApi } from './health';
import { chatApi } from './chat';

export const api = {
  accounts: accountsApi,
  categories: categoriesApi,
  operations: operationsApi,
  health: healthApi,
  chat: chatApi,
};

export default api;
