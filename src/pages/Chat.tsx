import { useState, useEffect, useRef, useCallback } from 'react';
import { SendHorizontal, Sparkles, Trash2, ImagePlus, X, UploadCloud, AlertCircle } from 'lucide-react';
import { ChatMessageItem } from '../components/chat/ChatMessageItem';
import { ChatSidebar, ToggleSidebarButton } from '../components/chat/ChatSidebar';
import { generateMockAiResponse } from '../lib/mockChat';
import { api } from '../api';
import type { Account, Category, Operation } from '../api/types';
import type { ChatMessage, ChatSession, ChatImageAttachment } from '../api/chat';
import { cn } from '../lib/utils';
import { accounts as mockAccounts, categories as mockCategories, transactions as mockTransactions } from '../lib/mockData';

const SESSIONS_STORAGE_KEY = 'finflow_chat_sessions_v2';
const LEGACY_STORAGE_KEY = 'finflow_chat_history_v1';
const SIDEBAR_STORAGE_KEY = 'finflow_chat_sidebar_open';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_ATTACHED_FILES = 5;

const PROMPT_SUGGESTIONS = [
  {
    icon: '📊',
    title: 'Анализ расходов',
    prompt: 'Сколько я потратил в этом месяце и на какие категории?',
  },
  {
    icon: '🧾',
    title: 'Распознать чек',
    prompt: 'Разбери этот чек, выдели позиции и определи общую сумму',
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
  const [attachedImages, setAttachedImages] = useState<ChatImageAttachment[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        api.operations.getAllOperations().catch(() => ({ operations: [] })),
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

  // Обработка файлов изображений
  const readFileAsDataUrl = (file: File): Promise<ChatImageAttachment> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          url: reader.result as string,
          name: file.name,
          size: file.size,
          type: file.type,
        });
      };
      reader.onerror = () => reject(new Error(`Не удалось прочитать файл ${file.name}`));
      reader.readAsDataURL(file);
    });
  };

  const processFiles = async (files: FileList | File[]) => {
    setUploadError(null);
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter((f) => f.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      setUploadError('Пожалуйста, выберите изображение (PNG, JPG, WEBP, GIF, SVG)');
      return;
    }

    if (attachedImages.length + imageFiles.length > MAX_ATTACHED_FILES) {
      setUploadError(`Максимум ${MAX_ATTACHED_FILES} изображений на одно сообщение`);
      return;
    }

    const validFiles: File[] = [];
    for (const file of imageFiles) {
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`Файл «${file.name}» превышает лимит 10 МБ`);
        return;
      }
      validFiles.push(file);
    }

    try {
      const attachments = await Promise.all(validFiles.map(readFileAsDataUrl));
      setAttachedImages((prev) => [...prev, ...attachments]);
    } catch (err: any) {
      setUploadError(err.message || 'Ошибка при загрузке изображения');
    }
  };

  const handleRemoveAttachedImage = (id: string) => {
    setAttachedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      processFiles(imageFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Управление сессиями
  const handleCreateSession = () => {
    const newSession = createNewSessionObject();
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setInput('');
    setAttachedImages([]);
    setUploadError(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    setInput('');
    setAttachedImages([]);
    setUploadError(null);
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
    const currentImages = [...attachedImages];
    const hasImagesToSend = currentImages.length > 0;

    if ((!query && !hasImagesToSend) || isGenerating || !activeSession) return;

    const finalPrompt = query || (hasImagesToSend ? 'Разбери и проанализируй прикрепленный документ/чек' : '');

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      images: hasImagesToSend ? currentImages : undefined,
      timestamp: new Date().toISOString(),
    };

    const isFirstMessage = activeSession.messages.length === 0;
    const newTitle =
      isFirstMessage && (activeSession.title === 'Новый диалог' || !activeSession.title)
        ? generateTitleFromPrompt(query || (hasImagesToSend ? 'Анализ чека / фото' : 'Диалог'))
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
    setAttachedImages([]);
    setUploadError(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setIsGenerating(true);

    try {
      // Имитируем генерацию ответа с естественной задержкой
      const fullResponse = await generateMockAiResponse(finalPrompt, {
        accounts,
        categories,
        operations,
        hasImages: hasImagesToSend,
        imagesCount: currentImages.length,
        imageNames: currentImages.map((img) => img.name),
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

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const canSend = (input.trim().length > 0 || attachedImages.length > 0) && !isGenerating;

  return (
    <div
      className="flex h-full bg-mono-50 text-mono-900 overflow-hidden relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-40 bg-mono-950/60 backdrop-blur-xs flex items-center justify-center p-6 pointer-events-none">
          <div className="border-2 border-dashed border-mono-200 bg-mono-900 text-mono-50 rounded-none p-8 max-w-md w-full flex flex-col items-center gap-3 shadow-2xl animate-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-none bg-mono-800 flex items-center justify-center text-mono-100">
              <UploadCloud className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <p className="font-semibold text-sm">Перетащите изображения сюда</p>
              <p className="text-xs text-mono-400 font-mono mt-1">Чек, квитанция, выписка или скриншот (до 10 МБ)</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
        {/* Top actions toolbar */}
        <div className="absolute top-4 right-6 z-20 flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={handleClearCurrentHistory}
              className="p-2 rounded-none border border-mono-200/60 bg-mono-100/80 hover:bg-mono-200 text-mono-500 hover:text-mono-900 transition-all shadow-xs backdrop-blur-sm"
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
                Задавайте вопросы о ваших расходах, загружайте фотографии чеков и квитанций для распознавания, или запрашивайте финансовые сводки.
              </p>

              {/* Quick Prompt Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                {PROMPT_SUGGESTIONS.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(item.prompt)}
                    className="p-4 rounded-none bg-mono-100/70 border border-mono-200 hover:border-mono-300 hover:bg-mono-200/50 transition-all text-left group flex flex-col gap-1.5"
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
                  <div className="bg-mono-50 border border-mono-200 rounded-none px-4 py-3 text-xs text-mono-600 flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-none bg-mono-400 animate-pulse" />
                    <span className="w-2 h-2 rounded-none bg-mono-400 animate-pulse [animation-delay:200ms]" />
                    <span className="w-2 h-2 rounded-none bg-mono-400 animate-pulse [animation-delay:400ms]" />
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
                    className="px-2.5 py-1 rounded-none bg-mono-100 hover:bg-mono-200 border border-mono-200 text-mono-700 text-[11px] font-medium whitespace-nowrap transition-colors"
                  >
                    {item.icon} {item.title}
                  </button>
                ))}
              </div>
            )}

            {/* Upload Error Banner */}
            {uploadError && (
              <div className="mb-2 p-2 px-3 rounded-none bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                  <span>{uploadError}</span>
                </div>
                <button
                  onClick={() => setUploadError(null)}
                  className="text-rose-400 hover:text-rose-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Input Box Container */}
            <div className="relative flex flex-col bg-mono-50 border border-mono-200 focus-within:border-mono-400 focus-within:ring-1 focus-within:ring-mono-400 rounded-none p-2 transition-all">
              {/* Attached Images Preview Row */}
              {attachedImages.length > 0 && (
                <div className="flex items-center gap-2 p-2 mb-2 bg-mono-200/60 rounded-none overflow-x-auto border border-mono-300/40">
                  {attachedImages.map((img) => (
                    <div key={img.id} className="relative group/thumb flex-shrink-0">
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-14 h-14 object-cover rounded-none border border-mono-300 shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachedImage(img.id)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-mono-900 hover:bg-rose-600 text-mono-50 rounded-none flex items-center justify-center shadow-xs transition-colors"
                        title="Удалить изображение"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-0 inset-x-0 bg-mono-950/70 text-mono-100 text-[9px] font-mono px-1 py-0.5 truncate rounded-b-md text-center">
                        {formatFileSize(img.size)}
                      </div>
                    </div>
                  ))}
                  <div className="flex flex-col justify-center pl-1 text-[11px] text-mono-500 font-mono">
                    <span>{attachedImages.length} из {MAX_ATTACHED_FILES} прикреплено</span>
                    <span className="text-[10px] text-mono-400">Нажмите «Отправить» для анализа</span>
                  </div>
                </div>
              )}

              <div className="flex items-end gap-1.5">
                {/* Upload Image Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isGenerating || attachedImages.length >= MAX_ATTACHED_FILES}
                  className="p-2 rounded-none text-mono-500 hover:text-mono-900 hover:bg-mono-200/80 transition-colors disabled:opacity-40 flex-shrink-0"
                  title="Прикрепить изображение чека, квитанции или скриншота (или вставьте через Ctrl+V)"
                >
                  <ImagePlus className="w-4 h-4" />
                </button>

                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder={
                    attachedImages.length > 0
                      ? "Добавьте комментарий или нажмите Enter для отправки..."
                      : "Задайте вопрос, прикрепите чек или вставьте скриншот (Ctrl+V)..."
                  }
                  className="w-full bg-transparent border-0 focus:outline-none resize-none px-1 py-1.5 text-sm text-mono-900 placeholder:text-mono-400 max-h-40 font-sans"
                  disabled={isGenerating}
                />

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!canSend}
                    className={cn(
                      "p-2 rounded-none transition-all flex items-center justify-center",
                      canSend
                        ? "bg-mono-900 text-mono-50 hover:bg-mono-800 shadow-xs"
                        : "bg-mono-200 text-mono-400 cursor-not-allowed"
                    )}
                    title="Отправить сообщение (Enter)"
                  >
                    <SendHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-2 px-1 text-[11px] text-mono-400 font-mono">
              <span>Enter — отправить, Ctrl+V — вставка скриншота</span>
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
