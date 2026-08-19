import { useEffect, useState } from 'react';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';
import type { ChatImageAttachment } from '../../api/chat';

interface ImageLightboxModalProps {
  image: ChatImageAttachment | null;
  onClose: () => void;
}

export function ImageLightboxModal({ image, onClose }: ImageLightboxModalProps) {
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (!image) return;

    setZoomLevel(1);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [image, onClose]);

  if (!image) return null;

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.min(prev + 0.3, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.max(prev - 0.3, 0.5));
  };

  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(1);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = image.url;
    a.download = image.name || 'finflow-image.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-mono-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top action bar */}
      <div
        className="absolute top-4 inset-x-4 flex items-center justify-between z-10 max-w-5xl mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 bg-mono-900/90 text-mono-100 px-3.5 py-1.5 rounded-xl border border-mono-800 backdrop-blur-md shadow-lg text-xs">
          <span className="font-medium truncate max-w-xs">{image.name}</span>
          {image.size && (
            <span className="text-mono-400 font-mono text-[11px]">
              {formatFileSize(image.size)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 bg-mono-900/90 text-mono-100 p-1 rounded-xl border border-mono-800 backdrop-blur-md shadow-lg">
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 0.5}
            className="p-1.5 rounded-lg hover:bg-mono-800 disabled:opacity-40 text-mono-300 hover:text-mono-100 transition-colors"
            title="Уменьшить"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="px-2 py-1 rounded-lg hover:bg-mono-800 text-[11px] font-mono text-mono-300 hover:text-mono-100 transition-colors"
            title="Сбросить масштаб"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3}
            className="p-1.5 rounded-lg hover:bg-mono-800 disabled:opacity-40 text-mono-300 hover:text-mono-100 transition-colors"
            title="Увеличить"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-mono-800 my-auto mx-0.5" />
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg hover:bg-mono-800 text-mono-300 hover:text-mono-100 transition-colors"
            title="Скачать изображение"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-mono-300 hover:text-rose-400 transition-colors ml-1"
            title="Закрыть (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Image container */}
      <div
        className="relative max-w-5xl max-h-[85vh] p-4 flex items-center justify-center overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={image.url}
          alt={image.name || 'Прикрепленное изображение'}
          style={{ transform: `scale(${zoomLevel})` }}
          className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl transition-transform duration-150 select-none cursor-default"
        />
      </div>
    </div>
  );
}
