import { apiRequest } from './client';
import type {
  CashDepositCreate,
  CashWithdrawalCreate,
  Transfer,
  TransferCreate,
  TransferFilters,
  TransferListResponse,
  TransferUpdate,
} from './types';

const MAX_PAGE_LIMIT = 1000;

export const transfersApi = {
  async getTransfers(filters: TransferFilters = {}): Promise<TransferListResponse> {
    const params: TransferFilters = {
      limit: MAX_PAGE_LIMIT,
      ...filters,
    };
    return apiRequest<TransferListResponse>('/api/v1/transfers', {
      method: 'GET',
      params: params as Record<string, string | number | boolean | null | undefined>,
    });
  },

  /**
   * Загружает все переводы за указанный период или фильтры без ограничений по количеству,
   * автоматически выкачивая все страницы при необходимости.
   */
  async getAllTransfers(
    filters: Omit<TransferFilters, 'limit' | 'offset'> = {}
  ): Promise<TransferListResponse> {
    const pageSize = MAX_PAGE_LIMIT;
    let offset = 0;
    const allTransfers: Transfer[] = [];

    while (true) {
      const response = await this.getTransfers({
        ...filters,
        limit: pageSize,
        offset,
      });

      const batch = response.transfers || [];
      allTransfers.push(...batch);

      if (batch.length < pageSize) {
        break;
      }

      offset += pageSize;
    }

    return { transfers: allTransfers };
  },

  async getTransferById(transferId: string): Promise<Transfer> {
    return apiRequest<Transfer>(`/api/v1/transfers/${transferId}`, {
      method: 'GET',
    });
  },

  async createTransfer(data: TransferCreate): Promise<Transfer> {
    return apiRequest<Transfer>('/api/v1/transfers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async createCashWithdrawal(data: CashWithdrawalCreate): Promise<Transfer> {
    return apiRequest<Transfer>('/api/v1/transfers/cash-withdrawal', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async createCashDeposit(data: CashDepositCreate): Promise<Transfer> {
    return apiRequest<Transfer>('/api/v1/transfers/cash-deposit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateTransfer(transferId: string, data: TransferUpdate): Promise<Transfer> {
    return apiRequest<Transfer>(`/api/v1/transfers/${transferId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteTransfer(transferId: string): Promise<void> {
    await apiRequest<void>(`/api/v1/transfers/${transferId}`, {
      method: 'DELETE',
    });
  },
};
