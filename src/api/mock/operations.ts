import type {
  Operation,
  OperationCreate,
  OperationFilters,
  OperationListResponse,
  OperationUpdate,
} from '../types';
import {
  getMockOperations,
  saveMockOperations,
  getMockAccounts,
  saveMockAccounts,
  delay,
} from './storage';

export const mockOperationsApi = {
  async getOperations(filters: OperationFilters = {}): Promise<OperationListResponse> {
    await delay();
    let operations = getMockOperations();

    if (filters.account_id && filters.account_id !== 'all') {
      operations = operations.filter(o => o.account_id === filters.account_id);
    }
    if (filters.category_id && filters.category_id !== 'all') {
      operations = operations.filter(o => o.category_id === filters.category_id);
    }
    if (filters.type && filters.type !== 'all' as any) {
      operations = operations.filter(o => o.type === filters.type);
    }
    if (filters.from_date) {
      operations = operations.filter(o => o.date >= filters.from_date!);
    }
    if (filters.to_date) {
      operations = operations.filter(o => o.date <= filters.to_date!);
    }

    return { operations };
  },

  async getOperationById(operationId: string): Promise<Operation> {
    await delay();
    const operations = getMockOperations();
    const operation = operations.find(o => o.id === operationId);
    if (!operation) {
      throw new Error(`Операция с ID ${operationId} не найдена`);
    }
    return operation;
  },

  async createOperation(data: OperationCreate): Promise<Operation> {
    await delay();
    const operations = getMockOperations();
    const accounts = getMockAccounts();

    const amountNum = Math.abs(parseFloat(String(data.amount)) || 0);

    const newOperation: Operation = {
      id: `op-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      description: data.description || 'Без описания',
      amount: String(amountNum),
      type: data.type,
      date: data.date || new Date().toISOString().split('T')[0],
      category_id: data.category_id,
      account_id: data.account_id,
    };

    // Update account balance
    const accIndex = accounts.findIndex(a => a.id === data.account_id);
    if (accIndex !== -1) {
      const currentAcc = accounts[accIndex];
      const curBalance = parseFloat(currentAcc.balance) || 0;
      const newBalance = data.type === 'income' ? curBalance + amountNum : curBalance - amountNum;
      accounts[accIndex] = {
        ...currentAcc,
        balance: String(newBalance),
      };
      saveMockAccounts(accounts);
    }

    const updated = [newOperation, ...operations];
    saveMockOperations(updated);
    return newOperation;
  },

  async updateOperation(operationId: string, data: OperationUpdate): Promise<Operation> {
    await delay();
    const operations = getMockOperations();
    const accounts = getMockAccounts();

    const index = operations.findIndex(o => o.id === operationId);
    if (index === -1) {
      throw new Error(`Операция с ID ${operationId} не найдена`);
    }

    const oldOp = operations[index];
    const oldAmount = Math.abs(parseFloat(oldOp.amount) || 0);

    // Rollback old operation impact on old account
    const oldAccIndex = accounts.findIndex(a => a.id === oldOp.account_id);
    if (oldAccIndex !== -1) {
      const curBalance = parseFloat(accounts[oldAccIndex].balance) || 0;
      const rolledBack = oldOp.type === 'income' ? curBalance - oldAmount : curBalance + oldAmount;
      accounts[oldAccIndex] = {
        ...accounts[oldAccIndex],
        balance: String(rolledBack),
      };
    }

    const newType = data.type || oldOp.type;
    const newAmount = data.amount !== undefined && data.amount !== null ? Math.abs(parseFloat(String(data.amount)) || 0) : oldAmount;
    const newAccountId = data.account_id || oldOp.account_id;

    // Apply new operation impact on new account
    const newAccIndex = accounts.findIndex(a => a.id === newAccountId);
    if (newAccIndex !== -1) {
      const curBalance = parseFloat(accounts[newAccIndex].balance) || 0;
      const applied = newType === 'income' ? curBalance + newAmount : curBalance - newAmount;
      accounts[newAccIndex] = {
        ...accounts[newAccIndex],
        balance: String(applied),
      };
    }
    saveMockAccounts(accounts);

    const updatedOp: Operation = {
      ...oldOp,
      description: data.description !== undefined && data.description !== null ? data.description : oldOp.description,
      amount: String(newAmount),
      type: newType,
      date: data.date || oldOp.date,
      category_id: data.category_id || oldOp.category_id,
      account_id: newAccountId,
    };

    operations[index] = updatedOp;
    saveMockOperations(operations);
    return updatedOp;
  },

  async deleteOperation(operationId: string): Promise<void> {
    await delay();
    const operations = getMockOperations();
    const accounts = getMockAccounts();

    const opToDelete = operations.find(o => o.id === operationId);
    if (opToDelete) {
      // Rollback operation balance from account
      const amountNum = Math.abs(parseFloat(opToDelete.amount) || 0);
      const accIndex = accounts.findIndex(a => a.id === opToDelete.account_id);
      if (accIndex !== -1) {
        const curBalance = parseFloat(accounts[accIndex].balance) || 0;
        const restoredBalance = opToDelete.type === 'income' ? curBalance - amountNum : curBalance + amountNum;
        accounts[accIndex] = {
          ...accounts[accIndex],
          balance: String(restoredBalance),
        };
        saveMockAccounts(accounts);
      }
    }

    const filtered = operations.filter(o => o.id !== operationId);
    saveMockOperations(filtered);
  },
};
