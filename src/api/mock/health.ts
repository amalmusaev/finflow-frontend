import type { HealthResponse } from '../types';
import { delay } from './storage';

export const mockHealthApi = {
  async checkHealth(): Promise<HealthResponse> {
    await delay(30);
    return {
      status: 'ok',
      app: 'FinFlow (Mock Mode)',
      version: 'mock-1.0.0',
    };
  },
};
