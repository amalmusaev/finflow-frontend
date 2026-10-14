import type {
  CashDepositCreate,
  CashWithdrawalCreate,
  Transfer,
  TransferCreate,
  TransferFilters,
  TransferListResponse,
  TransferUpdate,
} from '../types';
import {
  delay,
  getMockAccounts,
  getMockTransfers,
  saveMockAccounts,
  saveMockTransfers,
} from './storage';

export const mockTransfersApi = {
  async getTransfers(filters: TransferFilters = {}): Promise<TransferListResponse> {
    await delay(30);
    let list = getMockTransfers();

    if (filters.account_id) {
      list = list.filter(
        t => t.from_account_id === filters.account_id || t.to_account_id === filters.account_id
      );
    }
    if (filters.from_account_id) {
      list = list.filter(t => t.from_account_id === filters.from_account_id);
    }
    if (filters.to_account_id) {
      list = list.filter(t => t.to_account_id === filters.to_account_id);
    }
    if (filters.from_date) {
      list = list.filter(t => t.date >= filters.from_date!);
    }
    if (filters.to_date) {
      list = list.filter(t => t.date <= filters.to_date!);
    }

    list.sort((a, b) => b.date.localeCompare(a.date));

    const offset = filters.offset || 0;
    const limit = filters.limit || 100;
    const paginated = list.slice(offset, offset + limit);

    return { transfers: paginated };
  },

  async getAllTransfers(
    filters: Omit<TransferFilters, 'limit' | 'offset'> = {}
  ): Promise<TransferListResponse> {
    await delay(40);
    let list = getMockTransfers();

    if (filters.account_id) {
      list = list.filter(
        t => t.from_account_id === filters.account_id || t.to_account_id === filters.account_id
      );
    }
    if (filters.from_account_id) {
      list = list.filter(t => t.from_account_id === filters.from_account_id);
    }
    if (filters.to_account_id) {
      list = list.filter(t => t.to_account_id === filters.to_account_id);
    }
    if (filters.from_date) {
      list = list.filter(t => t.date >= filters.from_date!);
    }
    if (filters.to_date) {
      list = list.filter(t => t.date <= filters.to_date!);
    }

    list.sort((a, b) => b.date.localeCompare(a.date));
    return { transfers: list };
  },

  async getTransferById(transferId: string): Promise<Transfer> {
    await delay(20);
    const item = getMockTransfers().find(t => t.id === transferId);
    if (!item) throw new Error('Перевод не найден');
    return item;
  },

  async createTransfer(data: TransferCreate): Promise<Transfer> {
    await delay(40);
    if (data.from_account_id === data.to_account_id) {
      throw new Error('Счет списания и счет зачисления не могут совпадать');
    }

    const accounts = getMockAccounts();
    const fromAcc = accounts.find(a => a.id === data.from_account_id);
    const toAcc = accounts.find(a => a.id === data.to_account_id);

    if (!fromAcc) throw new Error('Счет списания не найден');
    if (!toAcc) throw new Error('Счет зачисления не найден');

    const amountNum = parseFloat(String(data.amount));
    const feeNum = parseFloat(String(data.fee || 0)) || 0;
    let toAmountNum = data.to_amount ? parseFloat(String(data.to_amount)) : amountNum;

    if (!data.to_amount && fromAcc.currency !== toAcc.currency) {
      throw new Error(
        `Валюты счетов не совпадают (${fromAcc.currency} -> ${toAcc.currency}). Укажите сумму зачисления to_amount.`
      );
    }

    // Корректировка балансов
    fromAcc.balance = String((parseFloat(fromAcc.balance) || 0) - (amountNum + feeNum));
    toAcc.balance = String((parseFloat(toAcc.balance) || 0) + toAmountNum);
    saveMockAccounts(accounts);

    const newTransfer: Transfer = {
      id: `mock-t-${Date.now()}`,
      from_account_id: data.from_account_id,
      to_account_id: data.to_account_id,
      amount: amountNum.toFixed(2),
      to_amount: toAmountNum.toFixed(2),
      fee: feeNum.toFixed(2),
      date: data.date,
      description: data.description || null,
    };

    const transfers = getMockTransfers();
    transfers.unshift(newTransfer);
    saveMockTransfers(transfers);

    return newTransfer;
  },

  async createCashWithdrawal(data: CashWithdrawalCreate): Promise<Transfer> {
    const accounts = getMockAccounts();
    const fromAcc = accounts.find(a => a.id === data.from_account_id);
    if (!fromAcc) throw new Error('Счет списания не найден');

    let toAccountId = data.to_account_id;
    if (!toAccountId) {
      // Ищем активный счет наличных в той же валюте
      const cashAcc = accounts.find(
        a => a.type === 'cash' && a.currency === fromAcc.currency && a.is_active
      );
      if (cashAcc) {
        toAccountId = cashAcc.id;
      } else {
        // Создаем счет 'Наличные'
        const newCash = {
          id: `acc-${Date.now()}`,
          name: 'Наличные',
          type: 'cash' as const,
          currency: fromAcc.currency,
          balance: '0.00',
          is_active: true,
        };
        accounts.push(newCash);
        saveMockAccounts(accounts);
        toAccountId = newCash.id;
      }
    }

    return this.createTransfer({
      from_account_id: data.from_account_id,
      to_account_id: toAccountId,
      amount: data.amount,
      fee: data.fee,
      date: data.date,
      description: data.description || 'Снятие наличных',
    });
  },

  async createCashDeposit(data: CashDepositCreate): Promise<Transfer> {
    const accounts = getMockAccounts();
    const toAcc = accounts.find(a => a.id === data.to_account_id);
    if (!toAcc) throw new Error('Счет зачисления не найден');

    let fromAccountId = data.from_account_id;
    if (!fromAccountId) {
      const cashAcc = accounts.find(
        a => a.type === 'cash' && a.currency === toAcc.currency && a.is_active
      );
      if (!cashAcc) {
        throw new Error(
          `Не найден счет наличных с валютой ${toAcc.currency}. Создайте счет наличных.`
        );
      }
      fromAccountId = cashAcc.id;
    }

    return this.createTransfer({
      from_account_id: fromAccountId,
      to_account_id: data.to_account_id,
      amount: data.amount,
      fee: data.fee,
      date: data.date,
      description: data.description || 'Внесение наличных',
    });
  },

  async updateTransfer(transferId: string, data: TransferUpdate): Promise<Transfer> {
    await delay(40);
    const transfers = getMockTransfers();
    const idx = transfers.findIndex(t => t.id === transferId);
    if (idx === -1) throw new Error('Перевод не найден');
    const existing = transfers[idx];

    const accounts = getMockAccounts();

    // 1. Откат старого перевода
    const oldFrom = accounts.find(a => a.id === existing.from_account_id);
    const oldTo = accounts.find(a => a.id === existing.to_account_id);
    if (oldFrom) {
      oldFrom.balance = String(
        (parseFloat(oldFrom.balance) || 0) +
          (parseFloat(existing.amount) + parseFloat(existing.fee || '0'))
      );
    }
    if (oldTo) {
      oldTo.balance = String((parseFloat(oldTo.balance) || 0) - parseFloat(existing.to_amount));
    }

    // 2. Новые данные
    const newFromId = data.from_account_id ?? existing.from_account_id;
    const newToId = data.to_account_id ?? existing.to_account_id;
    if (newFromId === newToId) {
      throw new Error('Счет списания и счет зачисления не могут совпадать');
    }

    const newFrom = accounts.find(a => a.id === newFromId);
    const newTo = accounts.find(a => a.id === newToId);
    if (!newFrom) throw new Error('Новый счет списания не найден');
    if (!newTo) throw new Error('Новый счет зачисления не найден');

    const newAmount = data.amount !== undefined && data.amount !== null ? parseFloat(String(data.amount)) : parseFloat(existing.amount);
    const newFee = data.fee !== undefined && data.fee !== null ? parseFloat(String(data.fee)) : parseFloat(existing.fee || '0');
    let newToAmount = data.to_amount !== undefined && data.to_amount !== null ? parseFloat(String(data.to_amount)) : (newFrom.currency === newTo.currency ? newAmount : parseFloat(existing.to_amount));

    // 3. Применение к новым счетам
    newFrom.balance = String((parseFloat(newFrom.balance) || 0) - (newAmount + newFee));
    newTo.balance = String((parseFloat(newTo.balance) || 0) + newToAmount);
    saveMockAccounts(accounts);

    // 4. Обновление перевода
    const updated: Transfer = {
      ...existing,
      from_account_id: newFromId,
      to_account_id: newToId,
      amount: newAmount.toFixed(2),
      to_amount: newToAmount.toFixed(2),
      fee: newFee.toFixed(2),
      date: data.date ?? existing.date,
      description: data.description !== undefined ? data.description : existing.description,
    };

    transfers[idx] = updated;
    saveMockTransfers(transfers);

    return updated;
  },

  async deleteTransfer(transferId: string): Promise<void> {
    await delay(30);
    const transfers = getMockTransfers();
    const existing = transfers.find(t => t.id === transferId);
    if (!existing) return;

    const accounts = getMockAccounts();
    const fromAcc = accounts.find(a => a.id === existing.from_account_id);
    const toAcc = accounts.find(a => a.id === existing.to_account_id);

    if (fromAcc) {
      fromAcc.balance = String(
        (parseFloat(fromAcc.balance) || 0) +
          (parseFloat(existing.amount) + parseFloat(existing.fee || '0'))
      );
    }
    if (toAcc) {
      toAcc.balance = String((parseFloat(toAcc.balance) || 0) - parseFloat(existing.to_amount));
    }
    saveMockAccounts(accounts);

    saveMockTransfers(transfers.filter(t => t.id !== transferId));
  },
};
