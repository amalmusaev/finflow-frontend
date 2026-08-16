import { useState } from 'react';
import { User, Copy, Check, Sparkles } from 'lucide-react';
import type { ChatMessage } from '../../api/chat';
import { MarkdownContent } from './MarkdownContent';
import { cn } from '../../lib/utils';

interface ChatMessageItemProps {
  message: ChatMessage;
}

export function ChatMessageItem({ message }: ChatMessageItemProps) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === 'assistant';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const timeString = new Date(message.timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={cn(
        "flex gap-3.5 group max-w-4xl w-full mx-auto",
        isAssistant ? "items-start" : "items-start flex-row-reverse"
      )}
    >
      {/* Avatar */}
      {isAssistant ? (
        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-5 h-5 text-mono-900" />
        </div>
      ) : (
        <div className="w-8 h-8 rounded-lg bg-mono-200 text-mono-800 flex items-center justify-center flex-shrink-0 text-xs shadow-xs mt-0.5">
          <User className="w-4 h-4" />
        </div>
      )}

      {/* Message Bubble Container */}
      <div
        className={cn(
          "flex flex-col max-w-[85%] sm:max-w-[78%]",
          isAssistant ? "items-start" : "items-end"
        )}
      >
        {/* Header (Role & Time) */}
        <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-mono-500 font-mono">
          <span className="font-sans font-medium text-mono-700">
            {isAssistant ? 'Finflow AI' : 'Вы'}
          </span>
          <span>•</span>
          <span>{timeString}</span>
        </div>

        {/* Bubble */}
        <div
          className={cn(
            "relative rounded-xl px-4 py-3 text-sm shadow-xs border transition-colors",
            isAssistant
              ? "bg-mono-100 border-mono-200 text-mono-900"
              : "bg-mono-900 border-mono-900 text-mono-50"
          )}
        >
          {isAssistant ? (
            <div className="prose-sm">
              <MarkdownContent content={message.content} />
            </div>
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed select-text font-sans">
              {message.content}
            </p>
          )}

          {/* Streaming cursor */}
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-mono-900 animate-pulse align-middle" />
          )}

          {/* Copy Button (visible on hover) */}
          {!message.isStreaming && isAssistant && (
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1.5 rounded bg-mono-200/80 hover:bg-mono-300 text-mono-600 hover:text-mono-900 transition-opacity opacity-0 group-hover:opacity-100"
              title="Скопировать ответ"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
