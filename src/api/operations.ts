import { apiRequest } from './client';
import type {
  Operation,
  OperationCreate,
  OperationFilters,
  OperationListResponse,
  OperationUpdate,
} from './types';

export const operationsApi = {
  async getOperations(filters: OperationFilters = {}): Promise<OperationListResponse> {
    return apiRequest<OperationListResponse>('/api/v1/operations', {
      method: 'GET',
      params: filters as Record<string, string | number | boolean | null | undefined>,
    });
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
