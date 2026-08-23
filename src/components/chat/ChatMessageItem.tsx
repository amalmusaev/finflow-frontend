import { useState } from 'react';
import { User, Copy, Check, Sparkles, Maximize2 } from 'lucide-react';
import type { ChatMessage, ChatImageAttachment } from '../../api/chat';
import { MarkdownContent } from './MarkdownContent';
import { ImageLightboxModal } from './ImageLightboxModal';
import { cn } from '../../lib/utils';

interface ChatMessageItemProps {
  message: ChatMessage;
}

export function ChatMessageItem({ message }: ChatMessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [activeImage, setActiveImage] = useState<ChatImageAttachment | null>(null);
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

  const hasImages = Boolean(message.images && message.images.length > 0);

  return (
    <>
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
          <div className="w-8 h-8 rounded-none bg-mono-200 text-mono-800 flex items-center justify-center flex-shrink-0 text-xs shadow-xs mt-0.5">
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
              "relative rounded-none px-4 py-3 text-sm shadow-xs border transition-colors space-y-2.5",
              isAssistant
                ? "bg-mono-100 border-mono-200 text-mono-900"
                : "bg-mono-900 border-mono-900 text-mono-50"
            )}
          >
            {/* Attached Images Grid */}
            {hasImages && (
              <div
                className={cn(
                  "grid gap-2",
                  message.images!.length === 1
                    ? "grid-cols-1"
                    : message.images!.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-2 sm:grid-cols-3"
                )}
              >
                {message.images!.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setActiveImage(img)}
                    className="group/img relative rounded-none overflow-hidden border border-mono-700/50 bg-mono-950/20 cursor-pointer aspect-video sm:aspect-4/3 max-h-56 flex items-center justify-center transition-all hover:border-mono-400 hover:"
                  >
                    <img
                      src={img.url}
                      alt={img.name || 'Прикрепленный файл'}
                      className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-mono-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-mono-100 gap-1.5 backdrop-blur-[1px]">
                      <Maximize2 className="w-4 h-4" />
                      <span className="text-[11px] font-medium font-sans">Увеличить</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Content text */}
            {message.content && (
              <div>
                {isAssistant ? (
                  <div className="prose-sm">
                    <MarkdownContent content={message.content} />
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap leading-relaxed select-text font-sans">
                    {message.content}
                  </p>
                )}
              </div>
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

      {/* Lightbox Modal */}
      {activeImage && (
        <ImageLightboxModal
          image={activeImage}
          onClose={() => setActiveImage(null)}
        />
      )}
    </>
  );
}
