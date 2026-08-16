import { apiRequest } from './client';
import type { HealthResponse } from './types';

export const healthApi = {
  async checkHealth(): Promise<HealthResponse> {
    return apiRequest<HealthResponse>('/health', {
      method: 'GET',
    });
  },
};
