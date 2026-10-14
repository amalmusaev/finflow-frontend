export type AccountType = 'cash' | 'card' | 'bank' | 'deposit';

export type Currency = 'RUB' | 'USD' | 'EUR' | 'BYN' | 'KZT' | 'CNY';

export type OperationType = 'expense' | 'income';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: Currency;
  balance: string;
  is_active: boolean;
}

export interface AccountCreate {
  name: string;
  type: AccountType;
  currency?: Currency;
  balance?: number | string;
}

export interface AccountUpdate {
  name?: string | null;
  type?: AccountType | null;
  currency?: Currency | null;
  is_active?: boolean | null;
}

export interface AccountListResponse {
  accounts: Account[];
}

export interface AccountFilters {
  is_active?: boolean | null;
  type?: AccountType | null;
  currency?: Currency | null;
  offset?: number;
  limit?: number;
}

export interface Category {
  id: string;
  name: string;
  type: OperationType;
}

export interface CategoryCreate {
  name: string;
  type: OperationType;
}

export interface CategoryUpdate {
  name?: string | null;
  type?: OperationType | null;
}

export interface CategoryListResponse {
  categories: Category[];
}

export interface CategoryFilters {
  type?: OperationType | null;
  offset?: number;
  limit?: number;
}

export interface Operation {
  id: string;
  description: string;
  amount: string;
  type: OperationType;
  date: string; // YYYY-MM-DD
  category_id: string;
  account_id: string;
}

export interface OperationCreate {
  description: string;
  amount: number | string;
  type: OperationType;
  date: string; // YYYY-MM-DD
  category_id: string;
  account_id: string;
}

export interface OperationUpdate {
  description?: string | null;
  amount?: number | string | null;
  type?: OperationType | null;
  date?: string | null; // YYYY-MM-DD
  category_id?: string | null;
  account_id?: string | null;
}

export interface OperationListResponse {
  operations: Operation[];
}

export interface OperationFilters {
  account_id?: string | null;
  category_id?: string | null;
  type?: OperationType | null;
  from_date?: string | null;
  to_date?: string | null;
  limit?: number;
  offset?: number;
}

export interface HealthResponse {
  status?: string;
  app?: string;
  version?: string;
  [key: string]: string | undefined;
}

export interface ApiValidationError {
  loc?: (string | number)[];
  msg: string;
  type?: string;
}

export interface ApiErrorResponse {
  detail?: string | ApiValidationError[];
  message?: string;
}

export interface Transfer {
  id: string;
  from_account_id: string;
  to_account_id: string;
  amount: string;
  to_amount: string;
  fee: string;
  date: string; // YYYY-MM-DD
  description?: string | null;
}

export interface TransferCreate {
  from_account_id: string;
  to_account_id: string;
  amount: number | string;
  to_amount?: number | string | null;
  fee?: number | string;
  date: string;
  description?: string | null;
}

export interface CashWithdrawalCreate {
  from_account_id: string;
  to_account_id?: string | null;
  amount: number | string;
  fee?: number | string;
  date: string;
  description?: string | null;
}

export interface CashDepositCreate {
  to_account_id: string;
  from_account_id?: string | null;
  amount: number | string;
  fee?: number | string;
  date: string;
  description?: string | null;
}

export interface TransferUpdate {
  from_account_id?: string | null;
  to_account_id?: string | null;
  amount?: number | string | null;
  to_amount?: number | string | null;
  fee?: number | string | null;
  date?: string | null;
  description?: string | null;
}

export interface TransferListResponse {
  transfers: Transfer[];
}

export interface TransferFilters {
  account_id?: string | null;
  from_account_id?: string | null;
  to_account_id?: string | null;
  from_date?: string | null;
  to_date?: string | null;
  limit?: number;
  offset?: number;
}

export type ActivityItem =
  | ({ itemType: 'operation' } & Operation)
  | ({ itemType: 'transfer' } & Transfer);

