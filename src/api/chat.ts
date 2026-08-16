import { apiRequest } from './client';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface ChatRequest {
  messages: Array<{
    role: MessageRole;
    content: string;
  }>;
  context?: {
    total_balance?: string | number;
    accounts_count?: number;
    operations_count?: number;
  };
}

export interface ChatResponse {
  id: string;
  message: {
    role: 'assistant';
    content: string;
  };
  created_at: string;
}

export const chatApi = {
  /**
   * Отправка сообщения на бэкенд (когда эндпоинт готов)
   */
  async sendMessage(data: ChatRequest): Promise<ChatResponse> {
    return apiRequest<ChatResponse>('/api/v1/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
