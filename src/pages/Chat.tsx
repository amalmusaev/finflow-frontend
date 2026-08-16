import { useState, useEffect, useRef, useCallback } from 'react';
import { SendHorizontal, Sparkles, Trash2 } from 'lucide-react';
import { ChatMessageItem } from '../components/chat/ChatMessageItem';
import { ChatSidebar, ToggleSidebarButton } from '../components/chat/ChatSidebar';
import { generateMockAiResponse } from '../lib/mockChat';
import { api } from '../api';
import type { Account, Category, Operation } from '../api/types';
import type { ChatMessage, ChatSession } from '../api/chat';
import { cn } from '../lib/utils';
import { accounts as mockAccounts, categories as mockCategories, transactions as mockTransactions } from '../lib/mockData';

const SESSIONS_STORAGE_KEY = 'finflow_chat_sessions_v2';
const LEGACY_STORAGE_KEY = 'finflow_chat_history_v1';
const SIDEBAR_STORAGE_KEY = 'finflow_chat_sidebar_open';

const PROMPT_SUGGESTIONS = [
  {
    icon: '📊',
    title: 'Анализ расходов',
    prompt: 'Сколько я потратил в этом месяце и на какие категории?',
  },
  {
    icon: '💳',
    title: 'Сводка по счетам',
    prompt: 'Какой у меня общий баланс и сколько денег на каждом счете?',
  },
  {
    icon: '🔍',
    title: 'Крупные траты',
    prompt: 'Покажи самые крупные расходы и средний чек',
  },
  {
    icon: '💡',
    title: 'Советы по бюджету',
    prompt: 'Дай рекомендации по оптимизации бюджета и сбережениям',
  },
];

