import type { ChatRequest, ChatResponse } from '../chat';
import { generateMockAiResponse } from '../../lib/mockChat';
import { getMockAccounts, getMockCategories, getMockOperations, delay } from './storage';

export const mockChatApi = {
  async sendMessage(data: ChatRequest): Promise<ChatResponse> {
    await delay(400);

    const lastMessage = data.messages[data.messages.length - 1];
    const userPrompt = lastMessage?.content || '';
    const hasImages = Boolean(lastMessage?.images && lastMessage.images.length > 0);

    const accounts = getMockAccounts();
    const categories = getMockCategories();
    const operations = getMockOperations();

    const reply = await generateMockAiResponse(userPrompt, {
      accounts,
      categories,
      operations,
      hasImages,
      imagesCount: lastMessage?.images?.length || 0,
    });

    return {
      id: `resp-${Date.now()}`,
      message: {
        role: 'assistant',
        content: reply,
      },
      created_at: new Date().toISOString(),
    };
  },
};
