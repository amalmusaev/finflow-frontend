import { useState, useRef, useEffect } from 'react';
import { Plus, MessageSquare, Trash2, Edit2, Check, X, PanelRightClose, PanelRight } from 'lucide-react';
import type { ChatSession } from '../../api/chat';
import { cn } from '../../lib/utils';

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  isOpen: boolean;
  onToggle: () => void;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
}

export function ChatSidebar({
  sessions,
  activeSessionId,
  isOpen,
  onToggle,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onRenameSession,
}: ChatSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = editTitle.trim();
    if (trimmed) {
      onRenameSession(id, trimmed);
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteSession(id);
  };

  const formatSessionDate = (isoString: string) => {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  };

  return (
    <aside
      className={cn(
        "bg-mono-100/70 flex flex-col transition-all duration-300 flex-shrink-0 h-full select-none",
        isOpen ? "w-64" : "w-0 overflow-hidden"
      )}
    >
      {/* Sidebar Header */}
      <div className="p-3 flex items-center justify-between gap-2">
        <button
          onClick={onToggle}
          className="p-2 rounded-none text-mono-500 hover:text-mono-900 hover:bg-mono-200 transition-colors"
          title="Скрыть панель чатов"
        >
          <PanelRightClose className="w-4 h-4" />
        </button>

        <button
          onClick={onCreateSession}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-none bg-mono-900 text-mono-50 hover:bg-mono-800 text-xs font-medium transition-colors shadow-xs"
          title="Создать новый чат"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Новый диалог</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sessions.length === 0 ? (
          <div className="py-8 text-center px-4">
            <p className="text-xs text-mono-400">Нет сохраненных чатов</p>
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const isEditing = editingId === session.id;

            return (
              <div
                key={session.id}
                onClick={() => !isEditing && onSelectSession(session.id)}
                className={cn(
                  "group relative flex items-center justify-between gap-2 px-2.5 h-9 rounded-none text-xs cursor-pointer transition-colors",
                  isActive
                    ? "bg-mono-200 text-mono-950 font-medium shadow-xs"
                    : "text-mono-600 hover:bg-mono-200/50 hover:text-mono-900"
                )}
              >
                <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0 pr-1">
                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-mono-400 group-hover:text-mono-700" />
                  
                  {isEditing ? (
                    <form
                      onSubmit={(e) => handleSaveRename(session.id, e)}
                      className="flex items-center gap-1 flex-1 min-w-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleSaveRename(session.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="w-full bg-mono-50 border border-mono-300 rounded px-1.5 py-0.5 text-xs text-mono-900 focus:outline-none focus:border-mono-500"
                      />
                      <button
                        type="submit"
                        className="p-1 text-mono-600 hover:text-mono-900"
                        title="Сохранить"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelRename}
                        className="p-1 text-mono-400 hover:text-mono-700"
                        title="Отмена"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </form>
                  ) : (
                    <span className="truncate font-sans select-none">{session.title}</span>
                  )}
                </div>

                {!isEditing && (
                  <div className="relative flex items-center justify-end w-12 h-6 flex-shrink-0">
                    {/* Date (fades out on hover) */}
                    <span className="text-[10px] font-mono text-mono-400 group-hover:opacity-0 transition-opacity">
                      {formatSessionDate(session.updatedAt || session.createdAt)}
                    </span>

                    {/* Action buttons (fades in on hover in the exact same slot) */}
                    <div className="absolute inset-0 flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                      <button
                        onClick={(e) => handleStartRename(session, e)}
                        className="p-1 rounded hover:bg-mono-300/70 text-mono-500 hover:text-mono-900 transition-colors"
                        title="Переименовать"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(session.id, e)}
                        className="p-1 rounded hover:bg-mono-300/70 text-mono-500 hover:text-rose-600 transition-colors"
                        title="Удалить чат"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

export function ToggleSidebarButton({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  if (isOpen) return null;
  
  return (
    <button
      onClick={onToggle}
      className="p-2 rounded-none border border-mono-200/60 bg-mono-100/80 hover:bg-mono-200 text-mono-500 hover:text-mono-900 transition-all shadow-xs backdrop-blur-sm"
      title="Показать историю чатов"
    >
      <PanelRight className="w-4 h-4" />
    </button>
  );
}