function createNewSessionObject(): ChatSession {
  const now = new Date().toISOString();
  return {
    id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: 'Новый диалог',
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

function loadInitialSessions(): ChatSession[] {
  try {
    const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (saved) {
      const parsed: ChatSession[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // Миграция из v1 если есть
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const legacyMsgs: ChatMessage[] = JSON.parse(legacy);
      if (Array.isArray(legacyMsgs) && legacyMsgs.length > 0) {
        const firstUserMsg = legacyMsgs.find((m) => m.role === 'user');
        const session: ChatSession = {
          id: `session-${Date.now()}`,
          title: firstUserMsg ? generateTitleFromPrompt(firstUserMsg.content) : 'История сообщений',
          createdAt: legacyMsgs[0]?.timestamp || new Date().toISOString(),
          updatedAt: legacyMsgs[legacyMsgs.length - 1]?.timestamp || new Date().toISOString(),
          messages: legacyMsgs,
        };
        return [session];
      }
    }
  } catch {
    // ignore
  }

  return [createNewSessionObject()];
}

function generateTitleFromPrompt(prompt: string): string {
  const clean = prompt.trim().replace(/^[\n\r]+/, '');
  if (clean.length <= 32) return clean;
  return clean.substring(0, 30).trim() + '...';
}

export function Chat() {
  const [sessions, setSessions] = useState<ChatSession[]>(loadInitialSessions);
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const initial = loadInitialSessions();
    return initial[0]?.id || '';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return saved !== null ? saved === 'true' : true;
  });

  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Находим текущую активную сессию
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || null;
  const messages = activeSession ? activeSession.messages : [];

  // Сохранение сессий в localStorage
  useEffect(() => {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  // Сохранение состояния сайдбара
  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarOpen));
  }, [isSidebarOpen]);

  // Загрузка актуальных данных из Finflow API (с откатом на mockData при офлайн-бэкенде)
  const loadFinancialData = useCallback(async () => {
    try {
      const [accRes, catRes, opRes] = await Promise.all([
        api.accounts.getAccounts().catch(() => ({ accounts: [] })),
        api.categories.getCategories().catch(() => ({ categories: [] })),
        api.operations.getOperations().catch(() => ({ operations: [] })),
      ]);

      const loadedAccs = accRes.accounts && accRes.accounts.length > 0
        ? accRes.accounts
        : (mockAccounts as unknown as Account[]);

      const loadedCats = catRes.categories && catRes.categories.length > 0
        ? catRes.categories
        : (mockCategories as unknown as Category[]);

      const loadedOps = opRes.operations && opRes.operations.length > 0
        ? opRes.operations
        : (mockTransactions.map(t => ({
            id: t.id,
            description: t.description,
            amount: String(t.amount),
            type: t.amount < 0 ? 'expense' : 'income',
            date: t.date.split('T')[0],
            category_id: t.categoryId,
            account_id: t.accountId,
          })) as Operation[]);

      setAccounts(loadedAccs);
      setCategories(loadedCats);
      setOperations(loadedOps);
    } catch {
      // Использовать мок-данные
      setAccounts(mockAccounts as unknown as Account[]);
      setCategories(mockCategories as unknown as Category[]);
    }
  }, []);

  useEffect(() => {
    loadFinancialData();
  }, [loadFinancialData]);

  // Скролл вниз к последнему сообщению
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, isGenerating, activeSessionId]);

  // Автовысота поля ввода
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  // Управление сессиями
  const handleCreateSession = () => {
    const newSession = createNewSessionObject();
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    setInput('');
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        const fresh = createNewSessionObject();
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      if (id === activeSessionId) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle, updatedAt: new Date().toISOString() } : s))
    );
  };

  const handleClearCurrentHistory = () => {
    if (messages.length === 0) return;
    if (window.confirm('Очистить историю текущего диалога?')) {
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, messages: [], updatedAt: new Date().toISOString() } : s))
      );
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isGenerating || !activeSession) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    const isFirstMessage = activeSession.messages.length === 0;
    const newTitle =
      isFirstMessage && (activeSession.title === 'Новый диалог' || !activeSession.title)
        ? generateTitleFromPrompt(query)
        : activeSession.title;

    // Оптимистичное обновление сообщений в текущей сессии
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              title: newTitle,
              updatedAt: new Date().toISOString(),
              messages: [...s.messages, userMessage],
            }
          : s
      )
    );

    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setIsGenerating(true);

    try {
      // Имитируем генерацию ответа с естественной задержкой
      const fullResponse = await generateMockAiResponse(query, {
        accounts,
        categories,
        operations,
      });

      // Задержка для реалистичности
      await new Promise((resolve) => setTimeout(resolve, 550));

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date().toISOString(),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                updatedAt: new Date().toISOString(),
                messages: [...s.messages, assistantMessage],
              }
            : s
        )
      );
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Произошла ошибка при формировании ответа: ${err.message || 'Неизвестная ошибка'}. Пожалуйста, попробуйте еще раз.`,
        timestamp: new Date().toISOString(),
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                updatedAt: new Date().toISOString(),
                messages: [...s.messages, errorMessage],
              }
            : s
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-full bg-mono-50 text-mono-900 overflow-hidden relative">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
        {/* Top actions toolbar */}
        <div className="absolute top-4 right-6 z-20 flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={handleClearCurrentHistory}
              className="p-2 rounded-lg border border-mono-200/60 bg-mono-100/80 hover:bg-mono-200 text-mono-500 hover:text-mono-900 transition-all shadow-xs backdrop-blur-sm"
              title="Очистить историю текущего диалога"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <ToggleSidebarButton isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(true)} />
        </div>

        {/* Main Messages View Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 space-y-6">
          {messages.length === 0 ? (
            /* Empty / Welcome State */
            <div className="max-w-2xl mx-auto py-8 sm:py-12 flex flex-col items-center text-center">
              <div className="mb-4 text-mono-900">
                <Sparkles className="w-9 h-9" />
              </div>

              <h2 className="text-2xl font-bold text-mono-900 tracking-tight mb-2">
                Чем я могу помочь сегодня?
              </h2>
              <p className="text-sm text-mono-500 max-w-md mb-8 leading-relaxed">
                Задавайте вопросы о ваших тратах, балансе счетов, динамике накоплений или просите структурированные отчеты.
              </p>

              {/* Quick Prompt Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                {PROMPT_SUGGESTIONS.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(item.prompt)}
                    className="p-4 rounded-xl bg-mono-100/70 border border-mono-200 hover:border-mono-300 hover:bg-mono-200/50 transition-all text-left group flex flex-col gap-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{item.icon}</span>
                      <span className="text-xs font-semibold text-mono-900 group-hover:text-mono-950">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-xs text-mono-500 group-hover:text-mono-700 leading-snug">
                      {item.prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages Feed */
            <div className="space-y-6 max-w-4xl mx-auto w-full">
              {messages.map((msg) => (
                <ChatMessageItem key={msg.id} message={msg} />
              ))}

              {/* Generating typing indicator */}
              {isGenerating && (
                <div className="flex gap-3.5 items-start max-w-4xl w-full mx-auto">
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-5 h-5 text-mono-900" />
                  </div>
                  <div className="bg-mono-100 border border-mono-200 rounded-xl px-4 py-3 text-xs text-mono-600 flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-mono-400 animate-pulse" />
                    <span className="w-2 h-2 rounded-full bg-mono-400 animate-pulse [animation-delay:200ms]" />
                    <span className="w-2 h-2 rounded-full bg-mono-400 animate-pulse [animation-delay:400ms]" />
                    <span className="font-mono text-mono-500 ml-1">Анализирую данные...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Form Bar */}
        <div className="px-4 pb-5 pt-1 sm:px-8 bg-mono-50 flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            {/* Quick chips below messages if there's history */}
            {messages.length > 0 && !isGenerating && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2.5 mb-1 no-scrollbar text-xs">
                <span className="text-mono-400 font-mono text-[11px] whitespace-nowrap">
                  Подсказки:
                </span>
                {PROMPT_SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.prompt)}
                    className="px-2.5 py-1 rounded-full bg-mono-100 hover:bg-mono-200 border border-mono-200 text-mono-700 text-[11px] font-medium whitespace-nowrap transition-colors"
                  >
                    {item.icon} {item.title}
                  </button>
                ))}
              </div>
            )}

            <div className="relative flex items-end bg-mono-100 border border-mono-200 focus-within:border-mono-400 focus-within:ring-1 focus-within:ring-mono-400 rounded-xl p-2 transition-all">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Задайте вопрос о ваших расходах, счетах или бюджете..."
                className="w-full bg-transparent border-0 focus:outline-none resize-none px-2 py-1.5 text-sm text-mono-900 placeholder:text-mono-400 max-h-40 font-sans"
                disabled={isGenerating}
              />

              <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || isGenerating}
                  className={cn(
                    "p-2 rounded-lg transition-all flex items-center justify-center",
                    input.trim() && !isGenerating
                      ? "bg-mono-900 text-mono-50 hover:bg-mono-800 shadow-xs"
                      : "bg-mono-200 text-mono-400 cursor-not-allowed"
                  )}
                  title="Отправить сообщение (Enter)"
                >
                  <SendHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-mono-400 font-mono">
              <span>Enter — отправить, Shift + Enter — новая строка</span>
              <span>Finflow AI v1.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions Sidebar (Right side) */}
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
        onSelectSession={handleSelectSession}
        onCreateSession={handleCreateSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
      />
    </div>
  );
}
