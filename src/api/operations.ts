import { apiRequest } from './client';
import type {
  Operation,
  OperationCreate,
  OperationFilters,
  OperationListResponse,
  OperationUpdate,
} from './types';

const MAX_PAGE_LIMIT = 1000;

export const operationsApi = {
  async getOperations(filters: OperationFilters = {}): Promise<OperationListResponse> {
    const params: OperationFilters = {
      limit: MAX_PAGE_LIMIT,
      ...filters,
    };
    return apiRequest<OperationListResponse>('/api/v1/operations', {
      method: 'GET',
      params: params as Record<string, string | number | boolean | null | undefined>,
    });
  },

  /**
   * Загружает все операции за указанный период или фильтры без ограничений по количеству,
   * автоматически выкачивая все страницы при необходимости.
   */
  async getAllOperations(filters: Omit<OperationFilters, 'limit' | 'offset'> = {}): Promise<OperationListResponse> {
    const pageSize = MAX_PAGE_LIMIT;
    let offset = 0;
    const allOperations: Operation[] = [];

    while (true) {
      const response = await this.getOperations({
        ...filters,
        limit: pageSize,
        offset,
      });

      const batch = response.operations || [];
      allOperations.push(...batch);

      // Если вернулось меньше размера страницы, значит это конец списка
      if (batch.length < pageSize) {
        break;
      }

      offset += pageSize;
    }

    return { operations: allOperations };
  },

  async getOperationById(operationId: string): Promise<Operation> {
    return apiRequest<Operation>(`/api/v1/operations/${operationId}`, {
      method: 'GET',
    });
  },

  async createOperation(data: OperationCreate): Promise<Operation> {
    return apiRequest<Operation>('/api/v1/operations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateOperation(operationId: string, data: OperationUpdate): Promise<Operation> {
    return apiRequest<Operation>(`/api/v1/operations/${operationId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteOperation(operationId: string): Promise<void> {
    await apiRequest<void>(`/api/v1/operations/${operationId}`, {
      method: 'DELETE',
    });
  },
};
